import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, X, CornerDownLeft, Volume2, HelpCircle, Check, Info } from "lucide-react";
import { applyAuraVoiceConfigs } from "../lib/voice";

interface VoiceNavigatorProps {
  currentScreen: string;
  options: string[];
}

export default function VoiceNavigator({ currentScreen, options }: VoiceNavigatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [simulationInput, setSimulationInput] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" | null }>({
    text: "Aura Continuous Hands-Free is active. Speak commands or options anytime without clicking!",
    type: "info"
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isListeningEnabledRef = useRef<boolean>(true);
  const isProcessingRef = useRef<boolean>(false);
  const activeScreenRef = useRef<string>(currentScreen);
  const activeOptionsRef = useRef<string[]>(options);

  // Sync refs to make sure closures always run with fresh data
  useEffect(() => {
    activeScreenRef.current = currentScreen;
    activeOptionsRef.current = options;
  }, [currentScreen, options]);

  const setProcessingSync = (val: boolean) => {
    setIsProcessing(val);
    isProcessingRef.current = val;
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    // Check if TTS is currently replicating audio (or speaking synthesized voice)
    const isAuraSpeaking = (window as any).isAuraSpeaking || (window.speechSynthesis && window.speechSynthesis.speaking);
    if (isAuraSpeaking || isProcessingRef.current) {
      // Retry in 1.2s to let audio finish
      setTimeout(startListening, 1200);
      return;
    }
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Already listening or starting, safe to ignore
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  // Custom speak confirmer that overrides mic listening temporarily
  const speakTTSConfirm = (text: string) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        applyAuraVoiceConfigs(utterance);

        utterance.onstart = () => {
          isListeningEnabledRef.current = false;
          (window as any).isAuraSpeaking = true;
          stopListening();
        };

        const handleSpeechEnd = () => {
          (window as any).isAuraSpeaking = false;
          isListeningEnabledRef.current = true;
          setTimeout(() => {
            if (isListeningEnabledRef.current) {
              startListening();
            }
          }, 800);
        };

        utterance.onend = handleSpeechEnd;
        utterance.onerror = handleSpeechEnd;

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("speechSynthesis confirm error:", err);
        isListeningEnabledRef.current = true;
        (window as any).isAuraSpeaking = false;
        startListening();
      }
    } else {
      startListening();
    }
  };

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setStatusMessage({ text: "Aura is listening for your command...", type: "info" });
      };

      rec.onresult = (e: any) => {
        const resultText = e.results[0][0].transcript;
        setTranscript(resultText);
        setStatusMessage({ text: `Captured speech: "${resultText}"`, type: "success" });
        submitVoiceInput(resultText);
      };

      rec.onerror = (e: any) => {
        // Certain issues like no-speech are fine and harmless (triggered when user stays quiet)
        if (e.error === "no-speech") {
          return; // Let onend handle automatic silent restart
        }
        
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
        
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          isListeningEnabledRef.current = false;
          setStatusMessage({ 
            text: "Microphone permission is required for Aura Continuous Hands-Free. Tap the microphone once or grant browser permissions to enable!", 
            type: "error" 
          });
        }
      };

      rec.onend = () => {
        setIsListening(false);
        // Automatically restart speech recognition for continuous active experience!
        if (isListeningEnabledRef.current && !isProcessingRef.current) {
          setTimeout(() => {
            const isAuraSpeaking = (window as any).isAuraSpeaking || (window.speechSynthesis && window.speechSynthesis.speaking);
            if (isListeningEnabledRef.current && !isProcessingRef.current && !isAuraSpeaking) {
              startListening();
            } else {
              // Re-check shortly
              setTimeout(startListening, 1000);
            }
          }, 400); // 400ms breather window
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Trigger hands-free listening automatically on mount
  useEffect(() => {
    isListeningEnabledRef.current = true;
    
    // Brief load delay before activation
    const timer = setTimeout(() => {
      if (isListeningEnabledRef.current) {
        startListening();
      }
    }, 1500);

    return () => {
      clearTimeout(timer);
      isListeningEnabledRef.current = false;
      stopListening();
    };
  }, []);

  // Restart clean listening session immediately on screen or available options change
  useEffect(() => {
    if (isListeningEnabledRef.current) {
      stopListening();
      
      const timer = setTimeout(() => {
        if (isListeningEnabledRef.current) {
          startListening();
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, options]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      setStatusMessage({ 
        text: "Web Speech API is not supported in this frame or browser. Please use the simulated input box below to test vocal actions!", 
        type: "error" 
      });
      return;
    }

    if (isListening) {
      isListeningEnabledRef.current = false;
      stopListening();
      setStatusMessage({ text: "Aura Hands-Free is temporarily paused. Tap to re-activate.", type: "info" });
    } else {
      isListeningEnabledRef.current = true;
      setTranscript("");
      startListening();
    }
  };

  const submitVoiceInput = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    // FAST PATH: Instantaneous client-side match detection (skips LLM roundtrip for speed)
    const normalizedInput = spokenText.toLowerCase().replace(/[.,!?'"]/g, "").trim();
    let instantMatch: string | null = null;
    
    // Check against exact options or standard known synonyms
    const optionMatches = activeOptionsRef.current.map(o => ({ original: o, normalized: o.toLowerCase() }));
    
    const exactHit = optionMatches.find(o => o.normalized === normalizedInput || normalizedInput.includes(o.normalized));
    if (exactHit) {
      instantMatch = exactHit.original;
    } else if (normalizedInput === "me" || normalizedInput === "myself" || normalizedInput === "for me") {
      const match = optionMatches.find(o => o.normalized === "me");
      if (match) instantMatch = match.original;
    } else if (normalizedInput === "child" || normalizedInput === "a child" || normalizedInput === "kid") {
      const match = optionMatches.find(o => o.normalized === "a child" || o.normalized === "child");
      if (match) instantMatch = match.original;
    } else if (normalizedInput === "voice" || normalizedInput === "use voice") {
       const match = optionMatches.find(o => o.normalized === "voice");
       if (match) instantMatch = match.original;
    } else if (normalizedInput === "text" || normalizedInput === "use text") {
       const match = optionMatches.find(o => o.normalized === "text");
       if (match) instantMatch = match.original;
    } else if (normalizedInput === "sign" || normalizedInput === "sign language") {
       const match = optionMatches.find(o => o.normalized.includes("sign"));
       if (match) instantMatch = match.original;
    } else if (normalizedInput === "vision") {
       const match = optionMatches.find(o => o.normalized === "vision");
       if (match) instantMatch = match.original;
    } else if (normalizedInput === "hearing") {
       const match = optionMatches.find(o => o.normalized === "hearing");
       if (match) instantMatch = match.original;
    } else if (normalizedInput === "cognitive") {
       const match = optionMatches.find(o => o.normalized === "cognitive");
       if (match) instantMatch = match.original;
    } else if (normalizedInput === "mobility") {
       const match = optionMatches.find(o => o.normalized === "mobility");
       if (match) instantMatch = match.original;
    } else if (normalizedInput === "speech") {
       const match = optionMatches.find(o => o.normalized === "speech");
       if (match) instantMatch = match.original;
    }

    if (instantMatch) {
      setStatusMessage({ 
        text: `Aura successfully selected "${instantMatch}" based on your voice command!`, 
        type: "success" 
      });

      // Trigger TTS confirmation with auto-pause-mic
      speakTTSConfirm(`Selecting ${instantMatch}`);

      // Dispatch globally for active views to listen
      window.dispatchEvent(
        new CustomEvent("aura-voice-command", {
          detail: { action: "select", option: instantMatch }
        })
      );
      
      // Auto restart listening after a moment
      setTimeout(() => {
        if (!isListeningEnabledRef.current) return;
        startListening();
      }, 2000);
      
      return; // Fast return
    }

    setProcessingSync(true);
    setStatusMessage({ text: "Aura is understanding your voice intent...", type: "info" });

    try {
      const res = await fetch("/api/gemini/voice-navigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screen: activeScreenRef.current,
          options: activeOptionsRef.current,
          transcript: spokenText
        })
      });

      const data = await res.json();
      setProcessingSync(false);

      if (data.action === "select" && data.option) {
        setStatusMessage({ 
          text: `Aura successfully selected "${data.option}" based on your voice command!`, 
          type: "success" 
        });

        // Trigger TTS confirmation with auto-pause-mic
        speakTTSConfirm(`Selecting ${data.option}`);

        // Dispatch globally for active views to listen
        window.dispatchEvent(
          new CustomEvent("aura-voice-command", {
            detail: { action: "select", option: data.option }
          })
        );
      } else {
        // If it's not a navigation command, dispatch it as a general chat intent
        window.dispatchEvent(
          new CustomEvent("aura-voice-chat", {
            detail: { text: spokenText }
          })
        );
      }
    } catch (error) {
      setProcessingSync(false);
      setStatusMessage({ text: "Error matching speech to navigation elements.", type: "error" });
      startListening();
    }
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulationInput.trim()) return;
    setTranscript(simulationInput);
    submitVoiceInput(simulationInput);
    setSimulationInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-[#4A3F35]">
      {/* Floating Pill Trigger */}
      <motion.button
        id="voice-navigation-floating-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4.5 py-3 rounded-full bg-white border border-[#EBE1D7] shadow-lg shadow-amber-950/10 cursor-pointer hover:bg-[#FDF8F2] active:scale-95 transition-all outline-none"
        whileHover={{ y: -3 }}
        layoutId="voice-pill"
      >
        <span className="relative flex h-3 w-3">
          {/* Faded pale-orange pulse halo */}
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
        <Mic className={`h-4.5 w-4.5 ${isListening ? "text-amber-600" : "text-[#8C7A6B]"}`} />
        <span className="text-xs font-semibold tracking-wide">Aura Hands-Free</span>
      </motion.button>

      {/* Expanded Control Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white border border-[#E8DCCF] rounded-3xl p-5 shadow-2.5xl backdrop-blur-md overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F5EFEA] pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#FFEDD5] text-[#D97706]">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="serif text-base font-bold text-[#3A322B]">Voice Navigator</h3>
                  <p className="text-[10px] uppercase tracking-wider text-[#8C7A6B] font-semibold">
                    Hands-Free Companion Engine
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#8C7A6B] hover:text-[#4A3F35] p-1.5 rounded-full hover:bg-[#F6EEF6] transition-colors cursor-pointer"
                id="voice-drawer-close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Current Screen Indicators */}
            <div className="bg-[#FAF5EE] rounded-2xl p-4.5 border border-[#F0E5D9] mb-4.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xxs font-mono uppercase tracking-wider text-[#A29182]">Current Screen Context</span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              </div>
              <h4 className="font-semibold text-sm text-[#4E3629] mb-2">{currentScreen}</h4>

              <div id="navigation-suggestions" className="">
                <span className="text-xxs font-mono uppercase text-[#A39284] block mb-1.5">Vocal Shortcuts Available:</span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {options.map((opt, idx) => (
                    <span
                      key={idx}
                      className="text-[10.5px] px-2.5 py-1 rounded-lg bg-white border border-[#ECE0D3] text-[#6B5A4B] font-medium"
                    >
                      "{opt}"
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Real Mic Control */}
            <div className="flex flex-col items-center justify-center p-3.5 border border-dashed border-[#ECDDCF] rounded-2xl bg-[#FFFDFB] mb-4">
              <button
                onClick={toggleMic}
                id="mic-navigation-button"
                className={`flex items-center justify-center h-14 w-14 rounded-full shadow-md cursor-pointer transition-all ${
                  isListening 
                    ? "bg-red-500 text-white animate-pulse" 
                    : "bg-[#FFEDD5] hover:bg-[#FED7AA] text-amber-900 border border-orange-200"
                }`}
              >
                {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
              <span className="text-[11px] font-medium mt-2.5 text-[#8C7A6B]">
                {isListening ? "Listening... Keep speaking" : "Tap to speak real vocal command"}
              </span>
            </div>

            {/* Simulated Voice Text Field */}
            <form onSubmit={handleSimulateSubmit} className="mb-4">
              <label htmlFor="simulated-input" className="block text-xxs font-mono uppercase text-[#8C7A6B] mb-1.5">
                Simulate Dictation (Test Hands-Free shortcuts):
              </label>
              <div className="relative flex items-center">
                <input
                  id="simulated-input"
                  type="text"
                  placeholder="e.g. 'I am blind' or 'A Child'"
                  value={simulationInput}
                  onChange={(e) => setSimulationInput(e.target.value)}
                  disabled={isProcessing}
                  className="w-full pl-3.5 pr-10 py-2 text-xs bg-[#FAF8F5] border border-[#E3D4C5] rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="absolute right-1.5 p-1.5 rounded-lg bg-[#FAF8F5] text-[#8C7A6B] hover:text-[#4A3F35] cursor-pointer"
                >
                  <CornerDownLeft className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>

            {/* Match Status Readout */}
            <div className="text-xxs px-2.5 py-2.5 rounded-xl border border-amber-100 bg-amber-50/20 text-[#6B5A4B] leading-relaxed flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>{statusMessage.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
