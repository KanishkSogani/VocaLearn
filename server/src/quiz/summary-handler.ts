import { WebSocket } from "ws";
import { getLanguageName } from "../utils/languages";
import { ClientSession } from "./types";
import { callLLM } from "../services/llm/base";


interface QuizDetailedFeedback {
  grammarScore: number;
  vocabularyScore: number;
  comprehensionScore: number;
  overallScore: number;
  feedback: string;
  strengthsAndWeaknesses: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}

// Generate detailed quiz feedback using LLM
const generateDetailedQuizFeedback = async (
  questions: any[],
  learningLanguage: string,
  nativeLanguage: string
): Promise<QuizDetailedFeedback> => {
  const answeredQuestions = questions.filter(q => q.userAnswer);
  const correctAnswers = answeredQuestions.filter(q => q.isCorrect).length;
  const totalAnswered = answeredQuestions.length;

  const prompt = `You are an expert language teacher analyzing a student's multiple-choice quiz performance. Provide concise, actionable feedback.

QUIZ RESULTS:
- Total questions answered: ${totalAnswered}
- Correct answers: ${correctAnswers}
- Learning language: ${learningLanguage}
- Questions and answers:
${answeredQuestions.map((q, i) => `
${i + 1}. Q: ${q.question}
   Type: ${q.type}
   Correct Answer: ${q.correctAnswer}
   Student Selected: ${q.userAnswer || 'Not answered'}
   Result: ${q.isCorrect ? 'Correct' : 'Incorrect'}
`).join('')}

Provide scores (0-100) for:
1. GRAMMAR: Understanding of grammar patterns and sentence structure
2. VOCABULARY: Word knowledge, synonyms, antonyms, and definitions
3. COMPREHENSION: Overall understanding and question interpretation
4. OVERALL: Combined performance

Give brief, encouraging feedback ALL IN ${nativeLanguage === 'en-US' ? 'English' : nativeLanguage} (MAX 200 WORDS total for all feedback):
- Focus on 1-2 key strengths observed
- Identify 1-2 main areas for improvement  
- Suggest 1-2 specific practice recommendations

CRITICAL: ALL TEXT must be in ${nativeLanguage === 'en-US' ? 'English' : nativeLanguage} language - including strengths, weaknesses, and recommendations.
Keep all feedback concise, actionable, and under 200 words total.

Respond in JSON format:
{
  "grammarScore": <0-100>, 
  "vocabularyScore": <0-100>,
  "comprehensionScore": <0-100>,
  "overallScore": <0-100>,
  "feedback": "<brief encouraging summary in ${nativeLanguage === 'en-US' ? 'English' : nativeLanguage}>",
  "strengthsAndWeaknesses": {
    "strengths": ["<key strength 1 in ${nativeLanguage === 'en-US' ? 'English' : nativeLanguage}>", "<key strength 2 in ${nativeLanguage === 'en-US' ? 'English' : nativeLanguage}>"],
    "weaknesses": ["<main weakness 1 in ${nativeLanguage === 'en-US' ? 'English' : nativeLanguage}>", "<main weakness 2 in ${nativeLanguage === 'en-US' ? 'English' : nativeLanguage}>"], 
    "recommendations": ["<specific tip 1 in ${nativeLanguage === 'en-US' ? 'English' : nativeLanguage}>", "<specific tip 2 in ${nativeLanguage === 'en-US' ? 'English' : nativeLanguage}>"]
  }
}`;

  try {
    const response = await callLLM(prompt);
    console.log(" LLM Quiz Feedback Response:", response);
    
    const parsed = JSON.parse(response);
    
    return {
      grammarScore: Math.max(0, Math.min(100, parsed.grammarScore || 0)),
      vocabularyScore: Math.max(0, Math.min(100, parsed.vocabularyScore || 0)),
      comprehensionScore: Math.max(0, Math.min(100, parsed.comprehensionScore || 0)),
      overallScore: Math.max(0, Math.min(100, parsed.overallScore || 0)),
      feedback: parsed.feedback || "Great effort on completing the quiz!",
      strengthsAndWeaknesses: parsed.strengthsAndWeaknesses || {
        strengths: ["You completed the quiz"],
        weaknesses: ["Continue practicing"],
        recommendations: ["Keep learning regularly"]
      }
    };
  } catch (error) {
    console.error(" Error generating detailed quiz feedback:", error);
    
    
    const fallbackFeedback = generateFallbackFeedback(nativeLanguage);
    
    return {
      grammarScore: 50,
      vocabularyScore: 50,
      comprehensionScore: 50,
      overallScore: 50,
      feedback: fallbackFeedback.feedback,
      strengthsAndWeaknesses: {
        strengths: fallbackFeedback.strengths,
        weaknesses: fallbackFeedback.weaknesses,
        recommendations: fallbackFeedback.recommendations
      }
    };
  }
};


