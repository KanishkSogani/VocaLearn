import { WebSocket } from "ws";
import { initializeQuiz, generateAndSendQuizQuestion, handleQuizControlMessage } from "../quiz";
import { createSession, getSession, removeSession, sessions } from "../managers/session-manager";
import { processQuizAnswer, processDialogueEcho } from "../services/audio-processor";
import { generateScenarioGreeting, generateConversationStarter } from "../services/llm/conversation";


export const handleConnection = async (ws: WebSocket, req: any): Promise<void> => {
  console.log("Client Connected!");

  const params = new URLSearchParams(req.url?.split("?")[1]);
  const learningLanguage = params.get("learningLanguage") || "es-ES";
  const nativeLanguage = params.get("nativeLanguage") || "en-US";
  const mode = params.get("mode") || "echo";
  const scenarioId = params.get("scenarioId");


  const session = createSession(ws, learningLanguage, nativeLanguage, mode);

  if (scenarioId && mode === "dialogue") {
    session.scenarioId = scenarioId;
  }


  if (mode === "quiz") {
    initializeQuiz(session, params);
    console.log(` Quiz initialized for ${learningLanguage} -> ${nativeLanguage}`);
    
  
    setTimeout(async () => {
      await generateAndSendQuizQuestion(ws, sessions);
    }, 1000);
  }
};

// Handle WebSocket messages
export const handleMessage = async (ws: WebSocket, data: Buffer): Promise<void> => {
  const session = getSession(ws);
  if (!session) {
    ws.send(JSON.stringify({ error: "Session not found" }));
    return;
  }

  if (data.toString().startsWith("{")) {
    const message = JSON.parse(data.toString());

    if (message.type === "start_conversation" && session.mode === "dialogue") {
      try {
        let response;
        if (session.scenarioId) {
          response = await generateScenarioGreeting(
            session.scenarioId,
            session.learningLanguage,
            session.nativeLanguage
          );
        } else {
          response = await generateConversationStarter(
            session.learningLanguage,
            session.nativeLanguage
          );
        }

        ws.send(JSON.stringify({
          correction: response.correction,
          explanation: response.explanation
        }));
        

        const { generateAndSendTTS } = await import("../murf");
        await generateAndSendTTS(
          ws,
          response.correction,
          session.learningLanguage,
          "correction"
        );
        
      } catch (error) {
        console.error("Failed to generate conversation starter:", error);
        ws.send(JSON.stringify({ 
          correction: "Hello! How are you today?",
          explanation: "Welcome to the conversation practice!"
        }));
      }
      return;
    }

    if (session.mode === "quiz") {
      const handled = await handleQuizControlMessage(ws, sessions, message);
      if (handled) return;
    }

    if (message.end === true) {
      if (session.mode === "quiz" && session.quiz?.isWaitingForAnswer) {
        await processQuizAnswer(ws, session);
      } else {
        await processDialogueEcho(ws, session);
      }
      return;
    }
  } else {
    // Handle binary audio data
    if (data.length > 0) {
      session.audioChunks.push(data);
    } else {
      ws.send(JSON.stringify({ error: "Empty audio data" }));
    }
  }
};

// Handle WebSocket disconnection
export const handleDisconnection = (ws: WebSocket): void => {
  removeSession(ws);
  console.log("Client Disconnected");
};
