
import { WebSocket } from "ws";
import { processAudioStream } from "../asr";
import { generateResponse } from "../services/llm";
import { calculateAccuracy } from "./llm/accuracy";
import { generateAndSendTTS } from "../murf";
import { handleQuizAnswer } from "../quiz";
import { ClientSession, sessions, clearAudioChunks, addToConversationHistory, getConversationContext } from "../managers/session-manager";


export const processQuizAnswer = async (ws: WebSocket, session: ClientSession): Promise<void> => {
  const transcription = await processAudioStream(
    session.audioChunks,
    session.learningLanguage
  );
  console.log(" Quiz answer transcription:", transcription.text);
  
  await handleQuizAnswer(ws, transcription.text, sessions);
  clearAudioChunks(session);
};

export const processDialogueEcho = async (ws: WebSocket, session: ClientSession): Promise<void> => {

  const transcription = await processAudioStream(
    session.audioChunks,
    session.learningLanguage
  );
  console.log(" Transcription:", transcription.text);
  

  const response = await generateResponse(
    transcription.text,
    session.learningLanguage,
    session.nativeLanguage,
    session.mode,
    session.scenarioId,
    session.conversationHistory
  );
  console.log(" Response:", response);
  
  if (session.mode === "dialogue") {
    addToConversationHistory(session, 'user', transcription.text);
    addToConversationHistory(session, 'assistant', response.correction);
  }

  let accuracyResult;
  if (session.mode === "echo") {

    accuracyResult = await calculateAccuracy(
      transcription.text,
      response.correction, 
      session.nativeLanguage,
      "echo"
    );
  } else {
    accuracyResult = await calculateAccuracy(
      transcription.text,
      transcription.text, 
      session.nativeLanguage,
      "dialogue"
    );
  }
  console.log("Accuracy:", accuracyResult);
  

  const transcriptionData: any = {
    transcription: transcription.text,
    language: session.learningLanguage,
    accuracy: accuracyResult.accuracy,
    pronunciationScore: accuracyResult.pronunciationScore,
    grammarScore: accuracyResult.grammarScore,
    fluencyScore: accuracyResult.fluencyScore,
    accuracyFeedback: accuracyResult.feedback
  };


  if (response.detailedFeedback && session.mode === "echo") {
    transcriptionData.llmDetailedFeedback = response.detailedFeedback;
  }

  ws.send(JSON.stringify(transcriptionData));
  

  const textResponse: any = {
    correction: response.correction,
    explanation: session.mode === "dialogue" ? "" : response.explanation, 
    correctionLanguage: session.learningLanguage,
    explanationLanguage: session.nativeLanguage,
  };


  if (response.detailedFeedback && session.mode === "echo") {
    textResponse.detailedFeedback = response.detailedFeedback;
  }

  ws.send(JSON.stringify(textResponse));

  const correctionAudio = await generateAndSendTTS(
    ws,
    response.correction,
    session.learningLanguage,
    "correction"
  );
  

  let explanationAudio = "";
  if (response.explanation && response.explanation.trim()) {
    
    explanationAudio = await generateAndSendTTS(
      ws,
      response.explanation,
      session.nativeLanguage,
      "explanation"
    );
  }

  
  ws.send(JSON.stringify({
    type: "done",
    done: true,
    audioCorrectionUrl: correctionAudio,
    audioExplanationUrl: explanationAudio,
  }));

  clearAudioChunks(session);
};
