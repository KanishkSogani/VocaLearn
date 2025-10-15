"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  Volume2,
  ArrowRight,
  Play,
  Brain,
  Target,
  Sparkles,
  AudioWaveform as Waveform,
} from "lucide-react";

interface HeroSectionProps {
  isMounted: boolean;
  isVisible: boolean;
}

export default function HeroSection({
  isMounted,
  isVisible,
}: HeroSectionProps) {
  const router = useRouter();

  const handleStartLearning = () => {
    router.push("/voice-practice");
  };
  return (
    <section
      id="hero"
      className={`pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 transition-all duration-1000 ${
        isMounted && isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left">
            <Badge className="mb-6 bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200 transition-colors">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Language Learning
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Master Languages Naturally with
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent block mt-2">
                AI Voice Feedback
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Experience the future of language learning with VocaLearn. Speak
              naturally, get instant AI-powered corrections, and improve your
              fluency through real-time voice conversations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-12">
              <Button
                size="lg"
                onClick={handleStartLearning}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-6 text-lg"
              >
                Start Learning Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-6 text-lg group"
              >
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>

            <div className="flex gap-8 mt-6 lg:justify-start justify-center">
              <div className="text-left">
                <div className="text-3xl font-bold text-gray-900">9+</div>
                <div className="text-gray-600 text-sm">Languages</div>
              </div>
              <div className="text-left">
                <div className="text-3xl font-bold text-gray-900">98%</div>
                <div className="text-gray-600 text-sm">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Hero Visual - AI Voice Learning Concept */}
          <div className="relative">
            <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
              {/* Main Image */}
              <div className="relative mb-6">
                <Image
                  src="https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80"
                  alt="Person learning and communicating on laptop for AI-powered language learning"
                  className="rounded-2xl w-full h-64 object-cover"
                  width={800}
                  height={256}
                />

                {/* Floating Voice Indicators */}
                <div className="absolute -top-4 -left-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300">
                  <Mic className="w-6 h-6" />
                </div>

                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white p-3 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300">
                  <Volume2 className="w-6 h-6" />
                </div>
              </div>

              {/* AI Conversation Simulation */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Mic className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-indigo-50 rounded-2xl rounded-tl-sm p-4 flex-1">
                    <p className="text-gray-800 font-medium">
                      &ldquo;Bonjour, comment allez-vous?&rdquo;
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <Waveform className="w-4 h-4 text-indigo-500 opacity-75" />
                      <span className="text-xs text-indigo-600">
                        Analyzing pronunciation...
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-emerald-50 rounded-2xl rounded-tl-sm p-4 flex-1">
                    <p className="text-gray-800 font-medium">
                      Perfect pronunciation! ✨
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      &ldquo;Great job with the French greeting. Try: &lsquo;Je
                      vais bien, merci!&rsquo;&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Learning Indicators */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Live AI Feedback
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm text-gray-600">98% Accuracy</span>
                </div>
              </div>
            </div>

            {/* Background Decorative Elements */}
            <div className="absolute -top-6 -right-6 w-full h-full bg-gradient-to-br from-indigo-200 to-purple-200 rounded-3xl -z-10 opacity-50"></div>
            <div className="absolute -bottom-6 -left-6 w-full h-full bg-gradient-to-tr from-purple-100 to-indigo-100 rounded-3xl -z-20 opacity-30"></div>

            {/* Floating Elements */}
            <div className="absolute top-10 -left-8 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-10 blur-sm"></div>
            <div className="absolute bottom-20 -right-8 w-12 h-12 bg-gradient-to-br from-pink-400 to-red-500 rounded-full opacity-10 blur-sm"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
