"""
Flask-based AI Trade Agent API
Simple alternative to FastAPI (Python 3.14 compatible)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import logging

from app.nlp_engine import get_nlp_engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Enable CORS
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174",
            "https://gweai.vercel.app",
            "https://*.vercel.app",
        ]
    }
})

# Track server uptime
SERVER_START_TIME = time.time()
NLP_ENGINE = None


@app.before_request
def initialize_engine():
    """Initialize NLP engine before first request"""
    global NLP_ENGINE
    if NLP_ENGINE is None:
        try:
            logger.info("🚀 Initializing NLP Engine...")
            NLP_ENGINE = get_nlp_engine()
            logger.info("✅ NLP Engine loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize NLP engine: {e}")


@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({
        "message": "GweAI Trade Agent API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    })


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        uptime = time.time() - SERVER_START_TIME
        return jsonify({
            "status": "healthy",
            "version": "1.0.0",
            "uptime_seconds": round(uptime, 2),
            "models_loaded": NLP_ENGINE is not None,
            "message": "All systems operational"
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            "status": "unhealthy",
            "version": "1.0.0",
            "uptime_seconds": 0,
            "models_loaded": False,
            "message": str(e)
        }), 500


@app.route('/api/parse-command', methods=['POST'])
def parse_trade_command():
    """
    Parse natural language trade command
    
    Request body:
    {
        "command": "buy $100 of BTC",
        "user_id": "0x123...",
        "language": "en"
    }
    """
    start_time = time.time()
    
    try:
        data = request.get_json()
        
        if not data or 'command' not in data:
            return jsonify({
                "success": False,
                "error": "Missing 'command' in request body"
            }), 400
        
        command = data['command']
        user_id = data.get('user_id')
        language = data.get('language', 'en')
        
        logger.info(f"📝 Processing command: {command}")
        
        # Process command
        parsed_dict = NLP_ENGINE.process_command(
            command=command,
            language=language
        )
        
        # Calculate processing time
        processing_time = (time.time() - start_time) * 1000
        
        logger.info(f"✅ Parsed: {parsed_dict['action']} | Confidence: {parsed_dict['confidence']}% | Time: {processing_time:.2f}ms")
        
        return jsonify({
            "success": True,
            "parsed": parsed_dict,
            "processing_time_ms": round(processing_time, 2)
        })
        
    except Exception as e:
        logger.error(f"❌ Error parsing command: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "processing_time_ms": round((time.time() - start_time) * 1000, 2)
        }), 500


@app.route('/api/parse-batch', methods=['POST'])
def parse_batch_commands():
    """
    Parse multiple commands in batch
    
    Request body:
    {
        "commands": ["buy $100 of BTC", "sell 0.5 ETH"],
        "language": "en"
    }
    """
    start_time = time.time()
    
    try:
        data = request.get_json()
        
        if not data or 'commands' not in data:
            return jsonify({
                "success": False,
                "error": "Missing 'commands' in request body"
            }), 400
        
        commands = data['commands']
        language = data.get('language', 'en')
        
        results = []
        for command in commands:
            try:
                parsed_dict = NLP_ENGINE.process_command(
                    command=command,
                    language=language
                )
                results.append(parsed_dict)
            except Exception as e:
                logger.error(f"Error parsing command '{command}': {e}")
                results.append({
                    "action": "unknown",
                    "confidence": 0,
                    "raw_command": command,
                    "parsed_intent": f"Error: {str(e)}",
                    "warnings": [str(e)]
                })
        
        processing_time = (time.time() - start_time) * 1000
        
        return jsonify({
            "success": True,
            "results": results,
            "total_processed": len(results),
            "processing_time_ms": round(processing_time, 2)
        })
        
    except Exception as e:
        logger.error(f"Batch processing error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/tokens', methods=['GET'])
def get_supported_tokens():
    """Get list of all supported tokens"""
    try:
        tokens_data = [
            {"symbol": "USDC", "address": "0xBEE08798a3634e29F47e3d277C9d11507D55F66a", "name": "USD Coin", "decimals": 6, "supported": True},
            {"symbol": "BTC", "address": "0x7d9E31f5cCac4b9c8566f343A6bD6f3263DFcC91", "name": "Bitcoin", "decimals": 8, "supported": True},
            {"symbol": "ETH", "address": "0x0000000000000000000000000000000000000000", "name": "Ethereum", "decimals": 18, "supported": True},
            {"symbol": "SOL", "address": "0x241ECE6Dce0E0825F9992410B3fA5d4b8fC8d199", "name": "Solana", "decimals": 9, "supported": True},
            {"symbol": "BNB", "address": "0xAA9Be1a8A7f7254C1759bAa7e0f7864579c33a96", "name": "Binance Coin", "decimals": 18, "supported": True},
            {"symbol": "XRP", "address": "0x01E278B5421AAC93A206C15b2933419DA19E17b3", "name": "Ripple", "decimals": 6, "supported": True},
            {"symbol": "TON", "address": "0xC85D84a1092b81aCBA9bC75fad6063a7DA642E36", "name": "Toncoin", "decimals": 9, "supported": True},
            {"symbol": "AVAX", "address": "0x5DC449E37b6DAAD182d4Fb13C8dFE53C383C2E46", "name": "Avalanche", "decimals": 18, "supported": True},
            {"symbol": "TRON", "address": "0x45442ecB66A1a10c0F9817fb7F2B50a3bB99bd69", "name": "Tron", "decimals": 6, "supported": True},
            {"symbol": "CARDANO", "address": "0xcB1A4c81E7a56cbE2246DA3aE256Ba0154940648", "name": "Cardano", "decimals": 6, "supported": True},
            {"symbol": "DOGE", "address": "0x803aD69f487536Ec1eE8a83Cd329e3d1703f8337", "name": "Dogecoin", "decimals": 8, "supported": True},
        ]
        
        return jsonify({
            "success": True,
            "tokens": tokens_data,
            "total": len(tokens_data)
        })
        
    except Exception as e:
        logger.error(f"Error fetching tokens: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint with sample commands"""
    test_commands = [
        "buy $100 of BTC",
        "swap 50 USDC to ETH",
        "sell 0.5 bitcoin",
        "stake 1000 dollars for 30 days",
        "100 dollar ka bitcoin kharido",
        "btc me 50 dollar invest karo",
    ]
    
    results = []
    for cmd in test_commands:
        try:
            parsed = NLP_ENGINE.process_command(cmd)
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
    
    return jsonify({"test_results": results})


@app.errorhandler(Exception)
def handle_error(error):
    """Global error handler"""
    logger.error(f"Unhandled exception: {error}")
    return jsonify({
        "success": False,
        "error": "Internal server error",
        "detail": str(error)
    }), 500


def init_engine():
    """Initialize NLP engine"""
    global NLP_ENGINE
    logger.info("🚀 Initializing NLP Engine...")
    NLP_ENGINE = get_nlp_engine()
    logger.info("✅ NLP Engine initialized")


if __name__ == "__main__":
    logger.info("🚀 Starting GweAI Trade Agent Backend (Flask)...")
    init_engine()
    app.run(host="127.0.0.1", port=8000, debug=False, use_reloader=False)