const generateSummaryText = (
  score: number, 
  totalQuestions: number, 
  learningLanguageName: string, 
  nativeLanguage: string
): string => {
  const percentage = Math.round((score / totalQuestions) * 100);
  
  // Generate summary based on native language
  switch (nativeLanguage) {
    case 'es-ES':
      return `¡Cuestionario completado! ... Obtuviste ${score} de ${totalQuestions} ... ¡Eso es ${percentage} por ciento! ... ¡Excelente trabajo practicando tu ${learningLanguageName}!`;
    
    case 'fr-FR':
      return `Quiz terminé! ... Vous avez obtenu ${score} sur ${totalQuestions} ... C'est ${percentage} pour cent! ... Excellent travail en pratiquant votre ${learningLanguageName}!`;
    
    case 'hi-IN':
      return `प्रश्नोत्तरी पूर्ण! ... आपने ${score} में से ${totalQuestions} अंक प्राप्त किए ... यह ${percentage} प्रतिशत है! ... ${learningLanguageName} का अभ्यास करने के लिए बहुत बढ़िया काम!`;
    
    case 'de-DE':
      return `Quiz abgeschlossen! ... Sie haben ${score} von ${totalQuestions} erreicht ... Das sind ${percentage} Prozent! ... Großartige Arbeit beim Üben Ihres ${learningLanguageName}!`;
    
    case 'it-IT':
      return `Quiz completato! ... Hai ottenuto ${score} su ${totalQuestions} ... È il ${percentage} percento! ... Ottimo lavoro nel praticare il tuo ${learningLanguageName}!`;
    
    case 'jp-JP':
      return `クイズ完了！ ... ${totalQuestions}問中${score}問正解 ... ${percentage}パーセントです！ ... ${learningLanguageName}の練習、素晴らしい仕事です！`;
    
    case 'en-US':
    default:
      return `Quiz completed! ... You scored ${score} out of ${totalQuestions} ... That's ${percentage} percent! ... Great job practicing your ${learningLanguageName}!`;
  }
};
export const sendQuizSummary = async (
  ws: WebSocket,
  sessions: Map<WebSocket, ClientSession>
) => {
  const session = sessions.get(ws);
  if (!session || !session.quiz) return;

  try {
    const { score, totalQuestions } = session.quiz;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    
    const learningLanguageName = getLanguageName(session.learningLanguage);
    
    
    const summaryText = generateSummaryText(score, totalQuestions, learningLanguageName, session.nativeLanguage);

    console.log(`🎉 Quiz completed - Score: ${score}/${totalQuestions}`);

    
    const questions = session.quiz.questions || [];

    
    const detailedFeedback = await generateDetailedQuizFeedback(
      questions,
      session.learningLanguage,
      session.nativeLanguage
    );

    
    ws.send(JSON.stringify({
      type: "quiz_summary",
      score,
      totalQuestions,
      percentage,
      summary: summaryText,
      
      questions: questions,

      detailedFeedback: {
        grammarScore: detailedFeedback.grammarScore,
        vocabularyScore: detailedFeedback.vocabularyScore,
        comprehensionScore: detailedFeedback.comprehensionScore,
        overallScore: detailedFeedback.overallScore,
        feedback: detailedFeedback.feedback,
        strengths: detailedFeedback.strengthsAndWeaknesses.strengths,
        weaknesses: detailedFeedback.strengthsAndWeaknesses.weaknesses,
        recommendations: detailedFeedback.strengthsAndWeaknesses.recommendations
      }
    }));

    
    session.quiz = undefined;

  } catch (error) {
    console.error("Error sending quiz summary:", error);
    ws.send(JSON.stringify({ error: "Failed to generate quiz summary" }));
  }
};


