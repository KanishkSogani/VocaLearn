"use client";

export default function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 flex justify-center items-center">
      <div className="max-w-7xl w-full mx-auto">
        <div className="rounded-2xl shadow-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-10 flex flex-col items-center text-center relative">
          <h2 className="text-3xl font-bold text-white mb-6">
            Powered by Groq, Murf AI & Advanced Speech Recognition
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Experience the most advanced language learning technology available.
            Our AI understands context, emotion, and cultural nuances to provide
            feedback that&apos;s more accurate than human tutors.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-2 justify-center">
            <span className="px-8 py-3 rounded-full bg-white/20 text-white font-semibold text-base shadow-sm backdrop-blur-sm">
              99.2% Accuracy
            </span>
            <span className="px-8 py-3 rounded-full bg-white/20 text-white font-semibold text-base shadow-sm backdrop-blur-sm">
              1s Response Time
            </span>
            <span className="px-8 py-3 rounded-full bg-white/20 text-white font-semibold text-base shadow-sm backdrop-blur-sm">
              24/7 Available
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
