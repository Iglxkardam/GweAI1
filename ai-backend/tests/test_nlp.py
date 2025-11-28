"""
Test Suite for NLP Engine
Run with: pytest tests/ -v
"""

import pytest
from app.nlp_engine import NLPEngine


@pytest.fixture
def nlp_engine():
    """Create NLP engine instance for testing"""
    return NLPEngine()


class TestActionDetection:
    """Test action detection accuracy"""
    
    def test_buy_action(self, nlp_engine):
        commands = [
            "buy $100 of BTC",
            "purchase bitcoin",
            "get some eth",
            "invest in solana"
        ]
        for cmd in commands:
            action, conf = nlp_engine.detect_action(cmd)
            assert action == "buy"
            assert conf > 50
    
    def test_sell_action(self, nlp_engine):
        commands = [
            "sell 0.5 BTC",
            "dump my bitcoin",
            "liquidate eth"
        ]
        for cmd in commands:
            action, conf = nlp_engine.detect_action(cmd)
            assert action == "sell"
            assert conf > 50
    
    def test_swap_action(self, nlp_engine):
        commands = [
            "swap BTC to ETH",
            "exchange usdc for sol",
            "convert bitcoin into ethereum"
        ]
        for cmd in commands:
            action, conf = nlp_engine.detect_action(cmd)
            assert action == "swap"
            assert conf > 50
    
    def test_stake_action(self, nlp_engine):
        commands = [
            "stake 1000 USDC",
            "lock my btc",
            "deposit sol in vault"
        ]
        for cmd in commands:
            action, conf = nlp_engine.detect_action(cmd)
            assert action == "stake"
            assert conf > 50


class TestAmountExtraction:
    """Test amount extraction accuracy"""
    
    def test_usd_amounts(self, nlp_engine):
        test_cases = [
            ("buy $100 of btc", 100.0, "usd"),
            ("invest 50 dollars", 50.0, "usd"),
            ("100 usd worth of eth", 100.0, "usd"),
        ]
        for cmd, expected_amount, expected_type in test_cases:
            amount, amount_type = nlp_engine.extract_amount(cmd)
            assert amount == expected_amount
            assert amount_type == expected_type
    
    def test_token_amounts(self, nlp_engine):
        test_cases = [
            ("sell 0.5 btc", 0.5, "token"),
            ("swap 10 eth", 10.0, "token"),
        ]
        for cmd, expected_amount, expected_type in test_cases:
            amount, amount_type = nlp_engine.extract_amount(cmd)
            assert amount == expected_amount
            assert amount_type == expected_type


class TestTokenExtraction:
    """Test token extraction accuracy"""
    
    def test_buy_tokens(self, nlp_engine):
        result = nlp_engine.extract_tokens("buy btc", "buy")
        assert result['to_token'] == "BTC"
        assert result['from_token'] == "USDC"
    
    def test_sell_tokens(self, nlp_engine):
        result = nlp_engine.extract_tokens("sell ethereum", "sell")
        assert result['from_token'] == "ETH"
        assert result['to_token'] == "USDC"
    
    def test_swap_tokens(self, nlp_engine):
        result = nlp_engine.extract_tokens("swap btc to eth", "swap")
        assert result['from_token'] == "BTC"
        assert result['to_token'] == "ETH"


class TestFullPipeline:
    """Test complete command processing"""
    
    def test_buy_command(self, nlp_engine):
        result = nlp_engine.process_command("buy $100 of bitcoin")
        assert result['action'] == "buy"
        assert result['amount'] == 100
        assert result['amount_type'] == "usd"
        assert result['to_token'] == "BTC"
        assert result['confidence'] > 70
    
    def test_swap_command(self, nlp_engine):
        result = nlp_engine.process_command("swap 50 usdc to eth")
        assert result['action'] == "swap"
        assert result['amount'] == 50
        assert result['from_token'] == "USDC"
        assert result['to_token'] == "ETH"
        assert result['confidence'] > 70
    
    def test_stake_command(self, nlp_engine):
        result = nlp_engine.process_command("stake 1000 usdc for 30 days")
        assert result['action'] == "stake"
        assert result['amount'] == 1000
        assert result['from_token'] == "USDC"
        assert result['duration'] == 30
        assert result['confidence'] > 70
    
    def test_hindi_command(self, nlp_engine):
        result = nlp_engine.process_command("100 dollar ka btc kharido")
        assert result['action'] == "buy"
        assert result['amount'] == 100
        assert result['to_token'] == "BTC"


class TestLanguageDetection:
    """Test language detection"""
    
    def test_english(self, nlp_engine):
        lang = nlp_engine.detect_language("buy bitcoin")
        assert lang == "en"
    
    def test_hinglish(self, nlp_engine):
        # Hinglish commands should be detected
        result = nlp_engine.process_command("btc kharido")
        assert result['detected_language'] in ["en", "hi", "hinglish"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