const generateEarlyEndText = (
  score: number,
  currentQuestion: number,
  totalQuestions: number,
  reason: string,
  learningLanguageName: string,
  nativeLanguage: string
): string => {
  switch (nativeLanguage) {
    case 'es-ES':
      return `Cuestionario terminado después de ${currentQuestion} de ${totalQuestions} preguntas. ... Obtuviste ${score} de ${currentQuestion}. ... ${reason}`;
    
    case 'fr-FR':
      return `Quiz terminé après ${currentQuestion} sur ${totalQuestions} questions. ... Vous avez obtenu ${score} sur ${currentQuestion}. ... ${reason}`;
    
    case 'hi-IN':
      return `${totalQuestions} में से ${currentQuestion} प्रश्नों के बाद प्रश्नोत्तरी समाप्त। ... आपने ${currentQuestion} में से ${score} अंक प्राप्त किए। ... ${reason}`;
    
    case 'de-DE':
      return `Quiz nach ${currentQuestion} von ${totalQuestions} Fragen beendet. ... Sie haben ${score} von ${currentQuestion} erreicht. ... ${reason}`;
    
    case 'it-IT':
      return `Quiz terminato dopo ${currentQuestion} di ${totalQuestions} domande. ... Hai ottenuto ${score} su ${currentQuestion}. ... ${reason}`;
    
    case 'jp-JP':
      return `${totalQuestions}問中${currentQuestion}問でクイズ終了。 ... ${currentQuestion}問中${score}問正解。 ... ${reason}`;
    
    case 'en-US':
    default:
      return `Quiz ended after ${currentQuestion} of ${totalQuestions} questions. ... You scored ${score} out of ${currentQuestion}. ... ${reason}`;
  }
};

export const endQuizEarly = async (
  ws: WebSocket,
  sessions: Map<WebSocket, ClientSession>,
  reason: string = "Quiz ended by user"
) => {
  const session = sessions.get(ws);
  if (!session || !session.quiz) return;

  console.log(`Quiz ended early: ${reason}`);

  const { score, currentQuestion, totalQuestions } = session.quiz;
  
  const learningLanguageName = getLanguageName(session.learningLanguage);
  const summaryText = generateEarlyEndText(score, currentQuestion, totalQuestions, reason, learningLanguageName, session.nativeLanguage);

  try {

    const questions = session.quiz.questions || [];
    const answeredQuestions = questions.slice(0, currentQuestion);
    const detailedFeedback = await generateDetailedQuizFeedback(
      answeredQuestions,
      session.learningLanguage,
      session.nativeLanguage
    );

    ws.send(JSON.stringify({
      type: "quiz_ended_early",
      reason,
      score,
      questionsAnswered: currentQuestion,
      totalQuestions,
      summary: summaryText,
      questions: answeredQuestions,
      detailedFeedback: {
        grammarScore: detailedFeedback.grammarScore,
        vocabularyScore: detailedFeedback.vocabularyScore,
        comprehensionScore: detailedFeedback.comprehensionScore,
        overallScore: detailedFeedback.overallScore,
        feedback: detailedFeedback.feedback,
        strengths: detailedFeedback.strengthsAndWeaknesses.strengths,
        weaknesses: detailedFeedback.strengthsAndWeaknesses.weaknesses,
        recommendations: detailedFeedback.strengthsAndWeaknesses.recommendations
      }
    }));


    session.quiz = undefined;

  } catch (error) {
    console.error("Error ending quiz early:", error);
    ws.send(JSON.stringify({ error: "Failed to end quiz" }));
  }
};


