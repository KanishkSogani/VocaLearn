"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Trophy,
  Target,
  Brain,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Settings,
  BookOpen,
  Award,
  TrendingUp,
  Languages,
  Sparkles,
  Clock,
  FileText,
} from "lucide-react";
import Navigation from "@/components/LandingPage/Navigation";

interface Language {
  code: string;
  name: string;
  flag: string;
}

type QuestionType =
  | "grammar_pattern"
  | "synonym_antonym"
  | "definition_matching"
  | "pronunciation_minimal_pair";

interface QuizQuestion {
  id?: string;
  question: string;
  type?: QuestionType;
  options?: string[];
  userAnswer?: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  feedback?: string;
  explanation?: string;
}

interface QuizConfig {
  numberOfQuestions: number;
  topic: string;
  learningLanguage: string;
  nativeLanguage: string;
}

interface QuizFeedback {
  isCorrect: boolean;
  correctAnswer: string;
  score: number;
  feedback?: string;
  explanation?: string;
  currentQuestion?: number;
  totalQuestions?: number;
  hasMoreQuestions?: boolean;
}

interface QuizSummary {
  score: number;
  totalQuestions: number;
  percentage: number;
  questions: QuizQuestion[];
  detailedFeedback?: {
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
  };
}

type QuizState =
  | "setup"
  | "connecting"
  | "active"
  | "listening"
  | "processing"
  | "feedback"
  | "completed"
  | "error"
  | "waiting";

const languages: Language[] = [
  { code: "es-ES", name: "Spanish", flag: "🇪🇸" },
  { code: "fr-FR", name: "French", flag: "🇫🇷" },
  { code: "en-US", name: "English", flag: "🇺🇸" },
  { code: "hi-IN", name: "Hindi", flag: "🇮🇳" },
  { code: "ja-JP", name: "Japanese", flag: "🇯🇵" },
  { code: "it-IT", name: "Italian", flag: "🇮🇹" },
  { code: "de-DE", name: "German", flag: "🇩🇪" },
  { code: "nl-NL", name: "Dutch", flag: "🇳🇱" },
  { code: "pt-BR", name: "Portuguese", flag: "🇵🇹" },
];

const topics = [
  { value: "general", label: "General" },
  { value: "grammar", label: "Grammar" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "culture", label: "Culture" },
  { value: "conversation", label: "Conversation" },
];

