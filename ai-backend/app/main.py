"""
FastAPI Main Application - AI Trade Agent Backend
Exposes NLP engine as REST API with CORS support
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import logging
from typing import List

from app.models import (
    TradeCommandRequest,
    TradeCommandResponse,
    ParsedTradeCommand,
    TokenListResponse,
    TokenInfo,
    HealthResponse,
    BatchParseRequest,
    BatchParseResponse
)
from app.nlp_engine import get_nlp_engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="GweAI Trade Agent API",
    description="Advanced NLP-based AI agent for processing natural language trading commands",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration - Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://gweai.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Track server uptime
SERVER_START_TIME = time.time()


@app.on_event("startup")
async def startup_event():
    """Initialize NLP engine on startup"""
    try:
        logger.info("🚀 Starting GweAI Trade Agent Backend...")
        # Pre-load NLP engine
        engine = get_nlp_engine()
        logger.info("✅ NLP Engine loaded successfully")
        logger.info("🌐 Server ready to accept requests")
    except Exception as e:
        logger.error(f"❌ Failed to initialize NLP engine: {e}")
        raise


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "GweAI Trade Agent API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint"""
    try:
        engine = get_nlp_engine()
        uptime = time.time() - SERVER_START_TIME
        
        return HealthResponse(
            status="healthy",
            version="1.0.0",
            uptime_seconds=round(uptime, 2),
            models_loaded=True,
            message="All systems operational"
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            status="unhealthy",
            version="1.0.0",
            uptime_seconds=0,
            models_loaded=False,
            message=str(e)
        )


@app.post("/api/parse-command", response_model=TradeCommandResponse, tags=["Commands"])
async def parse_trade_command(request: TradeCommandRequest):
    """
    Parse natural language trade command
    
    **Example requests:**
    - "buy $100 of BTC"
    - "swap 50 USDC to ETH"
    - "sell 0.5 bitcoin"
    - "stake 1000 dollars for 30 days"
    """
    start_time = time.time()
    
    try:
        logger.info(f"📝 Processing command: {request.command}")
        
        # Get NLP engine
        engine = get_nlp_engine()
        
        # Process command
        parsed_dict = engine.process_command(
            command=request.command,
            language=request.language
        )
        
        # Convert to Pydantic model
        parsed = ParsedTradeCommand(**parsed_dict)
        
        # Calculate processing time
        processing_time = (time.time() - start_time) * 1000  # Convert to ms
        
        logger.info(f"✅ Parsed: {parsed.action} | Confidence: {parsed.confidence}% | Time: {processing_time:.2f}ms")
        
        return TradeCommandResponse(
            success=True,
            parsed=parsed,
            processing_time_ms=round(processing_time, 2)
        )
        
    except Exception as e:
        logger.error(f"❌ Error parsing command: {e}")
        return TradeCommandResponse(
            success=False,
            error=str(e),
            processing_time_ms=round((time.time() - start_time) * 1000, 2)
        )


@app.post("/api/parse-batch", response_model=BatchParseResponse, tags=["Commands"])
async def parse_batch_commands(request: BatchParseRequest):
    """
    Parse multiple commands in batch
    Useful for testing or bulk processing
    """
    start_time = time.time()
    
    try:
        engine = get_nlp_engine()
        results = []
        
        for command in request.commands:
            try:
                parsed_dict = engine.process_command(
                    command=command,
                    language=request.language
                )
                results.append(ParsedTradeCommand(**parsed_dict))
            except Exception as e:
                logger.error(f"Error parsing command '{command}': {e}")
                # Add failed parse with error info
                results.append(ParsedTradeCommand(
                    action="unknown",
                    confidence=0,
                    raw_command=command,
                    parsed_intent=f"Error: {str(e)}",
                    warnings=[str(e)]
                ))
        
        processing_time = (time.time() - start_time) * 1000
        
        return BatchParseResponse(
            success=True,
            results=results,
            total_processed=len(results),
            processing_time_ms=round(processing_time, 2)
        )
        
    except Exception as e:
        logger.error(f"Batch processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tokens", response_model=TokenListResponse, tags=["Tokens"])
async def get_supported_tokens():
    """
    Get list of all supported tokens
    Returns token symbols, addresses, and metadata
    """
    try:
        # Verified token addresses from contracts.ts
        tokens_data = [
            TokenInfo(symbol="USDC", address="0xBEE08798a3634e29F47e3d277C9d11507D55F66a", name="USD Coin", decimals=6),
            TokenInfo(symbol="BTC", address="0x7d9E31f5cCac4b9c8566f343A6bD6f3263DFcC91", name="Bitcoin", decimals=8),
            TokenInfo(symbol="ETH", address="0x0000000000000000000000000000000000000000", name="Ethereum", decimals=18),
            TokenInfo(symbol="SOL", address="0x241ECE6Dce0E0825F9992410B3fA5d4b8fC8d199", name="Solana", decimals=9),
            TokenInfo(symbol="BNB", address="0xAA9Be1a8A7f7254C1759bAa7e0f7864579c33a96", name="Binance Coin", decimals=18),
            TokenInfo(symbol="XRP", address="0x01E278B5421AAC93A206C15b2933419DA19E17b3", name="Ripple", decimals=6),
            TokenInfo(symbol="TON", address="0xC85D84a1092b81aCBA9bC75fad6063a7DA642E36", name="Toncoin", decimals=9),
            TokenInfo(symbol="AVAX", address="0x5DC449E37b6DAAD182d4Fb13C8dFE53C383C2E46", name="Avalanche", decimals=18),
            TokenInfo(symbol="TRON", address="0x45442ecB66A1a10c0F9817fb7F2B50a3bB99bd69", name="Tron", decimals=6),
            TokenInfo(symbol="CARDANO", address="0xcB1A4c81E7a56cbE2246DA3aE256Ba0154940648", name="Cardano", decimals=6),
            TokenInfo(symbol="DOGE", address="0x803aD69f487536Ec1eE8a83Cd329e3d1703f8337", name="Dogecoin", decimals=8),
        ]
        
        return TokenListResponse(
            success=True,
            tokens=tokens_data,
            total=len(tokens_data)
        )
        
    except Exception as e:
        logger.error(f"Error fetching tokens: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/test", tags=["Testing"])
async def test_endpoint():
    """
    Test endpoint with sample commands
    Returns parsed results for common commands
    """
    test_commands = [
        "buy $100 of BTC",
        "swap 50 USDC to ETH",
        "sell 0.5 bitcoin",
        "stake 1000 dollars for 30 days",
        "100 dollar ka bitcoin kharido",  # Hindi
        "btc me 50 dollar invest karo",    # Hinglish
    ]
    
    engine = get_nlp_engine()
    results = []
    
    for cmd in test_commands:
        try:
            parsed = engine.process_command(cmd)
            results.append({
                "command": cmd,
                "action": parsed['action'],
                "confidence": parsed['confidence'],
                "intent": parsed['parsed_intent']
            })
        except Exception as e:
            results.append({
                "command": cmd,
                "error": str(e)
            })
    
    return {"test_results": results}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc)
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
