import { WebSocket } from "ws";

export interface ClientSession {
  audioChunks: Buffer[];
  learningLanguage: string;
  nativeLanguage: string;
  mode: string;
  scenarioId?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  quiz?: any;
  isProcessing?: boolean;
  lastTranscription?: string;
  lastTranscriptionTime?: number;
  retryCount?: number;
}

export const sessions = new Map<WebSocket, ClientSession>();


export const createSession = (
  ws: WebSocket,
  learningLanguage: string,
  nativeLanguage: string,
  mode: string
): ClientSession => {
  const session: ClientSession = {
    audioChunks: [],
    learningLanguage,
    nativeLanguage,
    mode,
    conversationHistory: [],
  };
  
  sessions.set(ws, session);
  return session;
};


export const addToConversationHistory = (
  session: ClientSession,
  role: 'user' | 'assistant',
  content: string
): void => {
  if (!session.conversationHistory) {
    session.conversationHistory = [];
  }
  
  session.conversationHistory.push({
    role,
    content,
    timestamp: Date.now()
  });

  if (session.conversationHistory.length > 30) {
    session.conversationHistory = session.conversationHistory.slice(-30);
  }
};

export const getConversationContext = (session: ClientSession): string => {
  if (!session.conversationHistory || session.conversationHistory.length === 0) {
    return '';
  }

  const history = session.conversationHistory.sort((a, b) => a.timestamp - b.timestamp);
  

  if (history.length <= 10) {
    return history.map(msg => `${msg.role === 'user' ? 'User' : 'You'}: ${msg.content}`).join('\n');
  }
  

  const recentMessages = history.slice(-8); 
  const olderMessages = history.slice(0, -8);
  
  let context = '';
  
  if (olderMessages.length > 0) {

    context += `[Earlier conversation: We've been chatting naturally about various topics and getting to know each other]\n\n`;
  }
  

  context += 'Recent conversation:\n';
  context += recentMessages.map(msg => `${msg.role === 'user' ? 'User' : 'You'}: ${msg.content}`).join('\n');
  
  return context;
};

export const getSession = (ws: WebSocket): ClientSession | undefined => {
  return sessions.get(ws);
};


export const removeSession = (ws: WebSocket): void => {
  sessions.delete(ws);
};

export const clearAudioChunks = (session: ClientSession): void => {
  session.audioChunks = [];
};
