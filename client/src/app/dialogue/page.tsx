"use client";

import { useState, useEffect, useRef } from "react";
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
import {
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ArrowLeft,
  Brain,
  Languages,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  Coffee,
  Briefcase,
  Plane,
  ShoppingCart,
  Heart,
  RotateCcw,
  Send,
} from "lucide-react";
import Link from "next/link";
import Navigation from "@/components/LandingPage/Navigation";

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: any;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  context: string;
}

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

const scenarios: Scenario[] = [
  {
    id: "cafe",
    title: "Café Conversation",
    description: "Order coffee and chat with locals",
    icon: Coffee,
    difficulty: "Beginner",
    context:
      "You are at a local café wanting to order coffee and practice small talk.",
  },
  {
    id: "business",
    title: "Business Meeting",
    description: "Professional discussions and presentations",
    icon: Briefcase,
    difficulty: "Advanced",
    context:
      "You are in a business meeting discussing quarterly results and future plans.",
  },
  {
    id: "travel",
    title: "Travel & Tourism",
    description: "Navigate airports, hotels, and attractions",
    icon: Plane,
    difficulty: "Intermediate",
    context:
      "You are traveling and need to communicate with hotel staff, tour guides, and locals.",
  },
  {
    id: "shopping",
    title: "Shopping Experience",
    description: "Browse stores and make purchases",
    icon: ShoppingCart,
    difficulty: "Beginner",
    context:
      "You are shopping for clothes and need to ask about sizes, prices, and recommendations.",
  },
  {
    id: "social",
    title: "Social Gathering",
    description: "Meet new people and make friends",
    icon: Heart,
    difficulty: "Intermediate",
    context:
      "You are at a social event meeting new people and engaging in casual conversations.",
  },
];

type ConversationState =
  | "setup"
  | "connecting"
  | "active"
  | "listening"
  | "processing"
  | "responding"
  | "error";

interface Message {
  id: string;
  type: "user" | "ai" | "system";
  text: string;
  timestamp: Date;
  isPlaying?: boolean;
}

