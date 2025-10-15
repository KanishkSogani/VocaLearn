"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Target, MessageSquare, Globe, Headphones } from "lucide-react";

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
      data-animate
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Faster Learning
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Advanced AI technology meets intuitive design to create the ultimate
            language learning experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Feature 1 */}
          <Card className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-start">
            <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-yellow-500 mb-6">
              <Target className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-lg font-bold text-gray-900 mb-2 text-left">
              Real-time Corrections
            </CardTitle>
            <CardDescription className="text-base sm:text-lg text-gray-600 text-left">
              Get instant feedback on pronunciation, grammar, and vocabulary as
              you speak with contextual explanations.
            </CardDescription>
          </Card>

          {/* Feature 2 */}
          <Card className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-start">
            <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-purple-400 mb-6">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-lg font-bold text-gray-900 mb-2 text-left">
              Natural Conversations
            </CardTitle>
            <CardDescription className="text-base sm:text-lg text-gray-600 text-left">
              Practice with AI that responds naturally and keeps conversations
              flowing like a native speaker.
            </CardDescription>
          </Card>

          {/* Feature 3 */}
          <Card className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-start">
            <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-blue-400 mb-6">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-lg font-bold text-gray-900 mb-2 text-left">
              9 Languages
            </CardTitle>
            <CardDescription className="text-base sm:text-lg text-gray-600 text-left">
              Learn any language with our comprehensive multilingual AI system
              and cultural context.
            </CardDescription>
          </Card>

          {/* Feature 4 */}
          <Card className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-start">
            <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-400 mb-6">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-lg font-bold text-gray-900 mb-2 text-left">
              Perfect Audio
            </CardTitle>
            <CardDescription className="text-base sm:text-lg text-gray-600 text-left">
              Crystal-clear, natural-sounding voice responses powered by Murf AI
              for advanced text-to-speech technology.
            </CardDescription>
          </Card>
        </div>
      </div>
    </section>
  );
}
