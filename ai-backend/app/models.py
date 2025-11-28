"""
Pydantic Models for API Request/Response Validation
"""

from typing import Optional, List, Literal
from pydantic import BaseModel, Field, validator


class TradeCommandRequest(BaseModel):
    """Request model for parsing trade commands"""
    command: str = Field(..., min_length=1, max_length=500, description="Natural language trade command")
    user_id: Optional[str] = Field(None, description="User wallet address")
    language: Optional[Literal["en", "hi", "hinglish"]] = Field("en", description="Command language")
    
    @validator('command')
    def validate_command(cls, v):
        if not v or v.strip() == "":
            raise ValueError("Command cannot be empty")
        return v.strip()


class ParsedTradeCommand(BaseModel):
    """Parsed trade command structure"""
    action: Literal["buy", "sell", "swap", "stake", "unstake", "unknown"]
    confidence: float = Field(..., ge=0, le=100, description="Confidence score (0-100)")
    amount: Optional[float] = Field(None, description="Amount in USD or tokens")
    amount_type: Literal["usd", "token"] = "usd"
    from_token: Optional[str] = Field(None, description="Source token symbol")
    to_token: Optional[str] = Field(None, description="Destination token symbol")
    duration: Optional[int] = Field(None, description="Duration in days (for staking)")
    slippage: Optional[float] = Field(None, ge=0, le=100, description="Slippage tolerance %")
    raw_command: str = Field(..., description="Original user command")
    parsed_intent: str = Field(..., description="Human-readable interpretation")
    warnings: List[str] = Field(default_factory=list, description="Parsing warnings")
    detected_language: Optional[str] = Field(None, description="Detected input language")


class TradeCommandResponse(BaseModel):
    """API response wrapper"""
    success: bool
    parsed: Optional[ParsedTradeCommand] = None
    error: Optional[str] = None
    processing_time_ms: Optional[float] = None


class TokenInfo(BaseModel):
    """Token information model"""
    symbol: str
    address: str
    name: str
    decimals: int
    supported: bool = True


class TokenListResponse(BaseModel):
    """Response for token list endpoint"""
    success: bool
    tokens: List[TokenInfo]
    total: int


class HealthResponse(BaseModel):
    """Health check response"""
    status: Literal["healthy", "unhealthy"]
    version: str
    uptime_seconds: float
    models_loaded: bool
    message: Optional[str] = None


class ValidationResult(BaseModel):
    """Validation result for parsed commands"""
    valid: bool
    errors: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)


class BatchParseRequest(BaseModel):
    """Batch parsing request"""
    commands: List[str] = Field(..., min_items=1, max_items=10)
    user_id: Optional[str] = None
    language: Optional[Literal["en", "hi", "hinglish"]] = "en"


class BatchParseResponse(BaseModel):
    """Batch parsing response"""
    success: bool
    results: List[ParsedTradeCommand]
    total_processed: int
    processing_time_ms: float
