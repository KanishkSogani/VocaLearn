

import { callLLM, LLMResponse } from "./base";
import { getVoiceId } from "../../utils/languages";
import { getScenarioById } from "../../utils/scenarios";
import { getConversationContext } from "../../managers/session-manager";

export const generateScenarioGreeting = async (
  scenarioId: string,
  learningLanguage: string,
  nativeLanguage: string
): Promise<LLMResponse> => {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) {
    throw new Error(`Scenario not found: ${scenarioId}`);
  }

  const startingPrompt =
    scenario.startingPrompts[learningLanguage] ||
    scenario.startingPrompts["en-US"];

  return {
    correction: startingPrompt,
    explanation: "", 
    correctionVoiceId: getVoiceId(learningLanguage),
    explanationVoiceId: getVoiceId(nativeLanguage),
  };
};

export const generateResponse = async (
  text: string,
  learningLanguage: string,
  nativeLanguage: string,
  mode: string,
  scenarioId?: string,
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: number;
  }>
): Promise<LLMResponse> => {
  if (!["echo", "dialogue", "quiz"].includes(mode)) {
    throw new Error(`Invalid Mode : ${mode}`);
  }

  
  let scenarioContext = "";
  if (scenarioId && mode === "dialogue") {
    const scenario = getScenarioById(scenarioId);
    if (scenario) {
      scenarioContext = `
SCENARIO CONTEXT: ${scenario.context}
You are playing the role described in this scenario. Stay in character and respond appropriately to the scenario context.
Scenario: ${scenario.title} - ${scenario.description}
`;
    }
  }


  let conversationContext = "";
  if (
    conversationHistory &&
    conversationHistory.length > 0 &&
    mode === "dialogue"
  ) {
    
    const sortedHistory = conversationHistory.sort(
      (a, b) => a.timestamp - b.timestamp
    );

    conversationContext =
      "\n\nCONVERSATION HISTORY (maintain context and continuity):\n";

    
    const recentMessages = sortedHistory.slice(-8); 
    const olderMessages = sortedHistory.slice(0, -8);

    if (olderMessages.length > 0) {
      conversationContext += `[Earlier conversation context: We discussed various topics and have been chatting naturally]\n`;
    }

    
    recentMessages.forEach((message, index) => {
      const role = message.role === "user" ? "User" : "You (AI)";
      conversationContext += `${role}: ${message.content}\n`;
    });

    conversationContext += `\nCURRENT MESSAGE: User just said: "${text}"\n`;
    conversationContext += `CRITICAL CONTEXT INSTRUCTIONS:\n`;
    conversationContext += `- You are continuing an ongoing conversation - NOT starting fresh!\n`;
    conversationContext += `- Reference previous topics and continue naturally from where we left off\n`;
    conversationContext += `- Show that you remember what was discussed by building on previous exchanges\n`;
    conversationContext += `- Maintain conversation continuity - each response should feel connected to the previous messages\n`;
    conversationContext += `- You are the character in this scenario, NOT a language teacher - stay in character!\n`;
    conversationContext += `- Respond naturally based on this conversation context and what the user just said.\n`;
  }

  const prompt = `
You are a language tutor for ${learningLanguage}, and you explain things in ${nativeLanguage}.

The user said: "${text}" (in ${learningLanguage}).

- Mode: ${mode}
${scenarioContext}
${conversationContext}

CRITICAL: You are in "${mode}" mode. Follow the specific instructions for this mode only.

IMPORTANT LANGUAGE RULES:
- Learning language is: ${learningLanguage}
- Native language (for explanations) is: ${nativeLanguage}
- Put feedback/corrections in the learning language (${learningLanguage})
- Put explanations in the native language (${nativeLanguage})

- For 'echo' mode: 
    • If the input is incorrect, provide ONLY the corrected version in ${learningLanguage} in the "correction" field - no additional text, affirmations, or suggestions. 
    • If correct, leave the "correction" field empty or put the original text. 
    • Put comprehensive, educational explanations in the "explanation" field (in ${nativeLanguage}) BUT KEEP THEM CONCISE (MAX 200 WORDS):
      - Start with WHY the correction was needed (specific grammar rules, pronunciation patterns, cultural context)
      - Provide the underlying linguistic principle or rule being applied
      - Give 2-3 concrete examples of correct usage in different contexts
      - Include memory aids, mnemonics, or patterns to help retention
      - Reference related grammar structures, word families, or language patterns
      - Add cultural or usage notes when relevant (formal vs informal, regional variations)
      - Provide tips for avoiding similar mistakes in the future
      - Make explanations pedagogically rich and insightful, focusing on learning principles
      - If the input was correct, explain what they did well and why it demonstrates good language mastery
      - IMPORTANT: Keep explanation under 200 words total
    • ALSO provide detailed feedback analysis with scores (0-100) for:
      - pronunciationScore: How well the user likely pronounced based on transcription quality
      - grammarScore: Grammar correctness and sentence structure
      - vocabularyScore: Word choice and meaning understanding
      - fluencyScore: Natural flow and speech patterns
      - overallScore: Combined performance assessment
    • Include comprehensive feedback with:
      - 2-3 specific strengths observed with explanations of why they're good
      - 1-2 main areas for improvement with actionable steps
      - 2-3 specific practice recommendations with concrete exercises or resources
    • Keep all feedback encouraging but substantive and actionable

- For 'dialogue' mode: Generate a natural conversational response in ${learningLanguage} that continues the dialogue.
    ${
      scenarioContext
        ? "SCENARIO MODE: You are role-playing in this scenario. Stay completely in character and respond as the role described in the scenario context. Make the conversation immersive and realistic. Keep the conversation flowing naturally - share information about yourself, react to what the user said, make comments, and sometimes ask follow-up questions."
        : ""
    }
    
    CRITICAL DIALOGUE RULES:
    • You are NOT a language tutor - you are having a REAL conversation as the character in the scenario!
    • MAINTAIN CONVERSATION CONTINUITY: Reference previous topics, build on what was discussed, remember details shared
    • VARY your response types: 
      - Share personal information/experiences (as your character)
      - Make observations or comments about what the user said
      - Ask follow-up questions (but not always!)
      - Tell related stories or anecdotes
      - Express emotions and reactions (surprise, interest, agreement, etc.)
      - Continue topics they brought up or introduce related new ones
    • Do NOT always end with a question - mix statements, comments, reactions, and questions
    • Show personality based on your character role - be engaging and personable
    • React naturally to what the user says (show interest, surprise, agreement, relate to their experiences)
    • If they ask a question, answer thoroughly and add your own related thoughts
    • If they make a statement, respond with related thoughts, experiences, or observations
    • Use conversational fillers and natural speech patterns
    • Reference earlier parts of the conversation when relevant to show you remember and care about the ongoing dialogue
    • Make the conversation feel continuous and connected, not like separate question-answer pairs
    
    - Store this conversational response in the "correction" field (in ${learningLanguage}) - this field name is just for technical reasons, it contains your conversation response
    - For the "explanation" field: Only provide comprehensive language insights if there were significant errors that affected communication (in ${nativeLanguage}) - MAX 200 WORDS:
      - Focus on errors that changed the intended meaning or made communication unclear
      - Explain complex grammar concepts that caused confusion with detailed linguistic analysis
      - Provide cultural, contextual, or pragmatic insights about language usage
      - Offer advanced tips for more natural, idiomatic expression
      - Include examples of how native speakers would express the same idea
      - Reference regional variations, formality levels, or social contexts when relevant
      - Give specific practice suggestions for mastering difficult concepts
      - Keep explanations highly educational and supportive, never discouraging
      - Leave explanation empty for minor errors or correct usage that doesn't warrant detailed analysis
      - IMPORTANT: Keep explanation under 200 words if provided
    - Do NOT correct punctuation marks like periods (।) - these are not important in spoken dialogue
    ${
      scenarioContext
        ? "- Remember: You are the character in the scenario having a real conversation, not a teacher! Stay in character!"
        : ""
    }
    - Make the conversation feel natural, continuous, and perpetual with varied response types
    - Focus on being engaging, friendly, and authentic to your character role while maintaining conversation flow

- For 'quiz' mode: Evaluate the user's SPOKEN answer to a quiz question in ${learningLanguage}. 
    IMPORTANT: This is spoken language assessment - DO NOT penalize for missing punctuation marks, written formatting, or visual elements that cannot be heard in speech.
    Focus ONLY on:
    - Vocabulary usage and meaning
    - Grammar and sentence structure 
    - Pronunciation intent (based on transcription)
    - Semantic correctness of the response
    
    For quiz mode, put your feedback in the "correction" field (in ${learningLanguage}) and comprehensive explanation in the "explanation" field (in ${nativeLanguage}) - MAX 200 WORDS:
    - If correct: Put "Correct!" or "सही!" or "¡Correcto!" (in ${learningLanguage}) with brief praise in the "correction" field. In "explanation", provide detailed positive reinforcement (MAX 200 WORDS):
      * Highlight specific aspects they mastered (grammar structures, vocabulary choices, pronunciation patterns)
      * Explain the language concepts they demonstrated correctly with linguistic analysis
      * Provide additional context, related rules, or advanced applications
      * Reference similar patterns they can apply in other contexts
      * Acknowledge the difficulty level and celebrate the achievement
      * Suggest next steps for continued learning and skill development
    - If partially correct: Put the complete correct answer in ${learningLanguage} in the "correction" field, and in "explanation" provide comprehensive analysis (MAX 200 WORDS):
      * Clearly acknowledge what parts were correct and why they demonstrate good understanding
      * Explain what was missing with detailed linguistic reasoning
      * Provide the underlying grammar rules, vocabulary patterns, or pronunciation principles
      * Give multiple examples of correct usage in various contexts and registers
      * Offer specific, actionable strategies for improvement with practice exercises
      * Connect the concept to broader language learning principles
    - If incorrect: Put the correct answer in ${learningLanguage} in the "correction" field and in "explanation" provide thorough educational feedback (MAX 200 WORDS):
      * Explain the correct answer comprehensively with detailed reasoning
      * Identify the specific error type (grammar, vocabulary, pronunciation, meaning) and why it occurred
      * Provide the underlying language rules, patterns, or principles with examples
      * Give multiple examples in different contexts to reinforce understanding
      * Suggest specific practice methods, exercises, and learning resources
      * Connect to broader language concepts and provide scaffolding for future learning
      * Focus on growth opportunities and learning strategies, not just corrections

REMEMBER: ALL explanations must be written in ${nativeLanguage}, NOT in ${learningLanguage}!

Always return a **valid JSON** response like this:

For ECHO mode:
{
  "correction": "...",
  "explanation": "...",
  "detailedFeedback": {
    "pronunciationScore": <0-100>,
    "grammarScore": <0-100>,
    "vocabularyScore": <0-100>,
    "fluencyScore": <0-100>,
    "overallScore": <0-100>,
    "feedback": "<brief encouraging summary in ${nativeLanguage}>",
    "strengths": ["<strength 1>", "<strength 2>"],
    "weaknesses": ["<weakness 1>", "<weakness 2>"],
    "recommendations": ["<tip 1>", "<tip 2>"]
  }
}

For DIALOGUE mode:
{
  "correction": "...",
  "explanation": ""
}

For QUIZ mode:
{
  "correction": "...",
  "explanation": "..."
}

FINAL REMINDER: 
- "correction" field = ${learningLanguage}
- "explanation" field = ${nativeLanguage}
- Echo mode MUST include detailedFeedback object with scores and analysis
`;

  try {
    const responseText = await callLLM(prompt);
    console.log(" LLM Raw response:", responseText);

    let correction, explanation, detailedFeedback;
    try {
      const parsed = JSON.parse(responseText);

      
      if (parsed.question && parsed.correctAnswer) {
        
        correction = responseText; 
        explanation = "Quiz question generated";
      } else {
        
        correction = parsed.correction;
        explanation = parsed.explanation;

        // Extract detailed feedback if present (for echo mode)
        if (parsed.detailedFeedback && mode === "echo") {
          detailedFeedback = {
            pronunciationScore: Math.max(
              0,
              Math.min(100, parsed.detailedFeedback.pronunciationScore || 0)
            ),
            grammarScore: Math.max(
              0,
              Math.min(100, parsed.detailedFeedback.grammarScore || 0)
            ),
            vocabularyScore: Math.max(
              0,
              Math.min(100, parsed.detailedFeedback.vocabularyScore || 0)
            ),
            fluencyScore: Math.max(
              0,
              Math.min(100, parsed.detailedFeedback.fluencyScore || 0)
            ),
            overallScore: Math.max(
              0,
              Math.min(100, parsed.detailedFeedback.overallScore || 0)
            ),
            feedback: parsed.detailedFeedback.feedback || "Good effort!",
            strengths: parsed.detailedFeedback.strengths || [
              "You're practicing",
            ],
            weaknesses: parsed.detailedFeedback.weaknesses || [
              "Keep improving",
            ],
            recommendations: parsed.detailedFeedback.recommendations || [
              "Continue practicing",
            ],
          };
        }

        // Handle legacy response formats that might have different field names
        if (!correction && parsed.response) {
          correction = parsed.response;
        }
        if (!correction && parsed.feedback) {
          correction = parsed.feedback;
        }
      }
    } catch (jsonError) {
      console.error(" LLM JSON parsing error:", jsonError);
      console.error(" LLM Raw response:", responseText);

      // Fallback: try to extract content even if not valid JSON
      correction = responseText.includes("correction")
        ? responseText
        : "Response received but format was incorrect";
      explanation =
        "The AI response was not in the expected format. Please try again.";
    }

    const response: LLMResponse = {
      correction: correction || "No correction provided",
      explanation: explanation || "No explanation provided",
      correctionVoiceId: getVoiceId(learningLanguage),
      explanationVoiceId: getVoiceId(nativeLanguage),
    };

    // Add detailed feedback if available
    if (detailedFeedback) {
      response.detailedFeedback = detailedFeedback;
    }

    return response;
  } catch (error) {
    throw new Error(`LLM processing failed: ${(error as Error).message}`);
  }
};