export default function QuizMode() {
  // Configuration state
  const [config, setConfig] = useState<QuizConfig>({
    numberOfQuestions: 5,
    topic: "general",
    learningLanguage: "es-ES",
    nativeLanguage: "en-US",
  });

  // Quiz state
  const [quizState, setQuizState] = useState<QuizState>("setup");
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(
    null
  );
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [feedback, setFeedback] = useState<QuizFeedback | null>(null);
  const [summary, setSummary] = useState<QuizSummary | null>(null);
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState<string>("");

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const waitingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingToastRef = useRef<string | null>(null);
  const isCompletingRef = useRef<boolean>(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (waitingTimeoutRef.current) {
        clearTimeout(waitingTimeoutRef.current);
      }
      toast.dismiss();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-request summary when last question feedback is shown
  useEffect(() => {
    if (quizState === "feedback" && feedback && !feedback.hasMoreQuestions) {
      const timer = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          console.log("🎯 Requesting quiz summary after last question");
          wsRef.current.send(JSON.stringify({ action: "next_question" }));
          setQuizState("waiting");
          loadingToastRef.current = toast.loading("Generating your results...");

          // Set timeout for summary
          waitingTimeoutRef.current = setTimeout(() => {
            console.warn("Timeout waiting for quiz summary");
            if (loadingToastRef.current) {
              toast.dismiss(loadingToastRef.current);
              loadingToastRef.current = null;
            }
            toast.error("Failed to load results. Please try again.");
          }, 20000);
        }
      }, 2000); // Wait 2 seconds before auto-requesting summary

      return () => clearTimeout(timer);
    }
  }, [quizState, feedback]);

  const handleQuizMessage = useCallback((data: any) => {
    if (data.type === "quiz_question") {
      handleQuizQuestion(data);
    } else if (data.type === "quiz_feedback") {
      handleQuizFeedback(data);
    } else if (
      data.type === "quiz_summary" ||
      data.type === "quiz_ended_early"
    ) {
      handleQuizSummary(data);
    } else if (data.error) {
      if (data.error.includes("Connection") || data.error.includes("Server")) {
        setError(data.error);
      }
      console.error("Quiz error:", data.error);
      toast.error(data.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuizQuestion = useCallback((data: any) => {
    console.log("📥 Received quiz question:", data);

    // Dismiss any loading toasts
    if (loadingToastRef.current) {
      toast.dismiss(loadingToastRef.current);
      loadingToastRef.current = null;
    }

    // Clear any waiting timeout
    if (waitingTimeoutRef.current) {
      clearTimeout(waitingTimeoutRef.current);
      waitingTimeoutRef.current = null;
    }

    // Clear previous states
    setFeedback(null);
    setSelectedOption(null);

    // Set new question data
    setCurrentQuestion({
      question: data.question || "No question provided",
      type: data.questionType,
      options: data.options || [],
      id: data.questionId,
    });
    setCurrentQuestionNumber(data.questionNumber);
    setTotalQuestions(data.totalQuestions);
    setQuizState("active");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuizFeedback = useCallback((data: any) => {
    // Dismiss any loading toasts
    if (loadingToastRef.current) {
      toast.dismiss(loadingToastRef.current);
      loadingToastRef.current = null;
    }

    setFeedback({
      isCorrect: data.isCorrect,
      correctAnswer: data.correctAnswer,
      score: data.score,
      feedback: data.feedback,
      explanation: data.explanation,
      currentQuestion: data.currentQuestion,
      totalQuestions: data.totalQuestions,
      hasMoreQuestions: data.hasMoreQuestions,
    });
    setCurrentScore(data.score);
    setQuizState("feedback");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuizSummary = useCallback((data: any) => {
    // Dismiss any loading toasts
    if (loadingToastRef.current) {
      toast.dismiss(loadingToastRef.current);
      loadingToastRef.current = null;
    }

    // Mark that we're completing the quiz
    isCompletingRef.current = true;

    setSummary({
      score: data.score,
      totalQuestions: data.totalQuestions,
      percentage: data.percentage,
      questions: data.questions || [],
      detailedFeedback: data.detailedFeedback,
    });
    setAllQuestions(data.questions || []);
    setQuizState("completed");

    // Close WebSocket connection after a small delay to ensure state updates
    setTimeout(() => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }, 100);
  }, []);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setQuizState("connecting");
    const wsUrl = `ws://localhost:4001?mode=quiz&learningLanguage=${config.learningLanguage}&nativeLanguage=${config.nativeLanguage}&questions=${config.numberOfQuestions}&topic=${config.topic}`;

    console.log("Connecting to WebSocket:", wsUrl);
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.binaryType = "arraybuffer";

    wsRef.current.onopen = () => {
      console.log("WebSocket connected successfully");
      setQuizState("active");
      setError("");
      toast.success("Connected! Starting quiz...");
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📨 Quiz message:", data);
        handleQuizMessage(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
      setQuizState("error");
      setError("Connection failed. Please check if the server is running.");
      toast.error("Connection failed. Please check server status.");
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket disconnected");
      // Only reset to setup if we're not intentionally completing the quiz
      if (!isCompletingRef.current) {
        setQuizState("setup");
      }
    };
  }, [config, handleQuizMessage]);

  const startQuiz = () => {
    // Clear any previous errors
    setError("");
    // Reset completion flag
    isCompletingRef.current = false;
    connectWebSocket();
  };

  const submitAnswer = () => {
    if (!selectedOption || !wsRef.current) return;

    console.log("📤 Submitting answer:", selectedOption);
    wsRef.current.send(
      JSON.stringify({
        action: "submit_answer",
        selectedOption: selectedOption,
      })
    );

    setQuizState("processing");
    loadingToastRef.current = toast.loading("Checking your answer...");
  };

  const skipQuestion = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Send skip request
      wsRef.current.send(JSON.stringify({ action: "skip_question" }));

      // Clear selection
      setSelectedOption(null);

      // Set state to waiting for next question
      setQuizState("waiting");

      // Set timeout to prevent getting stuck in waiting state
      waitingTimeoutRef.current = setTimeout(() => {
        console.warn("Timeout waiting for next question after skip");
        setQuizState("active");
        toast.error("Failed to load next question. Please try again.");
      }, 15000);
    }
  };

  const continueToNext = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Clear feedback state
      setFeedback(null);
      setSelectedOption(null);

      // Send next question request
      wsRef.current.send(JSON.stringify({ action: "next_question" }));

      // Set state to waiting for next question
      setQuizState("waiting");

      // Set timeout to prevent getting stuck in waiting state
      waitingTimeoutRef.current = setTimeout(() => {
        console.warn("Timeout waiting for next question");
        setQuizState("active");
        toast.error("Failed to load next question. Please try again.");
      }, 15000);
    }
  };

  const endQuiz = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("🛑 Ending quiz manually");

      // Clear feedback to prevent auto-summary request
      setFeedback(null);

      // Set processing state to show we're ending
      setQuizState("processing");
      loadingToastRef.current = toast.loading(
        "Ending quiz and generating results..."
      );

      wsRef.current.send(JSON.stringify({ action: "end_quiz" }));

      // Set timeout in case summary doesn't arrive
      waitingTimeoutRef.current = setTimeout(() => {
        console.warn("Timeout waiting for quiz summary after end_quiz");
        if (loadingToastRef.current) {
          toast.dismiss(loadingToastRef.current);
          loadingToastRef.current = null;
        }
        toast.error("Failed to load results. Please try again.");
        setQuizState("active");
      }, 20000); // 20 second timeout for summary generation
    }
  };

  const resetQuiz = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (waitingTimeoutRef.current) {
      clearTimeout(waitingTimeoutRef.current);
      waitingTimeoutRef.current = null;
    }
    isCompletingRef.current = false;
    setQuizState("setup");
    setCurrentQuestion(null);
    setCurrentQuestionNumber(0);
    setTotalQuestions(0);
    setCurrentScore(0);
    setFeedback(null);
    setSummary(null);
    setAllQuestions([]);
    setError("");
    setSelectedOption(null);
  };

  const getLanguageDisplayName = (code: string) => {
    const lang = languages.find((l) => l.code === code);
    return lang ? lang.name.split(" (")[0] : code;
  };

  const getQuestionTypeLabel = (type?: QuestionType) => {
    const labels = {
      grammar_pattern: "📝 Grammar Pattern",
      synonym_antonym: "🔤 Synonym/Antonym",
      definition_matching: "📖 Definition Matching",
      pronunciation_minimal_pair: "🗣️ Pronunciation",
    };
    return type ? labels[type] : "Question";
  };

  const progressPercentage =
    totalQuestions > 0 ? (currentQuestionNumber / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          {error && quizState === "error" && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {quizState === "setup" && (
            <>
              {/* Quiz Configuration */}
              <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-orange-600" />
                    <CardTitle className="text-xl">
                      Quiz Configuration
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Customize your quiz settings for the best learning
                    experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Number of Questions (1-20)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={config.numberOfQuestions}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            numberOfQuestions: parseInt(e.target.value) || 5,
                          })
                        }
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Topic
                      </label>
                      <Select
                        value={config.topic}
                        onValueChange={(value) =>
                          setConfig({ ...config, topic: value })
                        }
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {topics.map((topic) => (
                            <SelectItem key={topic.value} value={topic.value}>
                              {topic.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Learning Language
                      </label>
                      <Select
                        value={config.learningLanguage}
                        onValueChange={(value) =>
                          setConfig({ ...config, learningLanguage: value })
                        }
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              <div className="flex items-center space-x-2">
                                <span>{lang.flag}</span>
                                <span>{lang.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Native Language (for explanations)
                      </label>
                      <Select
                        value={config.nativeLanguage}
                        onValueChange={(value) =>
                          setConfig({ ...config, nativeLanguage: value })
                        }
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              <div className="flex items-center space-x-2">
                                <span>{lang.flag}</span>
                                <span>{lang.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-2 text-orange-700">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Ready for {config.numberOfQuestions} {config.topic}{" "}
                        questions in{" "}
                        {getLanguageDisplayName(config.learningLanguage)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Start Button */}
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={startQuiz}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-6 text-lg"
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  Start Quiz
                </Button>
              </div>
            </>
          )}

          {quizState !== "setup" && quizState !== "completed" && (
            <>
              {/* Progress Section */}
              <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {config.topic.charAt(0).toUpperCase() +
                            config.topic.slice(1)}{" "}
                          Quiz
                        </h2>
                        <p className="text-sm text-gray-500">
                          {getLanguageDisplayName(config.learningLanguage)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">
                        {currentScore}/{totalQuestions}
                      </div>
                      <p className="text-sm text-gray-500">Score</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>
                        Question {currentQuestionNumber} of {totalQuestions}
                      </span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Question Section */}
              {(quizState === "active" || quizState === "processing") &&
                currentQuestion && (
                  <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                          <CardTitle className="text-lg">
                            Current Question
                          </CardTitle>
                          <Badge variant="secondary">
                            {getQuestionTypeLabel(currentQuestion.type)}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={skipQuestion}
                          disabled={quizState === "processing"}
                        >
                          <SkipForward className="w-4 h-4 mr-1" />
                          Skip
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-white rounded-lg p-6 border border-blue-100">
                        <p className="text-lg text-gray-800 leading-relaxed">
                          {currentQuestion.question}
                        </p>
                      </div>

                      {/* Multiple Choice Options */}
                      <div className="space-y-3">
                        {currentQuestion.options?.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedOption(option)}
                            disabled={quizState === "processing"}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                              selectedOption === option
                                ? "border-blue-600 bg-blue-50 shadow-md"
                                : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                            } ${
                              quizState === "processing"
                                ? "opacity-60 cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  selectedOption === option
                                    ? "border-blue-600 bg-blue-600"
                                    : "border-gray-300"
                                }`}
                              >
                                {selectedOption === option && (
                                  <CheckCircle className="w-4 h-4 text-white" />
                                )}
                              </div>
                              <span className="text-gray-800 flex-1">
                                {option}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-center space-x-4 pt-4">
                        <Button
                          size="lg"
                          onClick={submitAnswer}
                          disabled={
                            !selectedOption || quizState === "processing"
                          }
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6"
                        >
                          {quizState === "processing" ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Checking...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Submit Answer
                            </>
                          )}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={endQuiz}
                          disabled={quizState === "processing"}
                          className="px-6 py-6"
                        >
                          End Quiz
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Waiting for Next Question */}
              {quizState === "waiting" && (
                <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                      <p className="text-amber-700 font-medium">
                        Loading next question...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Feedback Section */}
          {quizState === "feedback" && feedback && (
            <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <CardTitle className="text-lg">Feedback</CardTitle>
                    <Badge
                      className={
                        feedback.isCorrect
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-red-100 text-red-700 border-red-200"
                      }
                    >
                      {feedback.isCorrect ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {feedback.isCorrect ? "Correct" : "Incorrect"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Correct Answer:</strong> {feedback.correctAnswer}
                  </p>
                  {feedback.feedback && (
                    <p className="text-gray-800 leading-relaxed">
                      {feedback.feedback}
                    </p>
                  )}
                </div>

                {feedback.explanation && (
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <h4 className="font-medium text-amber-900 mb-2">
                      📚 Explanation
                    </h4>
                    <p className="text-amber-800 text-sm leading-relaxed">
                      {feedback.explanation}
                    </p>
                  </div>
                )}

                <div className="flex justify-center pt-4">
                  {feedback.hasMoreQuestions ? (
                    <Button
                      size="lg"
                      onClick={continueToNext}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-6"
                    >
                      Continue to Next Question
                    </Button>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">
                        That was the last question! Loading results...
                      </p>
                      <Loader2 className="w-8 h-8 mx-auto text-purple-600 animate-spin" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Quiz Summary */}
          {quizState === "completed" && summary && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-green-800">
                    Quiz Complete!
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    Well done! Here&apos;s how you performed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Score Display */}
                  <div className="text-center">
                    <div className="text-6xl font-bold text-green-600 mb-2">
                      {summary.score}/{summary.totalQuestions}
                    </div>
                    <div className="text-2xl text-green-700 mb-4">
                      {summary.percentage}%
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-lg px-4 py-2">
                      <Award className="w-4 h-4 mr-2" />
                      {summary.percentage >= 80
                        ? "Excellent!"
                        : summary.percentage >= 60
                        ? "Good Job!"
                        : "Keep Practicing!"}
                    </Badge>
                  </div>

                  {/* Performance Scores */}
                  {summary.detailedFeedback && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        {
                          label: "Overall",
                          score: summary.detailedFeedback.overallScore,
                        },
                        {
                          label: "Grammar",
                          score: summary.detailedFeedback.grammarScore,
                        },
                        {
                          label: "Vocabulary",
                          score: summary.detailedFeedback.vocabularyScore,
                        },
                        {
                          label: "Comprehension",
                          score: summary.detailedFeedback.comprehensionScore,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="bg-white rounded-lg p-4 text-center border border-green-100"
                        >
                          <div className="text-sm font-medium text-gray-600 mb-1">
                            {item.label}
                          </div>
                          <div
                            className={`text-xl font-bold ${
                              (item.score || 0) >= 80
                                ? "text-green-600"
                                : (item.score || 0) >= 60
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {Math.round(item.score || 0)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Overall Feedback */}
                  {summary.detailedFeedback?.feedback && (
                    <div className="bg-white rounded-lg p-6 border border-green-100">
                      <h4 className="font-medium text-green-900 mb-3 flex items-center">
                        <Brain className="w-4 h-4 mr-2" />
                        Overall Feedback
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {summary.detailedFeedback.feedback}
                      </p>
                    </div>
                  )}

                  {/* Strengths, Weaknesses, Recommendations */}
                  {summary.detailedFeedback?.strengthsAndWeaknesses && (
                    <div className="grid md:grid-cols-3 gap-4">
                      {/* Strengths */}
                      <div className="bg-white rounded-lg p-4 border border-green-100">
                        <div className="flex items-center space-x-2 mb-3">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <h4 className="font-medium text-green-600">
                            Strengths
                          </h4>
                        </div>
                        <ul className="space-y-1">
                          {summary.detailedFeedback.strengthsAndWeaknesses.strengths?.map(
                            (strength, index) => (
                              <li
                                key={index}
                                className="text-sm text-green-700 flex items-start space-x-2"
                              >
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>{strength}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div className="bg-white rounded-lg p-4 border border-orange-100">
                        <div className="flex items-center space-x-2 mb-3">
                          <Target className="w-4 h-4 text-orange-600" />
                          <h4 className="font-medium text-orange-600">
                            Areas for Improvement
                          </h4>
                        </div>
                        <ul className="space-y-1">
                          {summary.detailedFeedback.strengthsAndWeaknesses.weaknesses?.map(
                            (weakness, index) => (
                              <li
                                key={index}
                                className="text-sm text-orange-700 flex items-start space-x-2"
                              >
                                <span className="text-orange-500 mt-0.5">
                                  !
                                </span>
                                <span>{weakness}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      {/* Recommendations */}
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center space-x-2 mb-3">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          <h4 className="font-medium text-blue-600">
                            Recommendations
                          </h4>
                        </div>
                        <ul className="space-y-1">
                          {summary.detailedFeedback.strengthsAndWeaknesses.recommendations?.map(
                            (rec, index) => (
                              <li
                                key={index}
                                className="text-sm text-blue-700 flex items-start space-x-2"
                              >
                                <span className="text-blue-500 mt-0.5">→</span>
                                <span>{rec}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      size="lg"
                      onClick={() => setShowReviewModal(true)}
                      variant="outline"
                      className="px-8 py-6"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Review Answers
                    </Button>
                    <Button
                      size="lg"
                      onClick={resetQuiz}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-6"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Take Another Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tips Section */}
          <Card className="mt-8 border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>Quiz Mode Tips</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Best Practices</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Read each question carefully before selecting</li>
                    <li>• Consider all options before making your choice</li>
                    <li>• Review the explanations to learn from mistakes</li>
                    <li>• Take your time - there&apos;s no rush!</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">
                    How Quiz Mode Works
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• AI generates diverse question types</li>
                    <li>• Multiple-choice format for easy answering</li>
                    <li>• Instant feedback with detailed explanations</li>
                    <li>• Comprehensive performance analysis at the end</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Quiz Review
              </h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {allQuestions.map((question, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Question {index + 1}</div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {getQuestionTypeLabel(question.type)}
                        </Badge>
                        {question.isCorrect !== undefined && (
                          <Badge
                            className={
                              question.isCorrect
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-red-100 text-red-700 border-red-200"
                            }
                          >
                            {question.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mb-2 text-gray-700">
                      {question.question}
                    </div>
                    <div className="text-sm space-y-1">
                      <div>
                        <strong>Your Answer:</strong>{" "}
                        <span
                          className={
                            question.isCorrect
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {question.userAnswer || "Skipped"}
                        </span>
                      </div>
                      {!question.isCorrect && (
                        <div>
                          <strong>Correct Answer:</strong>{" "}
                          <span className="text-green-600">
                            {question.correctAnswer}
                          </span>
                        </div>
                      )}
                      {question.explanation && (
                        <div className="mt-2 p-2 bg-amber-50 rounded text-amber-800">
                          <strong>Explanation:</strong> {question.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t">
              <Button
                onClick={() => setShowReviewModal(false)}
                className="w-full"
              >
                Close Review
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
