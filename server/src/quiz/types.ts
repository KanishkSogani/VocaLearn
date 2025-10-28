
export type QuestionType = 
  | "grammar_pattern"
  | "synonym_antonym"
  | "definition_matching"
  | "pronunciation_minimal_pair";

export interface QuizQuestion {
  question: string;
  type: QuestionType;
  options: string[]; // 4 options
  correctAnswer: string; // The correct option text
  userAnswer?: string; // The user's selected option
  isCorrect?: boolean; // Whether user answered correctly
}

export interface QuizSession {
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  topic: string;
  questions: QuizQuestion[];
  isWaitingForAnswer: boolean;
  questionHistory: string[]; 
  summaryGenerated?: boolean; 
}

export interface ClientSession {
  audioChunks: Buffer[];
  learningLanguage: string;
  nativeLanguage: string;
  mode: string;
  quiz?: QuizSession;
  isProcessing?: boolean; 
  lastTranscription?: string; 
  lastTranscriptionTime?: number; 
  retryCount?: number; 
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason?: string;
}