// Generate initial conversation starter for dialogue mode
export const generateConversationStarter = async (
  learningLanguage: string,
  nativeLanguage: string,
  scenarioId?: string
): Promise<LLMResponse> => {
  // Get scenario context if provided
  let scenarioContext = "";
  if (scenarioId) {
    const scenario = getScenarioById(scenarioId);
    if (scenario) {
      scenarioContext = `
SCENARIO CONTEXT: ${scenario.context}
You are playing the role described in this scenario. Stay in character.
Scenario: ${scenario.title} - ${scenario.description}
`;
    }
  }

  const prompt = `
You are starting a conversation in ${learningLanguage} for language practice.
${scenarioContext}

Generate a natural conversation starter question or greeting that would encourage the user to respond and practice speaking.

${
  scenarioContext
    ? "Stay in character for your scenario role and ask something appropriate for the situation."
    : "Ask a friendly, open-ended question that invites conversation."
}

LANGUAGE REQUIREMENTS:
- The question/greeting MUST be in ${learningLanguage}
- Make it natural and conversational
- Encourage a response from the user
- Keep it simple but engaging

CONVERSATION STYLE EXAMPLES:
- Mix questions with statements: "I'm having a wonderful day too! The weather has been perfect. What brings you here today?"
- Share information: "Oh, I love this place! I've been coming here for years. The atmosphere is always so welcoming."
- React naturally: "That sounds really interesting! I can see why you'd enjoy that."
- Vary response types: Don't always end with questions - sometimes just share thoughts or make observations

Examples:
- For café scenario: "¡Hola! Bienvenido a nuestro café. Es un día perfecto para un buen café, ¿verdad?"
- For social scenario: "¡Hola! Me encanta esta fiesta. La música está genial y hay tanta gente interesante aquí."
- For general dialogue: "¡Hola! Qué día tan hermoso. Me siento muy bien hoy."

Always return a **valid JSON** response like this:
{
  "correction": "your conversation starter in ${learningLanguage}",
  "explanation": "brief context about why this is a good conversation starter in ${nativeLanguage}"
}
`;

  try {
    const responseText = await callLLM(prompt);
    console.log(" Conversation starter response:", responseText);

    let correction, explanation;
    try {
      const parsed = JSON.parse(responseText);
      correction = parsed.correction;
      explanation = parsed.explanation;
    } catch (jsonError) {
      console.error(
        " JSON parsing error for conversation starter:",
        jsonError
      );
      // Fallback
      correction = scenarioContext
        ? "¡Hola! ¿Cómo estás hoy?"
        : "Hello! How are you today?";
      explanation = "A simple greeting to start the conversation.";
    }

    return {
      correction: correction || "¡Hola! ¿Cómo estás?",
      explanation: explanation || "A friendly conversation starter.",
      correctionVoiceId: getVoiceId(learningLanguage),
      explanationVoiceId: getVoiceId(nativeLanguage),
    };
  } catch (error) {
    throw new Error(
      `Conversation starter generation failed: ${(error as Error).message}`
    );
  }
};