const generateFallbackFeedback = (nativeLanguage: string) => {
  switch (nativeLanguage) {
    case 'es-ES':
      return {
        feedback: "¡Gran esfuerzo al completar el cuestionario! Sigue practicando para mejorar tus habilidades.",
        strengths: ["Completaste el cuestionario", "Estás aprendiendo activamente"],
        weaknesses: ["Continúa practicando regularmente"],
        recommendations: ["Revisa vocabulario", "Practica hablar más", "Toma más cuestionarios"]
      };
    
    case 'fr-FR':
      return {
        feedback: "Excellent effort pour terminer le quiz! Continuez à pratiquer pour améliorer vos compétences.",
        strengths: ["Vous avez terminé le quiz", "Vous apprenez activement"],
        weaknesses: ["Continuez à pratiquer régulièrement"],
        recommendations: ["Révisez le vocabulaire", "Pratiquez plus l'oral", "Faites plus de quiz"]
      };
    
    case 'hi-IN':
      return {
        feedback: "प्रश्नोत्तरी पूरी करने के लिए बहुत अच्छा प्रयास! अपने कौशल को बेहतर बनाने के लिए अभ्यास जारी रखें।",
        strengths: ["आपने प्रश्नोत्तरी पूरी की", "आप सक्रिय रूप से सीख रहे हैं"],
        weaknesses: ["नियमित अभ्यास जारी रखें"],
        recommendations: ["शब्दावली की समीक्षा करें", "अधिक बोलने का अभ्यास करें", "और प्रश्नोत्तरी लें"]
      };
    
    case 'de-DE':
      return {
        feedback: "Großartige Anstrengung beim Abschließen des Quiz! Üben Sie weiter, um Ihre Fähigkeiten zu verbessern.",
        strengths: ["Sie haben das Quiz abgeschlossen", "Sie lernen aktiv"],
        weaknesses: ["Üben Sie weiterhin regelmäßig"],
        recommendations: ["Wortschatz wiederholen", "Mehr sprechen üben", "Mehr Quiz machen"]
      };
    
    case 'it-IT':
      return {
        feedback: "Ottimo sforzo nel completare il quiz! Continua a praticare per migliorare le tue competenze.",
        strengths: ["Hai completato il quiz", "Stai imparando attivamente"],
        weaknesses: ["Continua a praticare regolarmente"],
        recommendations: ["Rivedere il vocabolario", "Praticare di più nel parlare", "Fare più quiz"]
      };
    
    case 'nl-NL':
      return {
        feedback: "Geweldige inspanning om de quiz te voltooien! Blijf oefenen om je vaardigheden te verbeteren.",
        strengths: ["Je hebt de quiz voltooid", "Je leert actief"],
        weaknesses: ["Blijf regelmatig oefenen"],
        recommendations: ["Woordenschat herzien", "Meer spreken oefenen", "Meer quizzen maken"]
      };
    
    case 'pt-BR':
      return {
        feedback: "Ótimo esforço ao completar o questionário! Continue praticando para melhorar suas habilidades.",
        strengths: ["Você completou o questionário", "Você está aprendendo ativamente"],
        weaknesses: ["Continue praticando regularmente"],
        recommendations: ["Revisar vocabulário", "Praticar mais a fala", "Fazer mais questionários"]
      };
    
    case 'en-US':
    default:
      return {
        feedback: "Great effort on completing the quiz! Keep practicing to improve your skills.",
        strengths: ["You completed the quiz", "You're actively learning"],
        weaknesses: ["Continue practicing regularly"],
        recommendations: ["Review vocabulary", "Practice speaking more", "Take more quizzes"]
      };
  }
};
