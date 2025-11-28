import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaUser } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { ChatHistorySidebar, MarkdownMessage, StarfieldBackground } from '../../components';
import { TypingText } from '../../components/TypingText';
import { generateAIResponse, parseDCARequest, parseTradeRequest, type ChatMessage } from './services/groqService';
import { DCAInlineCard, type DCAParameters, TradeConfirmationCard, type TradeParams } from './components';
import { 
  createNewConversation, 
  getConversation, 
  addMessageToConversation,
  updateMessageInConversation,
  getCurrentChatId,
  setCurrentChatId,
  clearCurrentChatId,
  generateChatId
} from '../../utils/chatStorage';
import { useAgwWallet } from '../deposit/hooks/useAgwWallet';
import { useSwapContract } from '../swap/hooks/useSwapContract';
import { VERIFIED_TOKENS } from '../../config/contracts';
import { TOKENS } from '../../config/tokens';
import {
  getUserPortfolio, 
  formatPortfolioForAI, 
  isPortfolioQuery, 
  extractTokenQuery,
  formatTokenBalance
} from './services/portfolioService';
import { routeQuery, debugRoute } from './services/queryRouter';interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'dca-card' | 'trade-card';
  dcaParams?: DCAParameters;
  tradeParams?: TradeParams;
  executed?: boolean; // Track if order has been executed
}

interface DCAPageProps {
  onSidebarToggle?: (isOpen: boolean) => void;
}