// Generate conversation starter for dialogue mode without scenario
export const generateConversationStarterNoScenario = async (
  learningLanguage: string,
  nativeLanguage: string
): Promise<LLMResponse> => {
  const starterPrompts = {
    "es-ES": "¡Hola! ¿Cómo estás hoy? Me gustaría conocerte mejor.",
    "fr-FR":
      "Bonjour ! Comment allez-vous aujourd'hui ? J'aimerais mieux vous connaître.",
    "en-US": "Hello! How are you today? I'd like to get to know you better.",
    "hi-IN": "नमस्ते! आज आप कैसे हैं? मैं आपको बेहतर जानना चाहूंगा।",
    "ja-JP":
      "こんにちは！今日はいかがですか？あなたのことをもっと知りたいです。",
    "it-IT": "Ciao! Come stai oggi? Mi piacerebbe conoscerti meglio.",
    "de-DE":
      "Hallo! Wie geht es dir heute? Ich würde dich gerne besser kennenlernen.",
    "nl-NL": "Hallo! Hoe gaat het vandaag? Ik zou je graag beter leren kennen.",
    "pt-BR": "Olá! Como você está hoje? Gostaria de conhecê-lo melhor.",
  };

  const startingPrompt =
    starterPrompts[learningLanguage as keyof typeof starterPrompts] ||
    starterPrompts["en-US"];

  return {
    correction: startingPrompt,
    explanation: `Starting a friendly conversation to practice ${learningLanguage}`,
    correctionVoiceId: getVoiceId(learningLanguage),
    explanationVoiceId: getVoiceId(nativeLanguage),
  };
};
