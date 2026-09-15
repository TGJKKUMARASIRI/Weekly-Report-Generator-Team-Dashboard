import { api } from '../lib/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
}

export const aiService = {
  /**
   * Sends user prompt and current week context to AI chat endpoint
   */
  sendChatMessage: async (message: string, weekIdentifier?: string): Promise<string> => {
    const response = await api.post<ChatResponse>('/ai/chat', {
      message,
      weekIdentifier,
    });
    return response.data.reply;
  },
};