export default function DialogueMode() {
  const [learningLanguage, setLearningLanguage] = useState<string>("");
  const [nativeLanguage, setNativeLanguage] = useState<string>("en-US");
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  const [conversationState, setConversationState] =
    useState<ConversationState>("setup");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  // WebSocket and Audio refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioLevelRef = useRef<NodeJS.Timeout>();
  const conversationHistoryRef = useRef<
    Array<{ role: "user" | "assistant"; content: string; timestamp: number }>
  >([]);
  const isRecordingRef = useRef<boolean>(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isRecording) {
      audioLevelRef.current = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
    } else {
      if (audioLevelRef.current) {
        clearInterval(audioLevelRef.current);
      }
      setAudioLevel(0);
    }

    return () => {
      if (audioLevelRef.current) clearInterval(audioLevelRef.current);
    };
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const cleanupAudio = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
  };

  const addMessage = (
    text: string,
    type: "user" | "ai" | "system" = "user"
  ) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);

    // Add to conversation history for API
    if (type !== "system") {
      conversationHistoryRef.current.push({
        role: type === "ai" ? "assistant" : "user",
        content: text,
        timestamp: Date.now(),
      });
    }
  };

  const getWebSocketUrl = () => {
    return `wss://vocalearn-k19l.onrender.com?learningLanguage=${learningLanguage}&nativeLanguage=${nativeLanguage}&mode=dialogue&scenarioId=${selectedScenario}`;
  };

  const setupAudioWorklet = async () => {
    const workletCode = `
      class PCMWorkletProcessor extends AudioWorkletProcessor {
        process(inputs) {
          const input = inputs[0][0];
          if (!input) return true;
          const buffer = new ArrayBuffer(input.length * 2);
          const view = new DataView(buffer);
          for (let i = 0; i < input.length; i++) {
            let sample = Math.max(-1, Math.min(1, input[i]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(i * 2, sample, true);
          }
          this.port.postMessage(buffer);
          return true;
        }
      }
      registerProcessor('pcm-worklet', PCMWorkletProcessor);
    `;

    await audioContextRef.current!.audioWorklet.addModule(
      URL.createObjectURL(
        new Blob([workletCode], { type: "application/javascript" })
      )
    );
  };

  const startConversation = async () => {
    if (!learningLanguage || !selectedScenario) {
      setError("Please select both language and scenario first.");
      return;
    }

    try {
      setError("");
      setConversationState("connecting");
      setMessages([]);
      conversationHistoryRef.current = [];

      // Setup WebSocket
      const ws = new WebSocket(getWebSocketUrl());
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = async () => {
        try {
          addMessage("Connected! Setting up audio...", "system");

          // Setup audio
          audioStreamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: {
              sampleRate: 16000,
              channelCount: 1,
            },
          });

          audioContextRef.current = new AudioContext({ sampleRate: 16000 });
          await setupAudioWorklet();

          const source = audioContextRef.current.createMediaStreamSource(
            audioStreamRef.current
          );
          workletNodeRef.current = new AudioWorkletNode(
            audioContextRef.current,
            "pcm-worklet"
          );

          workletNodeRef.current.port.onmessage = (event) => {
            if (ws.readyState === WebSocket.OPEN && isRecordingRef.current) {
              ws.send(event.data);
            }
          };

          source
            .connect(workletNodeRef.current)
            .connect(audioContextRef.current.destination);

          setConversationState("active");
          addMessage("🎉 Ready! The AI will start the conversation.", "system");

          // Request initial greeting from server
          ws.send(
            JSON.stringify({
              type: "start_conversation",
              scenario: selectedScenario,
            })
          );
        } catch (audioError) {
          console.error("Audio setup failed:", audioError);
          setError(
            "Failed to setup audio. Please check microphone permissions."
          );
          setConversationState("error");
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📨 WebSocket message:", data);

          // Handle audio messages 
          if (
            data.type === "audio" &&
            data.audioUrl &&
            data.label !== "explanation"
          ) {
            console.log("🔊 Playing audio:", data.label, data.audioUrl);
            const audio = new Audio(data.audioUrl);
            audio.play().catch((e) => console.log("Audio play failed:", e));
            return;
          }

          // Handle user transcription
          if (data.transcription && data.transcription.trim()) {
            addMessage(data.transcription, "user");
            setConversationState("processing");
          }

          // Handle AI response
          if (data.correction && data.correction.trim()) {
            addMessage(data.correction, "ai");
            setConversationState("active");
            setIsRecording(false);
          }

          // Handle initial greeting or response
          if (data.type === "response" && data.correction) {
            addMessage(data.correction, "ai");
            setConversationState("active");
            setIsRecording(false);
          } else if (data.type === "greeting" && data.message) {
            addMessage(data.message, "ai");
            setConversationState("active");
          }

          // Re-enable recording after processing
          if (data.type === "done" || data.done === true) {
            setConversationState("active");
            setIsRecording(false);
          }

          if (data.type === "error") {
            setError(data.message || "An error occurred");
            setConversationState("error");
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Connection error. Please check if the server is running.");
        setConversationState("error");
      };

      ws.onclose = () => {
        addMessage("Connection closed", "system");
        setConversationState("setup");
        setIsRecording(false);
      };
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setError("Failed to start conversation. Please try again.");
      setConversationState("error");
    }
  };

  const startRecording = () => {
    if (conversationState !== "active") return;

    setIsRecording(true);
    isRecordingRef.current = true;
    setConversationState("listening");
  };

  const stopRecording = () => {
    setIsRecording(false);
    isRecordingRef.current = false;
    setConversationState("processing");

    // Send end signal to trigger processing
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ end: true }));
    }
  };

  const playMessage = async (messageId: string, text: string) => {
    try {
      setCurrentPlayingId(messageId);

      // Use Web Speech API for TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = learningLanguage;
      utterance.onend = () => setCurrentPlayingId(null);

      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Error playing message:", error);
      setCurrentPlayingId(null);
    }
  };

  const resetConversation = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    cleanupAudio();
    setMessages([]);
    setConversationState("setup");
    setIsRecording(false);
    setCurrentPlayingId(null);
    setError("");
    conversationHistoryRef.current = [];
  };

  const canStart = learningLanguage && selectedScenario;
  const selectedScenarioData = scenarios.find((s) => s.id === selectedScenario);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {conversationState === "setup" && (
            <>
              {/* Language Selection */}
              <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <Languages className="w-5 h-5 text-emerald-600" />
                    <CardTitle className="text-xl">Language Setup</CardTitle>
                  </div>
                  <CardDescription>
                    Choose your learning and native languages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Learning Language
                      </label>
                      <Select
                        value={learningLanguage}
                        onValueChange={setLearningLanguage}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select language to practice" />
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
                        Native Language
                      </label>
                      <Select
                        value={nativeLanguage}
                        onValueChange={setNativeLanguage}
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

                  {learningLanguage && (
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center space-x-2 text-emerald-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Ready to practice{" "}
                          {
                            languages.find((l) => l.code === learningLanguage)
                              ?.name
                          }{" "}
                          conversations
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Scenario Selection */}
              <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">
                    Choose Your Scenario
                  </CardTitle>
                  <CardDescription>
                    Select a real-world situation to practice
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scenarios.map((scenario) => {
                      const IconComponent = scenario.icon;
                      const isSelected = selectedScenario === scenario.id;

                      return (
                        <Card
                          key={scenario.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                            isSelected
                              ? "ring-2 ring-emerald-500 bg-emerald-50 border-emerald-200"
                              : "hover:border-emerald-200"
                          }`}
                          onClick={() => setSelectedScenario(scenario.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between mb-2">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  isSelected
                                    ? "bg-emerald-500 text-white"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <Badge
                                variant={
                                  scenario.difficulty === "Beginner"
                                    ? "secondary"
                                    : scenario.difficulty === "Intermediate"
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {scenario.difficulty}
                              </Badge>
                            </div>
                            <CardTitle className="text-lg">
                              {scenario.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-600">
                              {scenario.description}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {selectedScenarioData && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Scenario Context:
                      </h4>
                      <p className="text-sm text-blue-700">
                        {selectedScenarioData.context}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Start Button */}
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={startConversation}
                  disabled={!canStart}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-6 text-lg"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Start Conversation
                </Button>
                {!canStart && (
                  <p className="text-amber-600 mt-2 flex items-center justify-center space-x-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Please select language and scenario first</span>
                  </p>
                )}
              </div>
            </>
          )}

          {conversationState !== "setup" && conversationState !== "error" && (
            <>
              {/* Conversation Header */}
              <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                        {selectedScenarioData && (
                          <selectedScenarioData.icon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {selectedScenarioData?.title}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {
                            languages.find((l) => l.code === learningLanguage)
                              ?.flag
                          }{" "}
                          {
                            languages.find((l) => l.code === learningLanguage)
                              ?.name
                          }
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetConversation}
                      className="flex items-center space-x-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset</span>
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Conversation Area */}
              <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.type === "user"
                            ? "justify-end"
                            : message.type === "system"
                            ? "justify-center"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                            message.type === "user"
                              ? "bg-emerald-500 text-white rounded-br-sm"
                              : message.type === "system"
                              ? "bg-blue-100 text-blue-800 text-sm"
                              : "bg-gray-100 text-gray-800 rounded-bl-sm"
                          }`}
                        >
                          <div className="flex items-start justify-between space-x-2">
                            <p className="text-sm leading-relaxed">
                              {message.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {conversationState === "connecting" && (
                      <div className="flex justify-center">
                        <div className="flex items-center space-x-2 text-emerald-600">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Connecting...</span>
                        </div>
                      </div>
                    )}

                    {conversationState === "processing" && (
                      <div className="flex justify-start">
                        <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-gray-100 text-gray-800 rounded-bl-sm">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                            <span className="text-sm">AI is responding...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </CardContent>
              </Card>

              {/* Recording Interface */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center space-x-4">
                    {/* Audio Level Visualization */}
                    {isRecording && (
                      <div className="flex items-center space-x-1">
                        {[...Array(10)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-gradient-to-t from-emerald-500 to-green-500 rounded-full transition-all duration-100"
                            style={{
                              height: `${Math.max(
                                4,
                                (audioLevel + Math.random() * 20) * 0.6
                              )}px`,
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Recording Button */}
                    <Button
                      size="lg"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={
                        conversationState === "processing" ||
                        conversationState === "responding" ||
                        conversationState === "connecting"
                      }
                      className={`${
                        isRecording
                          ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                          : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                      } text-white px-8 py-6 text-lg ${
                        isRecording ? "animate-pulse" : ""
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-5 h-5 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5 mr-2" />
                          {conversationState === "listening"
                            ? "Listening..."
                            : "Speak"}
                        </>
                      )}
                    </Button>

                    {/* Status Text */}
                    <div className="text-sm text-gray-600">
                      {conversationState === "active" && "Click to respond"}
                      {conversationState === "listening" && "Listening..."}
                      {conversationState === "processing" &&
                        "Processing your speech..."}
                      {conversationState === "responding" &&
                        "AI is thinking..."}
                      {conversationState === "connecting" && "Setting up..."}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Tips Section */}
          <Card className="mt-8 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>Dialogue Mode Tips</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">
                    Conversation Tips
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Respond naturally and don&apos;t overthink</li>
                    <li>• Ask follow-up questions to keep talking</li>
                    <li>
                      • Use gestures and expressions you&apos;d use in real life
                    </li>
                    <li>• Don&apos;t worry about perfect grammar initially</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">How It Works</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• AI adapts to your language level</li>
                    <li>• Conversations flow naturally based on context</li>
                    <li>• Get corrections and suggestions in real-time</li>
                    <li>• Practice real-world scenarios safely</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
