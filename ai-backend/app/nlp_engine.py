"""
Core NLP Engine - Lightweight Natural Language Processing
Handles intent classification, entity extraction, and multi-language support
No external dependencies - pure Python regex-based
"""

import re
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class NLPEngine:
    """Lightweight NLP engine for processing trade commands"""
    
    def __init__(self):
        """Initialize NLP dictionaries (no external models needed)"""
        logger.info("🚀 Initializing lightweight NLP engine...")
        
        # Token dictionary with variations
        self.token_dictionary = {
            # USDC
            'usdc': 'USDC', 'usd': 'USDC', 'dollar': 'USDC', 'dollars': 'USDC',
            
            # Bitcoin
            'btc': 'BTC', 'bitcoin': 'BTC', 'bitcoins': 'BTC', 'wbtc': 'BTC',
            
            # Ethereum
            'eth': 'ETH', 'ethereum': 'ETH', 'ether': 'ETH',
            
            # Solana
            'sol': 'SOL', 'solana': 'SOL',
            
            # BNB
            'bnb': 'BNB', 'binance': 'BNB', 'binance coin': 'BNB',
            
            # XRP
            'xrp': 'XRP', 'ripple': 'XRP',
            
            # TON
            'ton': 'TON', 'toncoin': 'TON',
            
            # AVAX
            'avax': 'AVAX', 'avalanche': 'AVAX',
            
            # TRON
            'trx': 'TRON', 'tron': 'TRON',
            
            # Cardano
            'ada': 'CARDANO', 'cardano': 'CARDANO',
            
            # Dogecoin
            'doge': 'DOGE', 'dogecoin': 'DOGE',
        }
        
        # Action keywords with weights (higher = more specific)
        self.action_patterns = {
            'stake': {
                'keywords': ['stake', 'lock', 'deposit', 'earn', 'yield', 'staking'],
                'weight': 10,
                'hindi': ['stake', 'lock', 'jama']
            },
            'unstake': {
                'keywords': ['unstake', 'unlock', 'withdraw', 'claim', 'unstaking'],
                'weight': 10,
                'hindi': ['unstake', 'unlock', 'nikalo']
            },
            'swap': {
                'keywords': ['swap', 'exchange', 'convert', 'trade'],
                'weight': 9,
                'hindi': ['swap', 'badlo', 'exchange']
            },
            'buy': {
                'keywords': ['buy', 'purchase', 'get', 'acquire', 'invest'],
                'weight': 8,
                'hindi': ['kharido', 'khareedo', 'lelo', 'buy', 'invest']
            },
            'sell': {
                'keywords': ['sell', 'dump', 'liquidate', 'exit'],
                'weight': 8,
                'hindi': ['becho', 'bech', 'sell']
            },
        }
        
        logger.info("✅ Lightweight NLP Engine initialized successfully")
    
    def detect_language(self, text: str) -> str:
        """Detect input language (en/hi/hinglish)"""
        # Simple language detection based on character sets
        has_english = bool(re.search(r'[a-zA-Z]+', text))
        has_hindi = bool(re.search(r'[\u0900-\u097F]+', text))
        
        # Check for Hindi keywords
        hindi_keywords = ['kharido', 'becho', 'invest', 'karo', 'lelo', 'dedo', 'jama', 'nikalo']
        has_hindi_words = any(keyword in text.lower() for keyword in hindi_keywords)
        
        if has_hindi or has_hindi_words:
            if has_english:
                return 'hinglish'
            return 'hi'
        
        return 'en'  # Default to English
    
    def normalize_text(self, text: str) -> str:
        """Normalize and clean input text"""
        # Convert to lowercase
        text = text.lower().strip()
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Normalize currency symbols
        text = text.replace('$', ' dollar ')
        text = text.replace('₹', ' rupee ')
        
        # Remove special characters but keep numbers and decimal points
        text = re.sub(r'[^\w\s\.]', ' ', text)
        
        return text.strip()
    
    def detect_action(self, text: str, language: str = 'en') -> Tuple[str, float]:
        """
        Detect trade action with confidence score
        Returns: (action, confidence)
        """
        text_lower = text.lower()
        scores = {}
        
        # Check each action pattern
        for action, config in self.action_patterns.items():
            score = 0
            keywords = config['keywords']
            
            # Add Hindi keywords if language is Hindi/Hinglish
            if language in ['hi', 'hinglish']:
                keywords = keywords + config.get('hindi', [])
            
            # Check for keyword matches
            for keyword in keywords:
                if keyword in text_lower:
                    # Exact word match gets full weight
                    if re.search(rf'\b{keyword}\b', text_lower):
                        score += config['weight']
                    else:
                        # Partial match gets half weight
                        score += config['weight'] * 0.5
            
            scores[action] = score
        
        # Get action with highest score
        if not scores or max(scores.values()) == 0:
            return 'unknown', 0.0
        
        best_action = max(scores, key=scores.get)
        max_score = scores[best_action]
        
        # Normalize confidence to 0-100
        confidence = min(max_score * 10, 100)
        
        return best_action, confidence
    
    def extract_amount(self, text: str) -> Tuple[Optional[float], str]:
        """
        Extract monetary amount from text
        Returns: (amount, type) where type is 'usd' or 'token'
        """
        text_lower = text.lower()
        
        # Pattern 1: USD amounts ($100, 100 dollars, 100 usd, 100 rupees)
        usd_patterns = [
            r'(?:dollar|usd|\$)\s*(\d+(?:[\.,]\d+)?)',  # dollar/usd/$ before number
            r'(\d+(?:[\.,]\d+)?)\s*(?:dollar|dollars|usd|\$)',  # number before dollar
            r'(?:rupee|rupees|₹)\s*(\d+(?:[\.,]\d+)?)',  # rupees
            r'(\d+(?:[\.,]\d+)?)\s*(?:rupee|rupees)',
        ]
        
        for pattern in usd_patterns:
            match = re.search(pattern, text_lower)
            if match:
                amount_str = match.group(1).replace(',', '.')
                try:
                    amount = float(amount_str)
                    return amount, 'usd'
                except ValueError:
                    continue
        
        # Pattern 2: Token amounts (0.5 BTC, 10 ETH, etc.)
        token_pattern = r'(\d+(?:[\.,]\d+)?)\s*(?:btc|eth|sol|bnb|ada|doge|xrp|avax|ton|trx|usdc)'
        match = re.search(token_pattern, text_lower)
        if match:
            amount_str = match.group(1).replace(',', '.')
            try:
                amount = float(amount_str)
                return amount, 'token'
            except ValueError:
                pass
        
        # Pattern 3: Just numbers (assume USD)
        number_pattern = r'\b(\d+(?:[\.,]\d{1,2})?)\b'
        match = re.search(number_pattern, text)
        if match:
            amount_str = match.group(1).replace(',', '.')
            try:
                amount = float(amount_str)
                # Only consider as amount if reasonable (not a year like 2024)
                if 0.01 <= amount <= 1000000:
                    return amount, 'usd'
            except ValueError:
                pass
        
        return None, 'usd'
    
    def extract_tokens(self, text: str, action: str) -> Dict[str, Optional[str]]:
        """
        Extract token symbols from text based on action type
        Returns: {'from_token': '...', 'to_token': '...'}
        """
        text_lower = text.lower()
        result = {'from_token': None, 'to_token': None}
        
        # For SWAP: "swap BTC to ETH" or "swap BTC for ETH"
        if action == 'swap':
            swap_patterns = [
                r'(?:swap|exchange|convert|trade)\s+(\w+)\s+(?:to|for|into|with)\s+(\w+)',
                r'(\w+)\s+(?:to|for|into)\s+(\w+)',
            ]
            
            for pattern in swap_patterns:
                match = re.search(pattern, text_lower)
                if match:
                    from_token = self._normalize_token(match.group(1))
                    to_token = self._normalize_token(match.group(2))
                    if from_token and to_token:
                        result['from_token'] = from_token
                        result['to_token'] = to_token
                        return result
        
        # For BUY: "buy BTC" or "buy 100 dollars of BTC"
        elif action == 'buy':
            buy_patterns = [
                r'(?:buy|purchase|get|invest)\s+(?:\w+\s+)?(?:of\s+)?(\w+)',
                r'(\w+)\s+(?:buy|purchase|kharido)',
            ]
            
            for pattern in buy_patterns:
                match = re.search(pattern, text_lower)
                if match:
                    token = self._normalize_token(match.group(1))
                    if token:
                        result['to_token'] = token
                        result['from_token'] = 'USDC'  # Default payment method
                        return result
        
        # For SELL: "sell BTC" or "sell 0.5 BTC"
        elif action == 'sell':
            sell_patterns = [
                r'(?:sell|dump|becho)\s+(?:\d+[\.,]?\d*\s+)?(\w+)',
                r'(\w+)\s+(?:sell|becho)',
            ]
            
            for pattern in sell_patterns:
                match = re.search(pattern, text_lower)
                if match:
                    token = self._normalize_token(match.group(1))
                    if token:
                        result['from_token'] = token
                        result['to_token'] = 'USDC'  # Default receive token
                        return result
        
        # For STAKE: "stake BTC"
        elif action == 'stake':
            stake_patterns = [
                r'(?:stake|lock|deposit)\s+(?:\d+[\.,]?\d*\s+)?(\w+)',
                r'(\w+)\s+(?:stake|lock)',
            ]
            
            for pattern in stake_patterns:
                match = re.search(pattern, text_lower)
                if match:
                    token = self._normalize_token(match.group(1))
                    if token:
                        result['from_token'] = token
                        return result
        
        return result
    
    def _normalize_token(self, token_input: str) -> Optional[str]:
        """Normalize token symbol using dictionary"""
        token_lower = token_input.lower().strip()
        return self.token_dictionary.get(token_lower)
    
    def extract_duration(self, text: str) -> Optional[int]:
        """Extract staking duration in days"""
        duration_patterns = [
            (r'(\d+)\s*(?:day|days|d)\b', 1),
            (r'(\d+)\s*(?:week|weeks|w)\b', 7),
            (r'(\d+)\s*(?:month|months|mo)\b', 30),
            (r'(\d+)\s*(?:year|years|y)\b', 365),
        ]
        
        for pattern, multiplier in duration_patterns:
            match = re.search(pattern, text.lower())
            if match:
                value = int(match.group(1))
                return value * multiplier
        
        return None
    
    def extract_slippage(self, text: str) -> Optional[float]:
        """Extract slippage tolerance percentage"""
        pattern = r'(\d+(?:\.\d+)?)\s*%?\s*(?:slippage|slip)'
        match = re.search(pattern, text.lower())
        if match:
            try:
                slippage = float(match.group(1))
                # Validate reasonable range
                if 0.1 <= slippage <= 50:
                    return slippage
            except ValueError:
                pass
        return None
    
    def calculate_confidence(
        self, 
        action: str,
        action_confidence: float,
        amount: Optional[float],
        from_token: Optional[str],
        to_token: Optional[str]
    ) -> float:
        """Calculate overall confidence score"""
        # Start with action confidence
        confidence = action_confidence * 0.4
        
        # Add points for valid amount
        if amount and amount > 0:
            confidence += 30
        
        # Add points for valid tokens based on action
        if action == 'swap':
            if from_token and to_token and from_token != to_token:
                confidence += 30
        elif action == 'buy':
            if to_token:
                confidence += 30
        elif action == 'sell':
            if from_token:
                confidence += 30
        elif action == 'stake':
            if from_token:
                confidence += 30
        
        return min(confidence, 100)
    
    def generate_intent(
        self,
        action: str,
        amount: Optional[float],
        amount_type: str,
        from_token: Optional[str],
        to_token: Optional[str],
        duration: Optional[int]
    ) -> str:
        """Generate human-readable intent description"""
        amount_str = f"${amount:.2f}" if amount and amount_type == 'usd' else \
                     f"{amount} {from_token or 'tokens'}" if amount else "unspecified amount"
        
        intent_templates = {
            'buy': f"Buy {amount_str} worth of {to_token or 'crypto'} using {from_token or 'USDC'}",
            'sell': f"Sell {amount_str} of {from_token or 'crypto'} for {to_token or 'USDC'}",
            'swap': f"Swap {amount_str} from {from_token or 'token A'} to {to_token or 'token B'}",
            'stake': f"Stake {amount_str} of {from_token or 'crypto'}" + 
                     (f" for {duration} days" if duration else ""),
            'unstake': f"Unstake {from_token or 'crypto'} from vault",
            'unknown': "Unable to understand command - please rephrase"
        }
        
        return intent_templates.get(action, "Unknown action")
    
    def process_command(self, command: str, language: Optional[str] = None) -> Dict:
        """
        Main processing pipeline
        Returns complete parsed command dictionary
        """
        # Detect language if not provided
        if not language:
            language = self.detect_language(command)
        
        # Normalize text
        normalized = self.normalize_text(command)
        
        # Extract components
        action, action_confidence = self.detect_action(normalized, language)
        amount, amount_type = self.extract_amount(normalized)
        tokens = self.extract_tokens(normalized, action)
        duration = self.extract_duration(normalized)
        slippage = self.extract_slippage(normalized)
        
        # Calculate confidence
        confidence = self.calculate_confidence(
            action, action_confidence, amount, 
            tokens['from_token'], tokens['to_token']
        )
        
        # Generate intent
        intent = self.generate_intent(
            action, amount, amount_type,
            tokens['from_token'], tokens['to_token'], duration
        )
        
        # Generate warnings
        warnings = self._generate_warnings(
            action, amount, tokens['from_token'], tokens['to_token'], confidence
        )
        
        return {
            'action': action,
            'confidence': round(confidence, 2),
            'amount': amount,
            'amount_type': amount_type,
            'from_token': tokens['from_token'],
            'to_token': tokens['to_token'],
            'duration': duration,
            'slippage': slippage,
            'raw_command': command,
            'parsed_intent': intent,
            'warnings': warnings,
            'detected_language': language
        }
    
    def _generate_warnings(
        self,
        action: str,
        amount: Optional[float],
        from_token: Optional[str],
        to_token: Optional[str],
        confidence: float
    ) -> List[str]:
        """Generate warnings for parsed command"""
        warnings = []
        
        if action == 'unknown':
            warnings.append('Unable to determine trade action')
        
        if not amount or amount <= 0:
            warnings.append('Invalid or missing amount')
        
        if action == 'swap' and (not from_token or not to_token):
            warnings.append('Swap requires both source and destination tokens')
        
        if action == 'swap' and from_token == to_token:
            warnings.append('Cannot swap a token to itself')
        
        if action == 'buy' and not to_token:
            warnings.append('Buy operation requires specifying the token to purchase')
        
        if action == 'sell' and not from_token:
            warnings.append('Sell operation requires specifying the token to sell')
        
        if action == 'stake' and not from_token:
            warnings.append('Stake operation requires specifying the token to stake')
        
        if confidence < 60:
            warnings.append('Low confidence - please provide more details')
        
        return warnings


# Global NLP engine instance
_nlp_engine: Optional[NLPEngine] = None


def get_nlp_engine() -> NLPEngine:
    """Get or create global NLP engine instance"""
    global _nlp_engine
    if _nlp_engine is None:
        _nlp_engine = NLPEngine()
    return _nlp_engine
