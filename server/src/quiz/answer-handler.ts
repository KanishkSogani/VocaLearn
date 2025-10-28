import { WebSocket } from "ws";
import { ClientSession } from "./types";

// Answer evaluation and handling logic for multiple-choice questions
export const handleQuizAnswer = async (
  ws: WebSocket,
  selectedOption: string,
  sessions: Map<WebSocket, ClientSession>
) => {
  const session = sessions.get(ws);
  if (!session || !session.quiz) return;

  try {
    const currentQ = session.quiz.questions[session.quiz.currentQuestion];
    currentQ.userAnswer = selectedOption;

    console.log(` Evaluating quiz answer: "${selectedOption}"`);

    // Handle empty/skipped answers
    if (!selectedOption || selectedOption.trim() === "") {
      console.log("Question was skipped or no answer provided");
      currentQ.isCorrect = false;
      
      // Send feedback to client
      ws.send(JSON.stringify({
        type: "quiz_feedback",
        isCorrect: false,
        correctAnswer: currentQ.correctAnswer,
        explanation: "Question skipped. Try to answer the next one!",
        score: session.quiz.score,
        currentQuestion: session.quiz.currentQuestion + 1,
        totalQuestions: session.quiz.totalQuestions,
        hasMoreQuestions: (session.quiz.currentQuestion + 1) < session.quiz.totalQuestions,
      }));

      // Move to next question or end quiz
      session.quiz.currentQuestion++;
      session.quiz.isWaitingForAnswer = false;

      return;
    }

    // Simple comparison - check if selected option matches correct answer
    const isCorrect = selectedOption.trim() === currentQ.correctAnswer.trim();
    currentQ.isCorrect = isCorrect;

    if (isCorrect) {
      session.quiz.score++;
    }

    // Generate simple feedback based on correctness
    const feedback = isCorrect 
      ? "Correct! Well done!" 
      : `Incorrect. The correct answer is: ${currentQ.correctAnswer}`;
    
    const explanation = isCorrect
      ? "Great job! You selected the right answer."
      : "Don't worry, keep practicing to improve!";

    // Send feedback to client
    ws.send(JSON.stringify({
      type: "quiz_feedback",
      isCorrect,
      correctAnswer: currentQ.correctAnswer,
      feedback,
      explanation,
      score: session.quiz.score,
      currentQuestion: session.quiz.currentQuestion + 1,
      totalQuestions: session.quiz.totalQuestions,
      hasMoreQuestions: (session.quiz.currentQuestion + 1) < session.quiz.totalQuestions,
    }));

    // Move to next question or end quiz
    session.quiz.currentQuestion++;
    session.quiz.isWaitingForAnswer = false;

    // Check if this was the last question
    if (session.quiz.currentQuestion >= session.quiz.totalQuestions) {
      console.log(" Last question completed - quiz finished");
    }

  } catch (error) {
    console.error(" Error handling quiz answer:", error);
    ws.send(JSON.stringify({ error: "Failed to evaluate quiz answer" }));
  }
};

// Helper function to detect potential duplicate transcriptions (kept for compatibility)
export const checkForDuplicateTranscription = (
  session: ClientSession, 
  newTranscription: string
): { isDuplicate: boolean; reason?: string } => {
  // Not used in new multiple-choice format, but keeping for compatibility
  return { isDuplicate: false };
};
