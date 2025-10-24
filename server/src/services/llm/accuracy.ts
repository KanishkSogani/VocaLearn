

import { callLLM, AccuracyResponse } from "./base";

export const calculateAccuracy = async (
  userTranscription: string,
  expectedText: string,
  language: string,
  mode: string = "echo"
): Promise<AccuracyResponse> => {
  try {
    const prompt = `You are an expert language teacher evaluating speech accuracy. Analyze the user's spoken input and provide detailed accuracy scores.

Expected text: "${expectedText}"
User's transcription: "${userTranscription}"
Language: ${language}

Evaluate the following aspects and provide scores from 0-100:

1. PRONUNCIATION ACCURACY: How well did the user pronounce the words? Consider:
   - Correct phonetic pronunciation (based on transcription quality)
   - Word stress and intonation patterns
   - Clarity of speech

2. GRAMMAR ACCURACY: How grammatically correct is the user's speech?
   - Correct sentence structure
   - Proper verb conjugations
   - Appropriate word order

3. FLUENCY: How natural and flowing was the speech?
   - Smooth delivery without excessive pauses
   - Natural rhythm and pace
   - Confidence in speech

4. OVERALL ACCURACY: Combined score considering all factors

Provide constructive feedback in English about areas for improvement.

Respond in JSON format:
{
  "pronunciationScore": <0-100>,
  "grammarScore": <0-100>,
  "fluencyScore": <0-100>,
  "accuracy": <0-100>,
  "feedback": "<detailed feedback about pronunciation, grammar, and fluency>"
}`;

    const response = await callLLM(prompt);
    console.log(" LLM Accuracy Response:", response);

    const parsed = JSON.parse(response);
    
    return {
      accuracy: Math.max(0, Math.min(100, parsed.accuracy || 0)),
      pronunciationScore: Math.max(0, Math.min(100, parsed.pronunciationScore || 0)),
      grammarScore: Math.max(0, Math.min(100, parsed.grammarScore || 0)),
      fluencyScore: Math.max(0, Math.min(100, parsed.fluencyScore || 0)),
      feedback: parsed.feedback || "No feedback provided"
    };
  } catch (error) {
    console.error(" Error calculating accuracy:", error);
    return {
      accuracy: 50,
      pronunciationScore: 50,
      grammarScore: 50,
      fluencyScore: 50,
      feedback: "Unable to calculate accuracy at this time"
    };
  }
};
