import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import AuraOrb from "./AuraOrb";
import { applyAuraVoiceConfigs } from "../lib/voice";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [step, setStep] = useState(0);
  const [orbStatus, setOrbStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");

  useEffect(() => {
    // Phase 1: Intro "Hello, I'm Aura."
    const speakText = (text: string) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        applyAuraVoiceConfigs(utterance);

        utterance.onstart = () => setOrbStatus("speaking");
        utterance.onend = () => setOrbStatus("idle");
        utterance.onerror = () => setOrbStatus("idle");
        window.speechSynthesis.speak(utterance);
      }
    };

    // Step 0: Warm up
    const t0 = setTimeout(() => {
      setStep(1);
      speakText("Hello, I'm Aura.");
    }, 1200);

    // Step 1: Speak second line
    const t1 = setTimeout(() => {
      setStep(2);
      speakText("I'll adapt to you.");
    }, 4500);

    // Step 2: Fade out & finish
    const t2 = setTimeout(() => {
      setStep(3);
    }, 7500);

    const t3 = setTimeout(() => {
      onComplete();
    }, 8400);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#FDF8F2] flex flex-col items-center justify-center p-6 z-50 overflow-hidden">
      <div id="splash-layout" className="flex flex-col items-center justify-center max-w-md w-full text-center">
        {/* Central Pulse Orb Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="mb-12"
        >
          <AuraOrb status={orbStatus} size={180} />
        </motion.div>

        {/* Dynamic Typography Transition */}
        <div id="splash-typography-container" className="h-28 relative flex items-center justify-center w-full">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="text-1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute flex flex-col items-center"
              >
                <h1 className="serif text-5xl font-bold tracking-tight text-[#3A322B] leading-tight">
                  Hello, I'm Aura.
                </h1>
                <p className="text-[#8C7A6B] text-sm uppercase mt-4 tracking-widest opacity-80">
                  Universal accessibility companion
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="text-2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute flex flex-col items-center"
              >
                <h1 className="serif text-5xl font-bold tracking-tight text-[#3A322B] leading-tight max-w-sm">
                  I'll adapt to you.
                </h1>
                <p className="text-[#4A3F35] text-base mt-4 font-normal max-w-xs opacity-70 italic">
                  Tailoring every word, visual, and interaction
                </p>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="text-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="absolute text-sm font-mono text-[#8C7A6B] uppercase tracking-widest"
              >
                Initializing Aura Engine...
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
