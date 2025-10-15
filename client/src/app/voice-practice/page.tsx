"use client";

import { useRouter } from "next/navigation";
import Navigation from "@/components/LandingPage/Navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MessageCircle,
  ArrowRight,
  Volume2,
  BookOpen,
} from "lucide-react";

export default function VoicePractice() {
  const router = useRouter();

  const modes = [
    {
      id: "echo",
      title: "Echo Mode",
      description: "Perfect your pronunciation with AI feedback",
      longDescription:
        "Speak in your target language and get instant feedback on pronunciation, intonation, and clarity. The AI will repeat back with correct pronunciation.",
      icon: Mic,
      color: "from-purple-600 to-blue-600",
      hoverColor: "from-purple-700 to-blue-700",
      features: [
        "Real-time pronunciation feedback",
        "Audio playback comparison",
        "Progress tracking",
      ],
      route: "/echo",
    },
    {
      id: "dialogue",
      title: "Dialogue Mode",
      description: "Practice conversations with AI companion",
      longDescription:
        "Engage in realistic conversations with our AI tutor. Practice real-world scenarios and improve your conversational skills through natural dialogue interactions.",
      icon: MessageCircle,
      color: "from-green-600 to-teal-600",
      hoverColor: "from-green-700 to-teal-700",
      features: [
        "Interactive conversations",
        "Context-aware responses",
        "Scenario-based practice",
      ],
      route: "/dialogue",
    },
    {
      id: "quiz",
      title: "Quiz Mode",
      description: "Test your skills with interactive voice quizzes",
      longDescription:
        "Challenge yourself with customizable quizzes. Answer questions in your target language and receive detailed AI feedback on your responses.",
      icon: BookOpen,
      color: "from-orange-500 to-red-500",
      hoverColor: "from-orange-600 to-red-600",
      features: [
        "Customizable question count",
        "Translation & scenario questions",
        "Detailed performance feedback",
      ],
      route: "/quiz",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navigation />

      <div className="container mx-auto px-4 pt-32 pb-12">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 leading-[1.1] pb-2 align-bottom">
            Choose Your Learning Mode
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Select the perfect practice mode for your language learning journey.
            Each mode is designed to target specific skills and accelerate your
            progress.
          </p>
        </div>

        {/* Mode Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
          {modes.map((mode) => {
            const IconComponent = mode.icon;
            return (
              <Card
                key={mode.id}
                className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm"
                onClick={() => router.push(mode.route)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-4 rounded-2xl bg-gradient-to-r ${mode.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent size={32} />
                    </div>
                    <ArrowRight
                      className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300"
                      size={24}
                    />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-800 group-hover:text-gray-900">
                    {mode.title}
                  </CardTitle>
                  <CardDescription className="text-[16px] text-gray-600">
                    {mode.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <p className="text-gray-700 text-[16px]">
                    {mode.longDescription}
                  </p>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      <Volume2 size={16} className="mr-2" />
                      Key Features
                    </h4>
                    <ul className="space-y-2">
                      {mode.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center text-gray-600"
                        >
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mr-3"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className={`w-full mt-6 bg-gradient-to-r ${mode.color} hover:bg-gradient-to-r hover:${mode.hoverColor} text-white py-3 rounded-xl font-semibold text-lg transition-all duration-300 transform group-hover:scale-105 shadow-lg`}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(mode.route);
                    }}
                  >
                    Start {mode.title}
                    <ArrowRight className="ml-2" size={20} />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