export const DCAPage: React.FC<DCAPageProps> = ({ onSidebarToggle }) => {
  const { 
    connected: isConnected, 
    address,
    btcBalance,
    ethBalance,
    solBalance,
    usdcBalance,
    bnbBalance,
    cardanoBalance,
    dogeBalance,
    tonBalance,
    avaxBalance,
    tronBalance,
    xrpBalance
  } = useAgwWallet();
  const { executeSwap } = useSwapContract();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [currentChatId, setCurrentChatIdState] = useState<string | null>(null);
  const [latestMessageId, setLatestMessageId] = useState<string | null>(null); // Track newest message for typing effect
  const [isLoadingChat, setIsLoadingChat] = useState(false); // Loading state for chat switching
  const [lastMentionedToken, setLastMentionedToken] = useState<string | null>(null); // Track last token for context
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Clear data when wallet changes or disconnects
  useEffect(() => {
    // Reset all state when wallet address changes
    setMessages([]);
    setInputMessage('');
    setIsTyping(false);
    setIsExpanded(false);
    setConversationHistory([]);
    setCurrentChatIdState(null);
    setLatestMessageId(null);
    setIsLoadingChat(false);
    
    // Load wallet-specific chat if connected
    if (isConnected && address) {
      const existingChatId = getCurrentChatId(address);
      
      if (existingChatId) {
        const conversation = getConversation(existingChatId, address || undefined);
        if (conversation && conversation.messages.length > 0) {
          setCurrentChatIdState(existingChatId);
          setMessages(conversation.messages);
          setIsExpanded(true);
          
          // Rebuild conversation history for AI
          const history: ChatMessage[] = [];
          conversation.messages.forEach(msg => {
            history.push({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.text
            });
          });
          setConversationHistory(history);
        }
      }
    }
  }, [address, isConnected]); // Re-run when wallet address changes

  // Handle sidebar toggle
  const handleSidebarToggle = (isOpen: boolean) => {
    if (onSidebarToggle) {
      onSidebarToggle(isOpen);
    }
  };

  // Handle chat history selection - optimized for smooth transitions
  const handleSelectChat = (chatId: string) => {
    // Prevent re-loading the same chat
    if (chatId === currentChatId || isLoadingChat) return;
    
    const conversation = getConversation(chatId, address || undefined);
    
    if (conversation) {
      // Show loading state immediately
      setIsLoadingChat(true);
      
      // Update state in batch to prevent multiple re-renders
      setCurrentChatIdState(chatId);
      setCurrentChatId(chatId, address || undefined);
      
      // Clear current messages first for instant feedback
      setMessages([]);
      setIsExpanded(false);
      
      // Use requestAnimationFrame for smoother UI updates
      requestAnimationFrame(() => {
        setMessages(conversation.messages);
        setIsExpanded(conversation.messages.length > 0);
        setLatestMessageId(null); // Clear latest message when loading history
        
        // Rebuild conversation history for AI (optimized)
        const history: ChatMessage[] = conversation.messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));
        setConversationHistory(history);
        
        // Clear loading state after a brief delay to ensure smooth transition
        setTimeout(() => setIsLoadingChat(false), 100);
      });
    }
  };

  // Handle new chat - don't create until user sends first message
  const handleNewChat = () => {
    setCurrentChatIdState(null);
    setMessages([]);
    setIsExpanded(false);
    setInputMessage('');
    setConversationHistory([]);
    setLatestMessageId(null);
    // Clear the stored current chat ID so new chat state persists when navigating
    clearCurrentChatId(address || undefined);
  };

  // Handle DCA plan approval
  const handleApproveDCA = (params: DCAParameters) => {
    // Create AI confirmation message
    const confirmationText = `✅ **DCA Plan Approved!**

Your investment plan has been created:

| Parameter | Value |
|-----------|-------|
| Amount | $${params.amount} |
| Token | ${params.token} |
| Frequency | ${params.frequency.charAt(0).toUpperCase() + params.frequency.slice(1)} ${params.startDay ? `(${params.startDay})` : ''} |
| Duration | ${params.duration} months |

**Next Steps:**
1. Connect your wallet to execute this plan
2. Approve the smart contract to automate your investments
3. Sit back and let DCA work its magic! 🚀

Your plan will start on the next scheduled date. You can modify or cancel it anytime from your dashboard.

**Note:** This is a simulated approval. In production, this would integrate with your wallet and smart contracts.`;

    const confirmationMessage: Message = {
      id: generateChatId(),
      text: confirmationText,
      sender: 'ai',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, confirmationMessage]);
    
    // Save to conversation history
    if (currentChatId) {
      addMessageToConversation(currentChatId, confirmationMessage, address || undefined);
    }

    console.log('DCA Plan Approved:', params);
    // TODO: Integrate with backend/smart contract to actually execute the DCA plan
  };

  // Handle DCA card cancellation
  const handleCancelDCA = (messageId: string) => {
    // Remove the DCA card message
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    
    // Add a cancellation message
    const cancellationMessage: Message = {
      id: generateChatId(),
      text: 'DCA plan cancelled. Feel free to create a new plan or ask me anything else!',
      sender: 'ai',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, cancellationMessage]);
    
    if (currentChatId) {
      addMessageToConversation(currentChatId, cancellationMessage, address || undefined);
    }
  };

  // Handle Trade approval - Execute actual blockchain transaction
  const handleApproveTrade = async (params: TradeParams, messageId: string) => {
    // Check if already executed
    const message = messages.find(msg => msg.id === messageId);
    if (message?.executed) {
      return; // Already executed, prevent duplicate
    }

    if (!isConnected || !address) {
      const errorMessage: Message = {
        id: generateChatId(),
        text: '❌ Please connect your wallet first to execute trades.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Show processing message
    const processingMessage: Message = {
      id: generateChatId(),
      text: '⏳ **Processing Transaction...**\n\nPlease confirm the transaction in your wallet.',
      sender: 'ai',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, processingMessage]);
    
    try {
      let txHash: string | null = null;
      let tokenInAddress: string = '';
      let tokenOutAddress: string = '';
      let amountIn: string = '';
      let tokenInSymbol: string = '';
      let tokenOutSymbol: string = '';

      switch (params.type) {
        case 'buy': {
          // Buy = USDC -> Token
          tokenInSymbol = 'USDC';
          tokenOutSymbol = params.token;
          tokenInAddress = VERIFIED_TOKENS.USDC;
          tokenOutAddress = VERIFIED_TOKENS[params.token as keyof typeof VERIFIED_TOKENS];
          amountIn = params.amount.toString();

          const tokenInData = TOKENS[tokenInSymbol];
          const tokenOutData = TOKENS[tokenOutSymbol];

          if (!tokenInData || !tokenOutData || !tokenOutAddress) {
            throw new Error(`Invalid token: ${params.token}`);
          }

          txHash = await executeSwap({
            tokenInAddress,
            tokenOutAddress,
            amountIn,
            tokenInDecimals: tokenInData.decimals,
            tokenOutDecimals: tokenOutData.decimals,
            slippageBps: (params.slippage || 0.5) * 100, // Convert % to bps
          });
          break;
        }

        case 'sell': {
          // Sell = Token -> USDC
          tokenInSymbol = params.token;
          tokenOutSymbol = 'USDC';
          tokenInAddress = VERIFIED_TOKENS[params.token as keyof typeof VERIFIED_TOKENS];
          tokenOutAddress = VERIFIED_TOKENS.USDC;
          
          // Amount is now always a number (MAX converted earlier)
          amountIn = params.amount.toString();

          const tokenInData = TOKENS[tokenInSymbol];
          const tokenOutData = TOKENS[tokenOutSymbol];

          if (!tokenInData || !tokenOutData || !tokenInAddress) {
            throw new Error(`Invalid token: ${params.token}`);
          }

          txHash = await executeSwap({
            tokenInAddress,
            tokenOutAddress,
            amountIn,
            tokenInDecimals: tokenInData.decimals,
            tokenOutDecimals: tokenOutData.decimals,
            slippageBps: (params.slippage || 0.5) * 100,
          });
          break;
        }

        case 'swap': {
          // Swap = Token A -> Token B
          tokenInSymbol = params.fromToken;
          tokenOutSymbol = params.toToken;
          tokenInAddress = VERIFIED_TOKENS[params.fromToken as keyof typeof VERIFIED_TOKENS];
          tokenOutAddress = VERIFIED_TOKENS[params.toToken as keyof typeof VERIFIED_TOKENS];
          
          // Amount is now always a number (MAX converted earlier)
          amountIn = params.amount.toString();

          const tokenInData = TOKENS[tokenInSymbol];
          const tokenOutData = TOKENS[tokenOutSymbol];

          if (!tokenInData || !tokenOutData || !tokenInAddress || !tokenOutAddress) {
            throw new Error(`Invalid token pair: ${params.fromToken} -> ${params.toToken}`);
          }

          txHash = await executeSwap({
            tokenInAddress,
            tokenOutAddress,
            amountIn,
            tokenInDecimals: tokenInData.decimals,
            tokenOutDecimals: tokenOutData.decimals,
            slippageBps: (params.slippage || 0.5) * 100,
          });
          break;
        }

        case 'vault':
        case 'stake': {
          // TODO: Implement vault staking contract integration
          throw new Error('Vault/Staking feature coming soon! 🚧');
        }

        default:
          throw new Error('Unknown trade type');
      }

      // Transaction successful
      if (txHash) {
        // Mark the trade card as executed FIRST (synchronous update)
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, executed: true } : msg
        ));

        // Also update in localStorage so it persists across sessions
        if (currentChatId) {
          updateMessageInConversation(currentChatId, messageId, { executed: true }, address || undefined);
        }

        // Small delay to ensure UI updates before adding success message
        await new Promise(resolve => setTimeout(resolve, 100));

        const successMessage: Message = {
          id: generateChatId(),
          text: `✅ **Transaction Successful!**\n\n**Type:** ${params.type.toUpperCase()}\n**Tx Hash:** \`${txHash.slice(0, 10)}...${txHash.slice(-8)}\`\n\n[View on Explorer](https://sepolia.basescan.org/tx/${txHash})\n\n🎉 Your transaction has been confirmed on the blockchain!`,
          sender: 'ai',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, successMessage]);
        
        if (currentChatId) {
          addMessageToConversation(currentChatId, successMessage, address || undefined);
        }
      } else {
        throw new Error('Transaction failed - no hash returned');
      }

    } catch (err: any) {
      console.error('Trade execution error:', err);
      
      const errorMessage: Message = {
        id: generateChatId(),
        text: `❌ **Transaction Failed**\n\n${err.message || 'Unknown error occurred'}\n\nPlease try again or contact support if the issue persists.`,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      if (currentChatId) {
        addMessageToConversation(currentChatId, errorMessage, address || undefined);
      }
    }
  };

  // Handle Trade card cancellation
  const handleCancelTrade = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    
    const cancellationMessage: Message = {
      id: generateChatId(),
      text: 'Trade cancelled. Feel free to create a new order or ask me anything else!',
      sender: 'ai',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, cancellationMessage]);
    
    if (currentChatId) {
      addMessageToConversation(currentChatId, cancellationMessage, address || undefined);
    }
  };

  // Auto-scroll to bottom when messages change - with delay for animation
  const scrollToBottom = () => {
    // Delay scroll slightly to let fade-in animation start
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }, 100); // Short delay to sync with fade-in
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    // Create new chat if none exists (first message)
    let chatId = currentChatId;
    if (!chatId) {
      const newConv = createNewConversation(address || undefined);
      chatId = newConv.id;
      setCurrentChatIdState(chatId);
    }

    // Expand the chat on first message
    if (!isExpanded) {
      setIsExpanded(true);
    }

    const userMessage: Message = {
      id: generateChatId(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    const userInput = inputMessage;
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Save user message to storage
    addMessageToConversation(chatId, userMessage, address || undefined);

    // 🔍 SMART ROUTING: Detect query type before processing
    debugRoute(userInput);
    const route = routeQuery(userInput);

    // Check for trade commands FIRST (buy/sell/swap override portfolio detection)
    const hasTradeKeyword = /(buy|sell|swap|trade|purchase|convert|exchange)\s/i.test(userInput);
    
    // Check if this is a portfolio/balance query (READ-ONLY, no AI call needed)
    // BUT: Skip if user is trying to buy/sell/swap (e.g., "buy btc with all usdc in my wallet")
    if (!hasTradeKeyword && (route.type === 'portfolio' || isPortfolioQuery(userInput))) {
      if (!isConnected || !address) {
        const walletMessage: Message = {
          id: generateChatId(),
          text: '🔒 Please connect your wallet first to view your portfolio.',
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, walletMessage]);
        setIsTyping(false);
        return;
      }

      try {
        // Fetch portfolio data (READ-ONLY - no private keys accessed)
        const portfolio = await getUserPortfolio(address);
        const specificToken = extractTokenQuery(userInput);
        
        // Track the mentioned token for context-aware commands
        if (specificToken) {
          setLastMentionedToken(specificToken);
          console.log(`🎯 Tracking token context: ${specificToken}`);
        }
        
        let responseText: string;
        if (specificToken) {
          responseText = formatTokenBalance(portfolio, specificToken);
        } else {
          responseText = formatPortfolioForAI(portfolio);
        }

        setTimeout(() => {
          const portfolioMessage: Message = {
            id: generateChatId(),
            text: responseText,
            sender: 'ai',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, portfolioMessage]);
          addMessageToConversation(chatId, portfolioMessage, address || undefined);
          setIsTyping(false);
        }, 1500);
        
        return;
      } catch (error) {
        console.error('Portfolio fetch error:', error);
        const errorMessage: Message = {
          id: generateChatId(),
          text: '❌ Unable to fetch portfolio data. Please try again.',
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
        return;
      }
    }

    // Check if this is a Trade request (buy/sell/swap/vault) - AFTER portfolio check
    // Using AI parsing for better accuracy with conversation context
    try {
      const tradeRequest = await parseTradeRequest(userInput, lastMentionedToken || undefined);
      if (tradeRequest) {
        // If amount is MAX, convert to actual balance before creating card
        if (typeof tradeRequest.amount === 'string' && tradeRequest.amount === 'MAX') {
          const balanceMap: { [key: string]: string } = {
            'BTC': btcBalance || '0',
            'ETH': ethBalance || '0',
            'SOL': solBalance || '0',
            'USDC': usdcBalance || '0',
            'BNB': bnbBalance || '0',
            'ADA': cardanoBalance || '0',
            'DOGE': dogeBalance || '0',
            'TON': tonBalance || '0',
            'AVAX': avaxBalance || '0',
            'TRX': tronBalance || '0',
            'XRP': xrpBalance || '0'
          };
          
          // Get the token to check balance for
          let tokenToCheck = '';
          if (tradeRequest.type === 'buy') {
            // For buy orders with MAX, user wants to spend all USDC
            tokenToCheck = 'USDC';
          } else if (tradeRequest.type === 'sell') {
            tokenToCheck = tradeRequest.token;
          } else if (tradeRequest.type === 'swap') {
            tokenToCheck = tradeRequest.fromToken;
          }
          
          if (tokenToCheck && balanceMap[tokenToCheck]) {
            const actualBalance = parseFloat(balanceMap[tokenToCheck]);
            if (actualBalance > 0) {
              // Convert MAX to actual balance number
              (tradeRequest as any).amount = actualBalance;
              // For buy orders, amount is USD (not token amount)
              if (tradeRequest.type === 'buy') {
                (tradeRequest as any).isTokenAmount = false;
              } else {
                (tradeRequest as any).isTokenAmount = true;
              }
            } else {
              // Insufficient balance
              const errorMsg: Message = {
                id: generateChatId(),
                text: `❌ You don't have any ${tokenToCheck} to ${tradeRequest.type}.`,
                sender: 'ai',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, errorMsg]);
              setIsTyping(false);
              return;
            }
          }
        }
        
        setTimeout(() => {
          const tradeCardMessage: Message = {
            id: generateChatId(),
            text: `I've created a ${tradeRequest.type} order based on your request. Please review and confirm:`,
            sender: 'ai',
            timestamp: new Date(),
            type: 'trade-card',
            tradeParams: tradeRequest as TradeParams
          };
          
          setMessages(prev => [...prev, tradeCardMessage]);
          addMessageToConversation(chatId, tradeCardMessage, address || undefined);
          setIsTyping(false);
        }, 1500);
        
        return;
      }
    } catch (error) {
      console.error('Trade parsing error:', error);
      // Continue to other parsers if trade parsing fails
    }

    // Check if this is a DCA request
    const dcaRequest = parseDCARequest(userInput);
    if (dcaRequest) {
      // Add DCA card as AI message after a brief delay
      setTimeout(() => {
        const dcaCardMessage: Message = {
          id: generateChatId(),
          text: 'I\'ve created a DCA plan based on your request. Please review and approve:',
          sender: 'ai',
          timestamp: new Date(),
          type: 'dca-card',
          dcaParams: dcaRequest
        };
        
        setMessages(prev => [...prev, dcaCardMessage]);
        addMessageToConversation(chatId, dcaCardMessage, address || undefined);
        setIsTyping(false);
      }, 1500);
      
      return;
    }

    try {
      // Add minimum thinking delay for better UX (shows AI is analyzing)
      const thinkingDelay = 1500; // 1.5 seconds minimum
      const startTime = Date.now();
      
      // Call Groq API for real AI response
      const aiResponseText = await generateAIResponse(userInput, conversationHistory);
      
      // Calculate remaining delay time
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, thinkingDelay - elapsed);
      
      // Wait for remaining delay if API responded too fast
      if (remainingDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingDelay));
      }

      // Update conversation history
      const newHistory: ChatMessage[] = [
        ...conversationHistory,
        { role: 'user', content: userInput },
        { role: 'assistant', content: aiResponseText }
      ];
      setConversationHistory(newHistory);

      const aiResponse: Message = {
        id: generateChatId(),
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      
      // Check if response has complex markdown formatting (tables, headers)
      // If yes, skip typing effect and render immediately with MarkdownMessage
      const hasComplexMarkdown = aiResponseText.includes('|') || 
                                 aiResponseText.includes('##') || 
                                 aiResponseText.includes('\n\n');
      
      if (hasComplexMarkdown) {
        // Don't set latestMessageId - this will render with MarkdownMessage immediately
        setLatestMessageId(null);
      } else {
        // Simple text responses can use typing effect
        setLatestMessageId(aiResponse.id);
      }
      
      // Save AI response to storage
      addMessageToConversation(chatId, aiResponse, address || undefined);
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Fallback error message
      const errorResponse: Message = {
        id: generateChatId(),
        text: '❌ Sorry, I encountered an error. Please try again or rephrase your question.',
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
      
      // Save error message to storage
      addMessageToConversation(chatId, errorResponse, address || undefined);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div 
      className="min-h-screen pt-16 relative"
      style={{
        background: '#000',
        backgroundImage: `
          radial-gradient(circle at top right, rgba(121, 68, 154, 0.13), transparent),
          radial-gradient(circle at 20% 80%, rgba(41, 196, 255, 0.13), transparent)
        `
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
    >
      {/* Chat History Sidebar */}
      <ChatHistorySidebar 
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onSidebarToggle={handleSidebarToggle}
        currentChatId={currentChatId}
        walletAddress={address || undefined}
      />

      {/* Starfield background */}
      <StarfieldBackground optimized={true} />
      
      <div className="w-full flex flex-col relative z-10" style={{ height: 'calc(100vh - 64px)' }}>
        
        {/* Access Control Overlays */}
        {/* Wallet Not Connected - First Priority */}
        {!isConnected && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/25 backdrop-blur-sm z-[100]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/[0.15] p-6 max-w-md w-full relative">
                {/* Wallet Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h2>
                  <p className="text-gray-400 text-sm mb-6">
                    Please connect your wallet to access DCA automation, AI strategies, and advanced trading features.
                  </p>

                  {/* Feature List */}
                  <div className="bg-white/5 rounded-lg border border-white/10 p-4 text-left">
                    <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-semibold">Available Features</p>
                    <div className="space-y-2">
                      {['Automated DCA Strategies', 'Advanced Portfolio Analytics', 'Priority Support'].map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
       
        {/* Chat Container - Full page with messages area */}
        <div className="flex-1 bg-transparent overflow-hidden flex flex-col relative">
          {/* Centered Initial State - Show when no messages */}
          {messages.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.8,
                  y: -50,
                  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
                }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                className="w-full max-w-4xl px-8"
              >
                {/* Header in center - Responsive */}
                <motion.div 
                  className="flex items-center justify-center mb-4 relative px-4"
                  initial={{ x: 0 }}
                  animate={{
                    x: [0, 0, -48, -42]
                  }}
                  transition={{
                    duration: 2.2,
                    delay: 0.5,
                    times: [0, 0.9, 0.94, 1],
                    ease: [0.22, 1, 0.16, 1]
                  }}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* Logo Animation - Physics-based Curved Trajectory */}
                    <motion.div
                      className="relative z-20"
                      initial={{ y: 0, x: 0 }}
                      style={{ willChange: 'transform' }}
                    >
                      {/* Y-axis (vertical) - Gravity effect */}
                      <motion.div
                        animate={{ 
                          y: [0, -100, 0, -8, 0],
                        }}
                        transition={{ 
                          duration: 2.2,
                          delay: 0.5,
                          times: [0, 0.45, 0.75, 0.88, 1],
                          ease: [0.22, 1, 0.36, 1]
                        }}
                      >
                        {/* X-axis (horizontal) - Linear motion */}
                        <motion.div
                          animate={{ 
                            x: [0, 85],
                          }}
                          transition={{ 
                            duration: 2.2,
                            delay: 0.5,
                            ease: "linear"
                          }}
                        >
                          {/* Rotation and squash */}
                          <motion.div
                            animate={{
                              rotate: [0, 360],
                              scaleY: [1, 1.1, 1, 0.65, 1.05, 1],
                              scaleX: [1, 0.95, 1, 1.35, 0.98, 1],
                            }}
                            transition={{
                              duration: 2.2,
                              delay: 0.5,
                              times: [0, 0.3, 0.6, 0.75, 0.88, 1],
                              ease: [0.22, 1, 0.36, 1]
                            }}
                          >
                            <img src="/igl-sipfi-logo.svg" alt="IGL" className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" />
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                    
                    {/* Text with "IGL" being pushed and squashed */}
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white flex items-center">
                      <motion.span
                        className="inline-block origin-top"
                        initial={{ scaleY: 1, opacity: 1, y: 0, x: 0, rotate: 0 }}
                        animate={{
                          scaleY: [1, 1, 0.4, 0.1, 0],
                          scaleX: [1, 1, 1.3, 1.4, 1.2],
                          opacity: [1, 1, 0.7, 0.3, 0],
                          y: [0, 0, 15, 35, 55],
                          x: [0, 0, -8, -16, -22],
                          rotate: [0, 0, 3, 6, 10]
                        }}
                        transition={{
                          duration: 2.2,
                          delay: 0.5,
                          times: [0, 0.75, 0.82, 0.9, 1],
                          ease: [0.22, 1, 0.36, 1]
                        }}
                        style={{ 
                          transformOrigin: 'center top',
                          display: 'inline-block',
                          filter: 'blur(0px)'
                        }}
                      >
                        IGL
                      </motion.span>
                      <motion.span 
                        className="ml-1 sm:ml-2 inline-block"
                        initial={{ x: 0, scale: 1 }}
                        animate={{
                          x: [0, 0, -10, 0],
                          scale: [1, 1, 0.96, 1]
                        }}
                        transition={{
                          duration: 2.2,
                          delay: 0.5,
                          times: [0, 0.9, 0.94, 1],
                          ease: [0.22, 1, 0.76, 0.12]
                        }}
                      >GweAI 
                      </motion.span>
                    </h1>
                  </div>
                </motion.div>
                <p className="text-gray-300 text-xs sm:text-sm mb-6 sm:mb-8 text-center px-4">
                  DCA strategies, Trade crypto, Market analysis, BTC/ETH, and more...
                </p>

                {/* Search Box with Double Border - Responsive */}
                <div className="relative w-full">
                  {/* Outer border */}
                  <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-white/10 via-white/5 to-white/10 p-[1px]">
                    <div className="absolute inset-[1px] rounded-2xl sm:rounded-3xl bg-gradient-to-r from-white/5 via-white/3 to-white/5 p-[1px]">
                      <div className="w-full h-full rounded-2xl sm:rounded-3xl bg-black/20"></div>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="relative bg-white/[0.01] backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-sm px-4 sm:px-6 py-3 sm:py-4">
                    <form onSubmit={handleSendMessage}>
                      <div className="relative mb-2 sm:mb-3">
                        <input
                          type="text"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          placeholder="Ask AI anything..."
                          disabled={false}
                          className="w-full px-4 sm:px-6 py-3 sm:py-4 pr-12 sm:pr-14 text-sm sm:text-base bg-transparent border-none focus:outline-none text-white placeholder-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <button
                          type="submit"
                          disabled={!inputMessage.trim()}
                          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-emerald-400 text-white rounded-lg sm:rounded-xl hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <FaPaperPlane className="text-xs sm:text-sm" />
                        </button>
                      </div>
                      {/* Bottom toolbar - Responsive */}
                      <div className="flex items-center space-x-2 sm:space-x-4 pt-2 overflow-x-auto">
                        <button type="button" className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-300 hover:text-white whitespace-nowrap">
                          <span className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-400/20 rounded-full"></span>
                          <span>IGL Agent</span>
                        </button>
                        <button type="button" className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-400 hover:text-white whitespace-nowrap">
                          <span>🔍</span>
                          <span>DeepSearch</span>
                        </button>
                        <button type="button" className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-400 hover:text-white whitespace-nowrap">
                          <span>💭</span>
                          <span>Think</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Animated Suggestion Chips - 3 Rows Below the search box */}
                <div className="w-full mt-4 space-y-3">
                  {/* Row 1 - SIP/DCA Strategies */}
                  <motion.div 
                    className="overflow-hidden relative"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    style={{
                      maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
                      WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)'
                    }}
                  >
                    <motion.div
                      className="flex space-x-3"
                      animate={{
                        x: [0, -2000],
                      }}
                      transition={{
                        duration: 50,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      {[...Array(2)].map((_, index) => (
                        <React.Fragment key={index}>
                          <button onClick={() => setInputMessage('SIP $100 in BTC every Monday')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-orange-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            💰 SIP $100 in BTC every Monday
                          </button>
                          <button onClick={() => setInputMessage('Create DCA plan for ETH with $50 weekly')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-blue-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            📊 Create DCA plan for ETH with $50 weekly
                          </button>
                          <button onClick={() => setInputMessage('Set up monthly SIP for $200 in SOL')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-purple-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            🌙 Set up monthly SIP for $200 in SOL
                          </button>
                          <button onClick={() => setInputMessage('Best DCA strategy for BTC and ETH portfolio')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-emerald-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            💎 Best DCA strategy for BTC and ETH portfolio
                          </button>
                          <button onClick={() => setInputMessage('Automate $75 weekly investment in top 3 cryptos')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-cyan-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            ⚙️ Automate $75 weekly investment in top 3 cryptos
                          </button>
                          <button onClick={() => setInputMessage('Calculate returns on $500 monthly BTC SIP for 1 year')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-yellow-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            📈 Calculate returns on $500 monthly BTC SIP for 1 year
                          </button>
                        </React.Fragment>
                      ))}
                    </motion.div>
                  </motion.div>

                  {/* Row 2 - Market Analysis & Prices */}
                  <motion.div 
                    className="overflow-hidden relative"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                    style={{
                      maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
                      WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)'
                    }}
                  >
                    <motion.div
                      className="flex space-x-3"
                      animate={{
                        x: [-2000, 0],
                      }}
                      transition={{
                        duration: 55,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      {[...Array(2)].map((_, index) => (
                        <React.Fragment key={index}>
                          <button onClick={() => setInputMessage('BTC price today and market sentiment')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-orange-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            💰 BTC price today and market sentiment
                          </button>
                          <button onClick={() => setInputMessage('ETH performance in last 30 days')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-blue-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            💎 ETH performance in last 30 days
                          </button>
                          <button onClick={() => setInputMessage('Compare BTC vs ETH returns this year')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-purple-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            ⚖️ Compare BTC vs ETH returns this year
                          </button>
                          <button onClick={() => setInputMessage('Top 10 cryptos by market cap today')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-emerald-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            🏆 Top 10 cryptos by market cap today
                          </button>
                          <button onClick={() => setInputMessage('SOL price prediction for next month')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-pink-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            🔮 SOL price prediction for next month
                          </button>
                          <button onClick={() => setInputMessage('Analyze crypto market volatility this week')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-red-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            📉 Analyze crypto market volatility this week
                          </button>
                        </React.Fragment>
                      ))}
                    </motion.div>
                  </motion.div>

                  {/* Row 3 - News & Trending Coins */}
                  <motion.div 
                    className="overflow-hidden relative"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.4, duration: 0.5 }}
                    style={{
                      maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
                      WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)'
                    }}
                  >
                    <motion.div
                      className="flex space-x-3"
                      animate={{
                        x: [0, -2000],
                      }}
                      transition={{
                        duration: 60,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      {[...Array(2)].map((_, index) => (
                        <React.Fragment key={index}>
                          <button onClick={() => setInputMessage('Latest crypto news and updates')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-cyan-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            📰 Latest crypto news and updates
                          </button>
                          <button onClick={() => setInputMessage('Trending meme coins with high volume')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-pink-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            🚀 Trending meme coins with high volume
                          </button>
                          <button onClick={() => setInputMessage('Recommend 5 altcoins for long-term investment')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-green-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            💡 Recommend 5 altcoins for long-term investment
                          </button>
                          <button onClick={() => setInputMessage('What are DeFi tokens gaining momentum?')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-purple-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            🌐 What are DeFi tokens gaining momentum?
                          </button>
                          <button onClick={() => setInputMessage('Show me best performing tokens today')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-yellow-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            ⭐ Show me best performing tokens today
                          </button>
                          <button onClick={() => setInputMessage('Explain crypto market fear and greed index')} className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:border-orange-400/40 text-white text-xs sm:text-sm whitespace-nowrap transition-all duration-200">
                            📊 Explain crypto market fear and greed index
                          </button>
                        </React.Fragment>
                      ))}
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Chat Messages - Responsive */}
          <div 
            className="flex-1 overflow-y-auto bg-transparent flex justify-center px-2 sm:px-4"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.2) transparent'
            }}
          >
            {isLoadingChat ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
                  <p className="text-gray-400 text-sm">Loading conversation...</p>
                </div>
              </div>
            ) : (
            <div className="w-full max-w-4xl py-4 px-2 sm:p-6 space-y-3 sm:space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6, // Longer duration for noticeable fade-in
                    delay: 0.2, // Small delay after typing indicator disappears
                    ease: [0.25, 0.46, 0.45, 0.94], // Smooth cubic easing
                  }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                {message.sender === 'user' ? (
                  // User message - compact with border, responsive
                  <div className="flex items-start space-x-2 sm:space-x-3 max-w-[85%] sm:max-w-xs md:max-w-md lg:max-w-lg flex-row-reverse space-x-reverse">
                    {/* User Avatar */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white/5 backdrop-blur-sm border border-white/5">
                      <FaUser className="text-emerald-400 text-xs sm:text-sm" />
                    </div>
                    
                    {/* User Message Bubble */}
                    <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/5 text-white min-w-0 overflow-hidden">
                      <p className="text-xs sm:text-sm leading-relaxed break-words overflow-wrap-anywhere">{message.text}</p>
                      <p className="text-[10px] sm:text-xs mt-1 text-gray-400">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  // AI message - full width with transparent border, responsive
                  <div className="flex items-start space-x-2 sm:space-x-3 w-full">
                    {/* AI Avatar */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white/5 backdrop-blur-sm border border-white/10">
                      <img src="/igl-sipfi-logo.svg" alt="IGL" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
                    </div>
                    
                    {/* AI Message Content */}
                    <div className="flex-1">
                      {/* Check if this is a Trade card message */}
                      {message.type === 'trade-card' && message.tradeParams ? (
                        <div className="space-y-3">
                          {/* Intro text */}
                          <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-transparent text-white">
                            <p className="text-xs sm:text-sm text-gray-300">{message.text}</p>
                          </div>
                          {/* Trade Card */}
                          <TradeConfirmationCard
                            parameters={message.tradeParams}
                            onApprove={(params) => handleApproveTrade(params, message.id)}
                            onCancel={() => handleCancelTrade(message.id)}
                            isExecuted={message.executed || false}
                          />
                        </div>
                      ) : message.type === 'dca-card' && message.dcaParams ? (
                        <div className="space-y-3">
                          {/* Intro text */}
                          <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-transparent text-white">
                            <p className="text-xs sm:text-sm text-gray-300">{message.text}</p>
                          </div>
                          {/* DCA Card */}
                          <DCAInlineCard
                            parameters={message.dcaParams}
                            onApprove={handleApproveDCA}
                            onCancel={() => handleCancelDCA(message.id)}
                          />
                        </div>
                      ) : (
                        // Regular text message
                        <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-transparent text-white">
                          <div className="text-xs sm:text-sm leading-relaxed break-words">
                            {/* Only use typing animation for the latest AI message */}
                            {message.sender === 'ai' && message.id === latestMessageId ? (
                              <TypingText 
                                text={message.text} 
                                className=""
                                speed={50}
                              />
                            ) : (
                              <MarkdownMessage text={message.text} />
                            )}
                          </div>
                          <p className="text-[10px] sm:text-xs mt-1 text-gray-400">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
              ))}
              
              {/* Enhanced Thinking/Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                      <img src="/igl-sipfi-logo.svg" alt="IGL" className="w-6 h-6 object-contain" />
                    </div>
                    <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-md border border-green-500/20 rounded-2xl px-5 py-3 shadow-lg">
                      <div className="flex flex-col space-y-2">
                        {/* Animated dots */}
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                        {/* Thinking text */}
                        <motion.p 
                          className="text-xs text-green-300/80 font-medium"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          Analyzing your question...
                        </motion.p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Invisible element for auto-scroll */}
              <div ref={messagesEndRef} />
            </div>
            )}
          </div>

          {/* Input Form - Fixed at bottom (only show when messages exist) */}
          {messages.length > 0 && (
            <motion.div 
              className="py-4 px-6 bg-transparent flex-shrink-0 z-10 flex justify-center"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
            >
              <div className="w-full max-w-4xl">
                <motion.div 
                  className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-sm p-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
                >
                  <form onSubmit={handleSendMessage}>
                    <div className="relative mb-3">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask me about DCA strategies, investment plans, or crypto markets..."
                        disabled={false}
                        className="w-full px-5 py-4 text-base bg-transparent border-none focus:outline-none text-white placeholder-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={!inputMessage.trim() || isTyping}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-emerald-400 text-white rounded-xl hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <FaPaperPlane className="text-sm" />
                      </motion.button>
                    </div>
                    {/* Bottom toolbar */}
                    <div className="flex items-center space-x-4 pt-1">
                      <button type="button" className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-300 hover:text-white">
                        <span className="w-4 h-4 bg-blue-400/20 rounded-full"></span>
                        <span>IGL Agent</span>
                      </button>
                      <button type="button" className="flex items-center space-x-1.5 px-3 py-1 text-sm text-gray-400 hover:text-white">
                        <span>🔍</span>
                        <span>DeepSearch</span>
                      </button>
                      <button type="button" className="flex items-center space-x-1.5 px-3 py-1 text-sm text-gray-400 hover:text-white">
                        <span>💭</span>
                        <span>Think</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

