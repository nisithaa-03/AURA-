import { useEffect } from "react";
import { motion } from "motion/react";
import { User, Sparkles } from "lucide-react";
import { ProfileType } from "../types";

interface ProfileSelectionProps {
  onSelect: (profile: ProfileType) => void;
}

export default function ProfileSelection({ onSelect }: ProfileSelectionProps) {

  // Play introductory speech for profile selection screen
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("Who will I be helping today?");
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Listen for hands-free voice commands
  useEffect(() => {
    const handleVoiceCommand = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.action === "select" && detail.option) {
        const option = detail.option.toLowerCase();
        if (option === "me" || option.includes("adult")) {
          onSelect("Me");
        } else if (option === "a child" || option.includes("child") || option.includes("kid") || option === "child") {
          onSelect("A Child");
        }
      }
    };
    window.addEventListener("aura-voice-command", handleVoiceCommand);
    return () => {
      window.removeEventListener("aura-voice-command", handleVoiceCommand);
    };
  }, [onSelect]);

  return (
    <div className="min-h-screen bg-[#FDF8F2] flex flex-col justify-center items-center p-6 text-[#4E3629]">
      <div className="max-w-xl w-full text-center">
        {/* Progress bar indication */}
        <div className="mb-10 flex justify-center space-x-1.5">
          <span className="w-8 h-1 rounded-full bg-[#E5AA70]" />
          <span className="w-2 h-1 rounded-full bg-[#E4D5C9]" />
          <span className="w-2 h-1 rounded-full bg-[#E4D5C9]" />
        </div>

        {/* Dynamic Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <h2 className="serif text-4xl font-bold tracking-tight text-[#3A322B]">
            Who will I be helping today?
          </h2>
          <p className="text-[#8C7A6B] mt-3 font-normal italic opacity-85">
            Each option unlocks a completely different personalized experience.
          </p>
        </motion.div>

        {/* Profile Choice Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
          
          {/* Default Option 1: "Me" (Calm Apple aesthetic) */}
          <motion.button
            id="profile-option-adult"
            onClick={() => onSelect("Me")}
            className="group relative bg-[#F6EFEA] hover:bg-[#F2E7DC] active:scale-98 text-left p-8 rounded-3xl border border-[#E9DFD5] transition-all flex flex-col justify-between h-64 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C28B5E]"
            whileHover={{ y: -4, shadow: "0 10px 25px -5px rgba(78, 54, 41, 0.05)" }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-start w-full">
              <div id="adult-icon-bg" className="p-4 bg-white/60 group-hover:bg-white rounded-2xl transition-colors">
                <User className="h-6 w-6 text-[#9A7D6B] group-hover:text-[#4E3629]" />
              </div>
              <span className="text-xs font-mono tracking-wider text-[#A29182] uppercase bg-white/40 px-2.5 py-1 rounded-full">
                Calm & Minimal
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-sans font-semibold text-[#4E3629]">
                Me
              </h3>
              <p className="text-[#8C7A6B] text-sm mt-1.5 font-light leading-relaxed">
                Adaptive sensory controls, assistive cameras, caption tools, and government portal guides.
              </p>
            </div>
          </motion.button>

          {/* Option 2: "A Child" (Playful Pastel Magic aesthetic) */}
          <motion.button
            id="profile-option-child"
            onClick={() => onSelect("A Child")}
            className="group relative bg-[#FAF3F0] hover:bg-[#FCECEE] active:scale-98 text-left p-8 rounded-3xl border border-[#FAEDEC] transition-all flex flex-col justify-between h-64 overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#EC4899]"
            whileHover={{ y: -4, shadow: "0 10px 25px -5px rgba(236, 72, 153, 0.08)" }}
            transition={{ duration: 0.2 }}
          >
            {/* Playful background decorative bubble */}
            <span className="absolute -top-12 -right-12 w-32 h-32 bg-pink-200/20 rounded-full filter blur-xl group-hover:bg-pink-300/30 transition-all duration-500" />

            <div className="flex justify-between items-start w-full">
              <div id="child-icon-bg" className="p-4 bg-white/80 group-hover:bg-white rounded-2xl transition-colors shadow-sm shadow-pink-100">
                <Sparkles className="h-6 w-6 text-pink-400 group-hover:text-pink-500" />
              </div>
              <span className="text-xs font-mono tracking-wider text-pink-500/80 uppercase bg-[#FDE8EC] px-2.5 py-1 rounded-full">
                Playful & Learning
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-sans font-semibold text-[#5B2C3E] group-hover:text-pink-900 transition-colors">
                A Child
              </h3>
              <p className="text-[#826975] text-sm mt-1.5 font-light leading-relaxed">
                Imaginative stories, curious answers, fun educational questions, games, and playful camera explorations.
              </p>
            </div>
          </motion.button>

        </div>
      </div>
    </div>
  );
}
