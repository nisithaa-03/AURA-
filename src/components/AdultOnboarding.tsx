import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Volume2, 
  Keyboard, 
  Accessibility, 
  Eye, 
  Ear, 
  Activity, 
  Cpu, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Sparkle 
} from "lucide-react";
import { CommunicationMode, SupportType, AdaptationSettings } from "../types";

interface AdultOnboardingProps {
  onComplete: (settings: AdaptationSettings) => void;
  onBack: () => void;
  onStepChange?: (step: "communication" | "support") => void;
}

export default function AdultOnboarding({ onComplete, onBack, onStepChange }: AdultOnboardingProps) {
  const [step, setStep] = useState<"communication" | "support">("communication");
  
  // Notify step change
  useEffect(() => {
    if (onStepChange) {
      onStepChange(step);
    }
  }, [step, onStepChange]);
  
  // Selected values
  const [selectedComm, setSelectedComm] = useState<CommunicationMode | null>(null);
  const [selectedSupports, setSelectedSupports] = useState<SupportType[]>([]);

  // Speak prompt on loaded steps
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = step === "communication" 
        ? "How would you like to communicate?" 
        : "What support do you need?";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.02;
      window.speechSynthesis.speak(utterance);
    }
  }, [step]);

  // Listen for hands-free voice commands
  useEffect(() => {
    const handleVoiceCommand = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.action === "select" && detail.option) {
        const option = detail.option.toLowerCase();
        
        if (step === "communication") {
          if (option.includes("voice")) {
            handleCommClick("Voice");
          } else if (option.includes("text")) {
            handleCommClick("Text");
          } else if (option.includes("sign")) {
            handleCommClick("Sign Language");
          } else if (option.includes("next")) {
            setStep("support");
          }
        } else if (step === "support") {
          if (option.includes("back")) {
            setStep("communication");
          } else if (option.includes("vision")) {
            toggleSupport("Vision");
          } else if (option.includes("hearing")) {
            toggleSupport("Hearing");
          } else if (option.includes("speech")) {
            toggleSupport("Speech");
          } else if (option.includes("mobility")) {
            toggleSupport("Mobility");
          } else if (option.includes("cognitive")) {
            toggleSupport("Cognitive");
          } else if (option.includes("multiple")) {
            toggleSupport("Multiple");
          } else if (option.includes("standard") || option.includes("prefer not") || option.includes("none")) {
            toggleSupport("Prefer not to say");
          } else if (option.includes("enter") || option.includes("finish") || option.includes("complete") || option.includes("done") || option.includes("companion")) {
            // Trigger finish handler
            onComplete({
              profile: "Me",
              communication: selectedComm || "Text",
              support: selectedSupports.length > 0 ? selectedSupports : ["none"]
            });
          }
        }
      }
    };
    window.addEventListener("aura-voice-command", handleVoiceCommand);
    return () => {
      window.removeEventListener("aura-voice-command", handleVoiceCommand);
    };
  }, [step, selectedComm, selectedSupports, onComplete]);

  // Handle Communication selection
  const handleCommClick = (mode: CommunicationMode) => {
    setSelectedComm(mode);
    // Auto transition to support selection with a small delay for delightful feedback
    setTimeout(() => {
      setStep("support");
    }, 400);
  };

  // Toggle checklist support selections
  const toggleSupport = (type: SupportType) => {
    let finalArray: SupportType[] = [type];
    
    if (type === "Prefer not to say" || type === "none") {
      finalArray = ["Prefer not to say"];
    } else {
      let next = [...selectedSupports].filter(t => t !== "Prefer not to say" && t !== "none");
      if (!next.includes(type)) {
        next.push(type);
      }
      finalArray = next.length > 0 ? next : ["none"];
    }
    
    setSelectedSupports(finalArray);

    // Provide immediate visual feedback, then automatically proceed to Aura Companion
    setTimeout(() => {
      onComplete({
        profile: "Me",
        communication: selectedComm || "Text",
        support: finalArray
      });
    }, 600);
  };


  // Submit complete settings
  const handleFinish = () => {
    if (!selectedComm) return;
    
    // Default to none if empty
    const finalSupports = selectedSupports.length > 0 ? selectedSupports : ["none"];
    onComplete({
      profile: "Me",
      communication: selectedComm,
      support: finalSupports as SupportType[]
    });
  };

  return (
    <div className="min-h-screen bg-[#FDF8F2] flex flex-col justify-between p-6 text-[#4E3629]">
      
      {/* Top Header */}
      <header className="flex justify-between items-center max-w-xl mx-auto w-full pt-4">
        <button 
          onClick={step === "support" ? () => setStep("communication") : onBack}
          className="flex items-center space-x-1 text-sm bg-white/40 hover:bg-white/80 active:scale-95 px-3 py-1.5 rounded-xl border border-[#EBE1D7] transition-all cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        
        <div className="text-xs font-mono text-[#8C7A6B] uppercase tracking-widest">
          Aura Configuration Wizard
        </div>
      </header>

      {/* Main Form Area with Slide Transitions */}
      <main className="max-w-xl w-full mx-auto my-auto py-8">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: COMMUNICATION SELECTION */}
          {step === "communication" && (
            <motion.div
              key="commStep"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col"
            >
              <div className="text-center sm:text-left mb-8">
                {/* Step indicator */}
                <span className="text-xs font-mono text-[#C28B5E] font-medium tracking-widest uppercase">
                  Step 1 of 2 — Modality
                </span>
                <h1 className="serif text-3xl font-bold tracking-tight mt-1.5 text-[#3A322B]">
                  How would you like to communicate?
                </h1>
                <p className="text-[#8C7A6B] text-sm mt-2 leading-relaxed italic">
                  Aura will prioritize this format toolset across controls and replies.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Voice Mode */}
                <button
                  onClick={() => handleCommClick("Voice")}
                  className={`flex items-center justify-between p-6 rounded-2xl border transition-all cursor-pointer text-left focus:outline-none ${
                    selectedComm === "Voice" 
                      ? "bg-[#D97706]/10 border-[#D97706] ring-2 ring-[#D97706]"
                      : "bg-[#F7EFEA] hover:bg-[#F1E5DA] border-[#EADED2]"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white rounded-xl shadow-xs">
                      <Volume2 className="h-5 w-5 text-[#D97706]" />
                    </div>
                    <div>
                      <h3 className="font-sans font-semibold text-lg">Voice Mode</h3>
                      <p className="text-sm text-[#8C7A6B] font-light">Spoken input & instant vocal speech output.</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#8C7A6B]" />
                </button>

                {/* Text Mode */}
                <button
                  onClick={() => handleCommClick("Text")}
                  className={`flex items-center justify-between p-6 rounded-2xl border transition-all cursor-pointer text-left focus:outline-none ${
                    selectedComm === "Text" 
                      ? "bg-[#D97706]/10 border-[#D97706] ring-2 ring-[#D97706]"
                      : "bg-[#F7EFEA] hover:bg-[#F1E5DA] border-[#EADED2]"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white rounded-xl shadow-xs">
                      <Keyboard className="h-5 w-5 text-[#3B82F6]" />
                    </div>
                    <div>
                      <h3 className="font-sans font-semibold text-lg">Text Mode</h3>
                      <p className="text-sm text-[#8C7A6B] font-light">Type requests & read stylized visual responses.</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#8C7A6B]" />
                </button>

                {/* Sign Language */}
                <button
                  onClick={() => handleCommClick("Sign Language")}
                  className={`flex items-center justify-between p-6 rounded-2xl border transition-all cursor-pointer text-left focus:outline-none ${
                    selectedComm === "Sign Language" 
                      ? "bg-[#D97706]/10 border-[#D97706] ring-2 ring-[#D97706]"
                      : "bg-[#F7EFEA] hover:bg-[#F1E5DA] border-[#EADED2]"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white rounded-xl shadow-xs">
                      <Accessibility className="h-5 w-5 text-[#10B981]" />
                    </div>
                    <div>
                      <h3 className="font-sans font-semibold text-lg">Sign Language / Gestures</h3>
                      <p className="text-sm text-[#8C7A6B] font-light">Webcam hand shapes to voice/text interpreter helper.</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#8C7A6B]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SUPPORT REQUIREMENT SELECTION */}
          {step === "support" && (
            <motion.div
              key="supportStep"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col"
            >
              <div className="text-center sm:text-left mb-6">
                <span className="text-xs font-mono text-[#C28B5E] font-medium tracking-widest uppercase">
                  Step 2 of 2 — Sensory Configuration
                </span>
                <h1 className="serif text-2xl sm:text-3xl font-bold tracking-tight mt-1.5 text-[#3A322B]">
                  What support do you need?
                </h1>
                <p className="text-[#8C7A6B] text-sm mt-1.5 leading-relaxed italic">
                  Select all that apply. Aura transforms its sensory layout dynamically.
                </p>
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                
                {/* Vision Support */}
                <button
                  onClick={() => toggleSupport("Vision")}
                  className={`flex items-center space-x-4 p-4 rounded-xl border transition-all cursor-pointer text-left focus:outline-none ${
                    selectedSupports.includes("Vision")
                      ? "bg-[#818CF8]/10 border-[#818CF8]"
                      : "bg-[#F6EEE7]/80 hover:bg-[#F2E7DC] border-[#E5DAD0]"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedSupports.includes("Vision") ? "bg-[#818CF8] text-white" : "bg-white text-[#818CF8]"}`}>
                    <Eye className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Vision Care</span>
                      {selectedSupports.includes("Vision") && <Check className="h-4 w-4 text-[#818CF8]" />}
                    </div>
                    <span className="text-xs text-[#8C7A6B] font-light">Bold controls, audio readings</span>
                  </div>
                </button>

                {/* Hearing Support */}
                <button
                  onClick={() => toggleSupport("Hearing")}
                  className={`flex items-center space-x-4 p-4 rounded-xl border transition-all cursor-pointer text-left focus:outline-none ${
                    selectedSupports.includes("Hearing")
                      ? "bg-[#3B82F6]/10 border-[#3B82F6]"
                      : "bg-[#F6EEE7]/80 hover:bg-[#F2E7DC] border-[#E5DAD0]"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedSupports.includes("Hearing") ? "bg-[#3B82F6] text-white" : "bg-white text-[#3B82F6]"}`}>
                    <Ear className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Hearing Support</span>
                      {selectedSupports.includes("Hearing") && <Check className="h-4 w-4 text-[#3B82F6]" />}
                    </div>
                    <span className="text-xs text-[#8C7A6B] font-light">Interactive text prompts & captions</span>
                  </div>
                </button>

                {/* Mobilty Support */}
                <button
                  onClick={() => toggleSupport("Mobility")}
                  className={`flex items-center space-x-4 p-4 rounded-xl border transition-all cursor-pointer text-left focus:outline-none ${
                    selectedSupports.includes("Mobility")
                      ? "bg-[#ED64A6]/10 border-[#ED64A6]"
                      : "bg-[#F6EEE7]/80 hover:bg-[#F2E7DC] border-[#E5DAD0]"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedSupports.includes("Mobility") ? "bg-[#ED64A6] text-white" : "bg-white text-[#ED64A6]"}`}>
                    <Activity className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Mobility & Motor</span>
                      {selectedSupports.includes("Mobility") && <Check className="h-4 w-4 text-[#ED64A6]" />}
                    </div>
                    <span className="text-xs text-[#8C7A6B] font-light">Light touch points, audio triggers</span>
                  </div>
                </button>

                {/* Cognitive Support */}
                <button
                  onClick={() => toggleSupport("Cognitive")}
                  className={`flex items-center space-x-4 p-4 rounded-xl border transition-all cursor-pointer text-left focus:outline-none ${
                    selectedSupports.includes("Cognitive")
                      ? "bg-[#10B981]/10 border-[#10B981]"
                      : "bg-[#F6EEE7]/80 hover:bg-[#F2E7DC] border-[#E5DAD0]"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedSupports.includes("Cognitive") ? "bg-[#10B981] text-white" : "bg-white text-[#10B981]"}`}>
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Cognitive Simplicity</span>
                      {selectedSupports.includes("Cognitive") && <Check className="h-4 w-4 text-[#10B981]" />}
                    </div>
                    <span className="text-xs text-[#8C7A6B] font-light">Direct vocabulary & plain lists</span>
                  </div>
                </button>

                {/* Speech Support */}
                <button
                  onClick={() => toggleSupport("Speech")}
                  className={`flex items-center space-x-4 p-4 rounded-xl border transition-all cursor-pointer text-left focus:outline-none ${
                    selectedSupports.includes("Speech")
                      ? "bg-[#F59E0B]/10 border-[#F59E0B]"
                      : "bg-[#F6EEE7]/80 hover:bg-[#F2E7DC] border-[#E5DAD0]"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedSupports.includes("Speech") ? "bg-[#F59E0B] text-white" : "bg-white text-[#F59E0B]"}`}>
                    <Volume2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Speech Assistant</span>
                      {selectedSupports.includes("Speech") && <Check className="h-4 w-4 text-[#F59E0B]" />}
                    </div>
                    <span className="text-xs text-[#8C7A6B] font-light">Assist typing readouts & indicators</span>
                  </div>
                </button>

                {/* Prefer not to say / None */}
                <button
                  onClick={() => toggleSupport("Prefer not to say")}
                  className={`flex items-center space-x-4 p-4 rounded-xl border transition-all cursor-pointer text-left focus:outline-none ${
                    selectedSupports.includes("Prefer not to say")
                      ? "bg-[#6B7280]/10 border-[#6B7280]"
                      : "bg-[#F6EEE7]/80 hover:bg-[#F2E7DC] border-[#E5DAD0]"
                  }`}
                >
                  <div id="pnts-icon-bg" className={`p-2 rounded-lg ${selectedSupports.includes("Prefer not to say") ? "bg-[#6B7280] text-white" : "bg-white text-[#6B7280]"}`}>
                    <Sparkle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Standard / Normal</span>
                      {selectedSupports.includes("Prefer not to say") && <Check className="h-4 w-4 text-[#6B7280]" />}
                    </div>
                    <span className="text-xs text-[#8C7A6B] font-light">Balanced, classic UI experience</span>
                  </div>
                </button>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Button Controls Footer */}
      <footer className="max-w-xl w-full mx-auto pb-4 flex justify-between items-center bg-transparent">
        {step === "support" ? (
          <>
            <button 
              onClick={() => setStep("communication")}
              className="px-5 py-2.5 rounded-xl text-[#8C7A6B] text-sm hover:bg-[#F2E7DC] cursor-pointer"
            >
              Back to Modality
            </button>
            <motion.button 
              id="onboarding-finalize-btn"
              onClick={handleFinish}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2 px-6 py-3 bg-[#4E3629] text-white font-sans font-medium rounded-2xl shadow-lg shadow-amber-950/10 hover:bg-[#3D291F] transition-all cursor-pointer"
            >
              <span>Enter Aura Companion</span>
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </>
        ) : (
          <div className="w-full flex justify-end">
            <button 
              onClick={() => setStep("support")}
              className="px-5 py-2.5 rounded-xl text-[#8C7A6B] text-sm hover:bg-[#F2E7DC] border border-[#E9DFD5] flex items-center space-x-1 cursor-pointer"
            >
              <span>Next Step</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </footer>

    </div>
  );
}
