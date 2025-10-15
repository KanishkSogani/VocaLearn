"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mic, Menu, X } from "lucide-react";

interface NavigationProps {
  isMenuOpen?: boolean;
  setIsMenuOpen?: (isOpen: boolean) => void;
  isMounted?: boolean;
  isVisible?: boolean;
  scrollToSection?: (sectionId: string) => void;
  isVoicePracticePage?: boolean;
}

export default function Navigation({
  isMenuOpen = false,
  setIsMenuOpen,
  isMounted = true,
  isVisible = true,
  scrollToSection,
  isVoicePracticePage = false,
}: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const handleGetStarted = () => {
    router.push("/voice-practice");
  };

  const handleModeNavigation = (mode: string) => {
    router.push(`/${mode}`);
  };

  const handleLogoClick = () => {
    router.push("/");
  };
  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isMounted && isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={handleLogoClick}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                VocaLearn
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {isHomePage ? (
                <>
                  <button
                    onClick={() => scrollToSection?.("hero")}
                    className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
                  >
                    Home
                  </button>
                  <button
                    onClick={() => scrollToSection?.("how-it-works")}
                    className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
                  >
                    How it Works
                  </button>
                  <button
                    onClick={() => scrollToSection?.("features")}
                    className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
                  >
                    Features
                  </button>
                  <Button
                    onClick={handleGetStarted}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6"
                  >
                    Get Started
                  </Button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleModeNavigation("echo")}
                    className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
                  >
                    Echo Mode
                  </button>
                  <button
                    onClick={() => handleModeNavigation("dialogue")}
                    className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
                  >
                    Dialogue Mode
                  </button>
                  <button
                    onClick={() => handleModeNavigation("quiz")}
                    className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
                  >
                    Quiz Mode
                  </button>
                  <Button
                    onClick={handleLogoClick}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6"
                  >
                    Back to Home
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-gray-700 p-2"
              onClick={() => setIsMenuOpen?.(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-lg">
          <div className="px-4 py-6 space-y-4">
            {isHomePage ? (
              <>
                <button
                  onClick={() => scrollToSection?.("hero")}
                  className="block w-full text-left text-gray-700 hover:text-indigo-600 transition-colors py-2 font-medium"
                >
                  Home
                </button>
                <button
                  onClick={() => scrollToSection?.("how-it-works")}
                  className="block w-full text-left text-gray-700 hover:text-indigo-600 transition-colors py-2 font-medium"
                >
                  How it Works
                </button>
                <button
                  onClick={() => scrollToSection?.("features")}
                  className="block w-full text-left text-gray-700 hover:text-indigo-600 transition-colors py-2 font-medium"
                >
                  Features
                </button>
                <Button
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                >
                  Get Started
                </Button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleModeNavigation("echo")}
                  className="block w-full text-left text-gray-700 hover:text-indigo-600 transition-colors py-2 font-medium"
                >
                  Echo Mode
                </button>
                <button
                  onClick={() => handleModeNavigation("dialogue")}
                  className="block w-full text-left text-gray-700 hover:text-indigo-600 transition-colors py-2 font-medium"
                >
                  Dialogue Mode
                </button>
                <button
                  onClick={() => handleModeNavigation("quiz")}
                  className="block w-full text-left text-gray-700 hover:text-indigo-600 transition-colors py-2 font-medium"
                >
                  Quiz Mode
                </button>
                <Button
                  onClick={handleLogoClick}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Back to Home
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
