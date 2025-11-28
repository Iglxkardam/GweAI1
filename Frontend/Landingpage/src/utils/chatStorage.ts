/**
 * Chat Storage Utility
 * Manages chat conversations in localStorage with wallet-specific isolation
 */

import { getWalletStorageKey } from './walletStorage';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'dca-card' | 'trade-card';
  dcaParams?: any;
  tradeParams?: any;
  executed?: boolean; // Track if order has been executed
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  preview: string;
}

const MAX_CONVERSATIONS = 50; // Limit to prevent localStorage overflow

/**
 * Get wallet-specific storage keys
 */
function getStorageKey(walletAddress: string | undefined): string {
  return getWalletStorageKey(walletAddress, 'chat_conversations');
}

function getCurrentChatKey(walletAddress: string | undefined): string {
  return getWalletStorageKey(walletAddress, 'current_chat_id');
}

/**
 * Generate a unique chat ID
 */
export function generateChatId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a title from the first user message
 */
export function generateChatTitle(firstMessage: string): string {
  // Truncate to 50 characters and add ellipsis if needed
  const title = firstMessage.trim().substring(0, 50);
  return title.length < firstMessage.trim().length ? `${title}...` : title;
}

/**
 * Generate a preview from the last message
 */
export function generatePreview(lastMessage: ChatMessage): string {
  const preview = lastMessage.text.substring(0, 60);
  return preview.length < lastMessage.text.length ? `${preview}...` : preview;
}

/**
 * Get all chat conversations from localStorage for specific wallet
 */
export function getAllConversations(walletAddress: string | undefined): ChatConversation[] {
  try {
    const storageKey = getStorageKey(walletAddress);
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];

    const conversations: ChatConversation[] = JSON.parse(stored);
    
    // Convert date strings back to Date objects and filter out empty chats
    return conversations
      .filter(conv => conv.messages && conv.messages.length > 0) // Only show chats with messages
      .map(conv => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()); // Sort by most recent
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
}

/**
 * Get a specific conversation by ID for specific wallet
 */
export function getConversation(chatId: string, walletAddress: string | undefined): ChatConversation | null {
  const conversations = getAllConversations(walletAddress);
  return conversations.find(conv => conv.id === chatId) || null;
}

/**
 * Save a conversation to localStorage for specific wallet
 */
export function saveConversation(conversation: ChatConversation, walletAddress: string | undefined): void {
  try {
    const storageKey = getStorageKey(walletAddress);
    let conversations = getAllConversations(walletAddress);
    
    // Check if conversation exists
    const existingIndex = conversations.findIndex(conv => conv.id === conversation.id);
    
    if (existingIndex >= 0) {
      // Update existing conversation
      conversations[existingIndex] = conversation;
    } else {
      // Add new conversation
      conversations.unshift(conversation);
      
      // Limit number of conversations
      if (conversations.length > MAX_CONVERSATIONS) {
        conversations = conversations.slice(0, MAX_CONVERSATIONS);
      }
    }
    
    localStorage.setItem(storageKey, JSON.stringify(conversations));
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}

/**
 * Create a new conversation (returns object but doesn't save until first message)
 */
export function createNewConversation(walletAddress: string | undefined): ChatConversation {
  const newConversation: ChatConversation = {
    id: generateChatId(),
    title: 'New Chat',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    preview: 'Start a conversation...'
  };
  
  // Don't save empty conversation to storage yet
  // It will be saved when first message is added
  setCurrentChatId(newConversation.id, walletAddress);
  
  return newConversation;
}

/**
 * Add a message to a conversation for specific wallet
 */
export function addMessageToConversation(
  chatId: string,
  message: ChatMessage,
  walletAddress: string | undefined
): void {
  let conversation = getConversation(chatId, walletAddress);
  
  // If conversation doesn't exist (new chat), create it now
  if (!conversation) {
    conversation = {
      id: chatId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      preview: 'Start a conversation...'
    };
  }

  conversation.messages.push(message);
  conversation.updatedAt = new Date();
  conversation.preview = generatePreview(message);
  
  // Update title if it's the first user message
  if (conversation.messages.length === 1 && message.sender === 'user') {
    conversation.title = generateChatTitle(message.text);
  }
  
  saveConversation(conversation, walletAddress);
}

/**
 * Update a specific message in a conversation (e.g., marking as executed)
 */
export function updateMessageInConversation(
  chatId: string,
  messageId: string,
  updates: Partial<ChatMessage>,
  walletAddress: string | undefined
): void {
  const conversation = getConversation(chatId, walletAddress);
  
  if (!conversation) return;

  // Find and update the message
  const messageIndex = conversation.messages.findIndex(msg => msg.id === messageId);
  if (messageIndex >= 0) {
    conversation.messages[messageIndex] = {
      ...conversation.messages[messageIndex],
      ...updates
    };
    conversation.updatedAt = new Date();
    saveConversation(conversation, walletAddress);
  }
}

/**
 * Delete a conversation for specific wallet
 */
export function deleteConversation(chatId: string, walletAddress: string | undefined): void {
  try {
    const storageKey = getStorageKey(walletAddress);
    const conversations = getAllConversations(walletAddress).filter(conv => conv.id !== chatId);
    localStorage.setItem(storageKey, JSON.stringify(conversations));
    
    // If deleted chat was current, clear current chat ID
    if (getCurrentChatId(walletAddress) === chatId) {
      clearCurrentChatId(walletAddress);
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
  }
}

/**
 * Clear all conversations for specific wallet
 */
export function clearAllConversations(walletAddress: string | undefined): void {
  try {
    const storageKey = getStorageKey(walletAddress);
    const currentChatKey = getCurrentChatKey(walletAddress);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(currentChatKey);
  } catch (error) {
    console.error('Error clearing conversations:', error);
  }
}

/**
 * Get current active chat ID for specific wallet
 */
export function getCurrentChatId(walletAddress: string | undefined): string | null {
  const currentChatKey = getCurrentChatKey(walletAddress);
  return localStorage.getItem(currentChatKey);
}

/**
 * Set current active chat ID for specific wallet
 */
export function setCurrentChatId(chatId: string, walletAddress: string | undefined): void {
  const currentChatKey = getCurrentChatKey(walletAddress);
  localStorage.setItem(currentChatKey, chatId);
}

/**
 * Clear current chat ID for specific wallet
 */
export function clearCurrentChatId(walletAddress: string | undefined): void {
  const currentChatKey = getCurrentChatKey(walletAddress);
  localStorage.removeItem(currentChatKey);
}

/**
 * Search conversations by keyword for specific wallet
 */
export function searchConversations(keyword: string, walletAddress: string | undefined): ChatConversation[] {
  const conversations = getAllConversations(walletAddress);
  const lowerKeyword = keyword.toLowerCase();
  
  return conversations.filter(conv => 
    conv.title.toLowerCase().includes(lowerKeyword) ||
    conv.messages.some(msg => msg.text.toLowerCase().includes(lowerKeyword))
  );
}

/**
 * Export conversations to JSON for specific wallet
 */
export function exportConversations(walletAddress: string | undefined): string {
  const conversations = getAllConversations(walletAddress);
  return JSON.stringify(conversations, null, 2);
}

/**
 * Import conversations from JSON for specific wallet
 */
export function importConversations(jsonData: string, walletAddress: string | undefined): boolean {
  try {
    const storageKey = getStorageKey(walletAddress);
    const conversations: ChatConversation[] = JSON.parse(jsonData);
    localStorage.setItem(storageKey, JSON.stringify(conversations));
    return true;
  } catch (error) {
    console.error('Error importing conversations:', error);
    return false;
  }
}
