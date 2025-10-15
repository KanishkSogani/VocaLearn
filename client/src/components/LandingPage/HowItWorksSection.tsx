"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mic, Brain, Volume2 } from "lucide-react";

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
      data-animate
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How VocaLearn Works
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Three simple steps to transform your language learning experience
            with Murf AI-powered voice technology
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <Card className="relative text-left px-4 py-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-indigo-50 via-white to-purple-50 group rounded-xl min-h-[260px] flex flex-col items-start justify-between">
            {/* Step number */}
            <span className="absolute top-3 right-4 text-[44px] font-bold text-gray-200 opacity-15 select-none pointer-events-none z-0 leading-none">
              01
            </span>
            <CardHeader className="pb-2 z-10 relative flex flex-col items-start">
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-300 shadow">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-gray-900 mb-1 tracking-tight">
                Speak Naturally
              </CardTitle>
            </CardHeader>
            <CardContent className="z-10 relative flex-1 flex flex-col justify-center">
              <CardDescription className="text-base sm:text text-gray-600 leading-snug">
                Just start speaking in your target language. Our advanced speech
                recognition captures every word, tone, and nuance of your
                pronunciation.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card className="relative text-left px-4 py-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-blue-50 via-white to-cyan-50 group rounded-xl min-h-[260px] flex flex-col items-start justify-between">
            <span className="absolute top-3 right-4 text-[44px] font-bold text-gray-200 opacity-15 select-none pointer-events-none z-0 leading-none">
              02
            </span>
            <CardHeader className="pb-2 z-10 relative flex flex-col items-start">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-300 shadow">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-gray-900 mb-1 tracking-tight">
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="z-10 relative flex-1 flex flex-col justify-center">
              <CardDescription className="text-base sm:text text-gray-600 leading-snug">
                Groq instantly analyzes your speech for grammar,
                pronunciation, and fluency. Get personalized corrections and
                suggestions in real-time.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card className="relative text-left px-4 py-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-emerald-50 via-white to-green-50 group rounded-xl min-h-[260px] flex flex-col items-start justify-between">
            <span className="absolute top-3 right-4 text-[44px] font-bold text-gray-200 opacity-15 select-none pointer-events-none z-0 leading-none">
              03
            </span>
            <CardHeader className="pb-2 z-10 relative flex flex-col items-start">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-300 shadow">
                <Volume2 className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-gray-900 mb-1 tracking-tight">
                Interactive Response
              </CardTitle>
            </CardHeader>
            <CardContent className="z-10 relative flex-1 flex flex-col justify-center">
              <CardDescription className="text-base sm:text text-gray-600 leading-snug">
                Receive natural voice responses powered by Murf API that help
                you practice conversation flow. It&apos;s like having a native
                speaker as your personal tutor.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
