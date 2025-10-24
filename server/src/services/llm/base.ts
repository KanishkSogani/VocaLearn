

import { Groq } from 'groq-sdk';
import Bottleneck from 'bottleneck';
import { config } from "../../utils/config";

const groq = new Groq({
  apiKey: config.groqApiKey,
});

const rateLimiter = new Bottleneck({
  maxConcurrent: 1, 
  minTime: 1000,    
  reservoir: 30,    
  reservoirRefreshAmount: 30, 
  reservoirRefreshInterval: 60 * 1000, 
});


export const callLLM = async (prompt: string): Promise<string> => {
  return rateLimiter.schedule(async () => {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: "json_object" },
        stream: false 
      });

      return chatCompletion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Groq API error:", error);
      throw new Error(`Groq API failed: ${(error as Error).message}`);
    }
  });
};


export interface LLMResponse {
  correction: string;
  explanation: string;
  correctionVoiceId: string;
  explanationVoiceId: string;

  detailedFeedback?: {
    pronunciationScore: number;
    grammarScore: number;
    vocabularyScore: number;
    fluencyScore: number;
    overallScore: number;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}


export interface AccuracyResponse {
  accuracy: number;
  pronunciationScore: number;
  grammarScore: number;
  fluencyScore: number;
  feedback: string;
}
