"use client";

import { Mic } from "lucide-react";

interface LoadingScreenProps {
  isMounted: boolean;
}

export default function LoadingScreen({ isMounted }: LoadingScreenProps) {
  if (isMounted) return null;

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 w-full z-50 opacity-0 -translate-y-4">
        <div className="bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto pl-4 pr-4 sm:pl-6 sm:pr-6 lg:pl-8 lg:pr-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  VocaLearn
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 opacity-0 translate-y-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="mb-6 h-8 bg-indigo-100 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-100 rounded animate-pulse mb-6"></div>
              <div className="h-20 bg-gray-100 rounded animate-pulse mb-8"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
