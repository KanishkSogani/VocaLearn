"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/LandingPage/Navigation";
import HeroSection from "@/components/LandingPage/HeroSection";
import HowItWorksSection from "@/components/LandingPage/HowItWorksSection";
import FeaturesSection from "@/components/LandingPage/FeaturesSection";
import CTASection from "@/components/LandingPage/CTASection";
import Footer from "@/components/LandingPage/Footer";
import LoadingScreen from "@/components/LandingPage/LoadingScreen";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    const handleScroll = () => {
      if (typeof window === "undefined") return;

      const sections = document.querySelectorAll("[data-animate]");
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight * 0.75;
        if (isInView) {
          section.classList.add("animate-in");
        }
      });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll);

      const initialCheckTimer = setTimeout(() => {
        handleScroll();
      }, 200);

      return () => {
        window.removeEventListener("scroll", handleScroll);
        clearTimeout(timer);
        clearTimeout(initialCheckTimer);
      };
    }

    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (isMounted && isVisible) {
      const triggerAnimations = () => {
        const sections = document.querySelectorAll("[data-animate]");

        sections.forEach((section) => {
          const rect = section.getBoundingClientRect();
          const isInView = rect.top < window.innerHeight * 0.75;

          if (isInView) {
            section.classList.add("animate-in");
          }
        });
      };

      const animationTimer = setTimeout(triggerAnimations, 300);

      return () => clearTimeout(animationTimer);
    }
  }, [isMounted, isVisible]);

  const scrollToSection = (sectionId: string) => {
    if (typeof window === "undefined") return;

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <LoadingScreen isMounted={isMounted} />

      {isMounted && (
        <>
          <Navigation
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
            isMounted={isMounted}
            isVisible={isVisible}
            scrollToSection={scrollToSection}
          />

          <HeroSection isMounted={isMounted} isVisible={isVisible} />
          <HowItWorksSection />
          <FeaturesSection />
          <CTASection />
          <Footer />
        </>
      )}
    </div>
  );
}
