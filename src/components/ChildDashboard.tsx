import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Gamepad2, 
  BookOpen, 
  HelpCircle, 
  Camera, 
  Bot, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  Smile, 
  Stars, 
  Compass, 
  Send,
  Sparkle
} from "lucide-react";
import { ChatMessage } from "../types";
import AuraOrb from "./AuraOrb";

// Child category profiles
interface ChildCharacter {
  name: string;
  emoji: string;
  color: string;
  intro: string;
  avatarGradients: string;
}

const CHILD_DEVICES: ChildCharacter[] = [
  { name: "Aura the friendly Dragon", emoji: "🐉", color: "text-emerald-500", intro: "Hooray! Let's explore the magical sky together. Ask me anything, or let me tell you a fairy tale!", avatarGradients: "from-emerald-400 to-green-500" },
  { name: "Barnaby the cozy Bear", emoji: "🧸", color: "text-amber-500", intro: "Hello friend! Are you ready for a cozy story or a curious riddle? Let's have some fun!", avatarGradients: "from-amber-400 to-amber-600" },
  { name: "Sylvia the space Star", emoji: "⭐", color: "text-purple-500", intro: "Beam greetings, explorer! Let's search the distant moon galaxies and learn awesome science facts!", avatarGradients: "from-purple-400 to-indigo-500" }
];

// Curious standard kid questions
const CURIOUS_QUESTIONS = [
  { text: "Why is the sky blue?", emoji: "☀️", reply: "The sky looks blue because the air around Earth scatters short blue sunlight waves in every direction like a giant glowing prism!" },
  { text: "How do fish breathe underwater?", emoji: "🐠", reply: "Fish use special gills on the sides of their heads to filter oxygen out from the water, just like our lungs breathe air!" },
  { text: "What makes grass green?", emoji: "🌱", reply: "Plants have a magic pigment called chlorophyll that drinks up yellow and blue sunlight to make food, which turns their leaves super green!" },
  { text: "Why does the moon change shape?", emoji: "🌙", reply: "The moon actually stays round! But as it spins around Earth, the sun shines on different parts of its surface, showing us beautiful shapes!" }
];

// Preloaded playground animal cards for simple Play game
const PLAY_GUESSING_ANIMAL = [
  { name: "Cheetah", description: "I am yellow with black polka dots, and I run faster than any other land animal in the world!", emoji: "🐆", hint: "I run over 60 miles an hour!" },
  { name: "Chameleon", description: "I can change the color of my skin to hide in green leaves or brown branches, and my long tongue snaps flies!", emoji: "🦎", hint: "I rotate my eyes in two different directions!" },
  { name: "Blue Whale", description: "I am the biggest creature to ever live on Earth. My tongue can weigh as much as an elephant!", emoji: "🐋", hint: "I communicate by singing beautiful songs deep in the ocean!" }
];

interface ChildDashboardProps {
  onReset: () => void;
}

export default function ChildDashboard({ onReset }: ChildDashboardProps) {
  const [activeTab, setActiveTab] = useState<"talk" | "learn" | "stories" | "play" | "explore">("talk");
  const [selectedCharacter, setSelectedCharacter] = useState<ChildCharacter>(CHILD_DEVICES[0]);
  
  // States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [orbState, setOrbState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Stories Module states
  const [characterNameInput, setCharacterNameInput] = useState("");
  const [settingInput, setSettingInput] = useState("a glowing mushroom forest");
  const [storyStream, setStoryStream] = useState("");
  const [storyChoices, setStoryChoices] = useState<string[]>([]);
  const [storyStage, setStoryStage] = useState<"setup" | "reading">("setup");
  const [isStoryGenerating, setIsStoryGenerating] = useState(false);

  // Play game states
  const [guessRound, setGuessRound] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [guessAnswerInput, setGuessAnswerInput] = useState("");
  const [guessResult, setGuessResult] = useState("");

  // Explore Camera module states
  const [cameraActive, setCameraActive] = useState(false);
  const [isExploreScanning, setIsExploreScanning] = useState(false);
  const [exploreTextResult, setExploreTextResult] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initial greeting triggers on mount or character change
  useEffect(() => {
    setMessages([
      {
        id: "init",
        role: "model",
        text: `Hi! I'm Aura, but today I'm ${selectedCharacter.name} ${selectedCharacter.emoji}! ${selectedCharacter.intro} What would you like to do today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    speakText(`Hi! I'm Aura, but today I'm ${selectedCharacter.name}! What would you like to do today?`);
  }, [selectedCharacter]);

  useEffect(() => {
    // Attempt auto-greet if voice is enabled globally for children profile
    if (voiceEnabled && messages.length === 1) {
      setTimeout(() => {
        speakText(messages[0].text);
      }, 500); 
    }

    return () => {
      stopSpeak();
      if (cameraActive) {
         stopCamera();
      }
    };
  }, [cameraActive, voiceEnabled, messages.length]);

  // Listen for hands-free voice commands in the child play area
  useEffect(() => {
    const handleVoiceCommand = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.action === "select" && detail.option) {
        const option = detail.option.toLowerCase();
        
        if (option.includes("talk") || option.includes("dragon") || option.includes("bear") || option.includes("star") || option.includes("buddy")) {
          setActiveTab("talk");
          stopSpeak();
          speakText("Let's talk!");
        } else if (option.includes("learn") || option.includes("facts") || option.includes("curious")) {
          setActiveTab("learn");
          stopSpeak();
          speakText("Welcome to Curious Facts!");
        } else if (option.includes("story") || option.includes("fairytale") || option.includes("magic tales")) {
          setActiveTab("stories");
          stopSpeak();
          setStoryStage("setup");
          setStoryStream("");
          speakText("Welcome to Magic Fairytales!");
        } else if (option.includes("play") || option.includes("riddle") || option.includes("guess")) {
          setActiveTab("play");
          stopSpeak();
          setGuessResult("");
          speakText("Let's guess animals!");
        } else if (option.includes("explore") || option.includes("camera") || option.includes("secret") || option.includes("lens")) {
          setActiveTab("explore");
          stopSpeak();
          speakText("Open the magic camera!");
        }
      }
    };

    const handleVoiceChat = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.text) {
        // Automatically send the spoken text as a chat message if in talk tab
        if (activeTab === "talk") {
          handleSend(detail.text);
        } else if (activeTab === "play") {
          // Play tab uses text answer input
          const spoken = detail.text.toLowerCase().replace(/[.,!?'"]/g, "").trim();
          handleAnimalGuess(spoken);
        } else if (activeTab === "stories") {
          if (storyStage === "reading") {
             generateNewStory(detail.text);
          }
        }
      }
    };

    window.addEventListener("aura-voice-command", handleVoiceCommand);
    window.addEventListener("aura-voice-chat", handleVoiceChat);
    return () => {
      window.removeEventListener("aura-voice-command", handleVoiceCommand);
      window.removeEventListener("aura-voice-chat", handleVoiceChat);
    };
  }, [activeTab, storyStage]);

  // Voice narration triggers
  const speakText = async (text: string) => {
    if (!voiceEnabled) return;
    try {
      setOrbState("speaking");
      const res = await fetch("/api/gemini/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, support: "A Child" }) // Puck friendly voice triggers
      });
      const data = await res.json();
      if (data.audio) {
         const binaryString = atob(data.audio);
         const bytes = new Uint8Array(binaryString.length);
         for (let i = 0; i < binaryString.length; i++) {
           bytes[i] = binaryString.charCodeAt(i);
         }
         const blob = new Blob([bytes], { type: "audio/wav" });
         const url = URL.createObjectURL(blob);
         const audio = new Audio(url);
         audio.onended = () => {
           setOrbState("idle");
           (window as any).isAuraSpeaking = false;
         };
         audio.onerror = () => {
           (window as any).isAuraSpeaking = false;
           fallbackLocalSpeak(text);
         };
         (window as any).isAuraSpeaking = true;
         await audio.play();
         return;
      } else {
         fallbackLocalSpeak(text);
      }
    } catch (e) {
      fallbackLocalSpeak(text);
    }
  };

  const fallbackLocalSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      applyAuraVoiceConfigs(utterance);

      utterance.onstart = () => {
        setOrbState("speaking");
        (window as any).isAuraSpeaking = true;
      };
      utterance.onend = () => {
        setOrbState("idle");
        (window as any).isAuraSpeaking = false;
      };
      utterance.onerror = () => {
        setOrbState("idle");
        (window as any).isAuraSpeaking = false;
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setOrbState("idle");
    (window as any).isAuraSpeaking = false;
  };

  // Chat conversation
  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputValue.trim();
    if (!textToSend) return;

    stopSpeak();
    setInputValue("");

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsAiResponding(true);
    setOrbState("thinking");

    try {
      const historyPayload = messages.map(m => ({ role: m.role, text: m.text }));
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          settings: { profile: "A Child" } // forces server to format as friendly storyteller
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const reply = data.response;
      const modelMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "model",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, modelMsg]);
      setIsAiResponding(false);
      speakText(reply);
    } catch (err: any) {
      console.error(err);
      const modelMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "model",
        text: `Oh no! Mystical stars are offline for a brief second. Error: ${err.message || "Trouble connect"}. Let's try again in a little bit!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, modelMsg]);
      setIsAiResponding(false);
      setOrbState("idle");
    }
  };

  // Story module generator (WOW Factor 1/2 adaptation)
  const generateNewStory = async (choiceMade?: string) => {
    stopSpeak();
    setIsStoryGenerating(true);
    setOrbState("thinking");
    setStoryStage("reading");

    let prompt = "";
    if (choiceMade) {
       prompt = `We are reading an interactive story. The child chose: "${choiceMade}". Continue the fairytale. Write the next exciting section (under 120 words). Provide TWO new silly or exciting choices for the adventurer to select next. Highlight the story paragraphs, and label choices precisely as 'Choice A:' and 'Choice B:' so I can show them on screen. Keep the tone playful, magical, and warm.`;
    } else {
       const character = characterNameInput.trim() || "Barnaby the Explorer";
       prompt = `Create a magical, interactive bedtime fairytale about a character named "${character}" who goes on an adventure in "${settingInput}". 
       Write the first chapter (under 130 words). At the end of the chapter, present exactly TWO choices for what the main character does next. 
       Label them clearly as:
       Choice A: [Explain Option]
       Choice B: [Explain Option]`;
    }

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          history: [],
          settings: { profile: "A Child" }
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const reply = data.response;
      setStoryStream(reply);

      // Parse the reply to find Choice A and Choice B
      const choices: string[] = [];
      const lines = reply.split("\n");
      for (const line of lines) {
        if (line.toLowerCase().includes("choice a:") || line.toLowerCase().includes("choice a -")) {
           choices.push(line.replace(/Choice A:|Choice A -/i, "").trim());
        } else if (line.toLowerCase().includes("choice b:") || line.toLowerCase().includes("choice b -")) {
           choices.push(line.replace(/Choice B:|Choice B -/i, "").trim());
        }
      }

      if (choices.length > 0) {
        setStoryChoices(choices);
      } else {
        // Fallback options
        setStoryChoices(["Open the sparkling portal!", "Walk down the bubble trail!"]);
      }

      setIsStoryGenerating(false);
      speakText(reply);

    } catch (e: any) {
      console.error(e);
      setStoryStream("Oops! Fiona the dragon got too excited and toasted the story book! Let's click Back and try starting our adventure again!");
      setIsStoryGenerating(false);
      setOrbState("idle");
    }
  };

  // Play guessing game logic
  const handleAnimalGuess = (guess: string) => {
    const currentAnimal = PLAY_GUESSING_ANIMAL[guessRound];
    if (guess.toLowerCase().includes(currentAnimal.name.toLowerCase())) {
       setGuessResult(`🎉 HURRAH! You guessed it perfectly! It's indeed a ${currentAnimal.name}! Splendid Job.`);
       speakText(`Hurrah! You guessed it perfectly! It's indeed a ${currentAnimal.name}! Splendid Job.`);
    } else {
       setGuessResult(`Aww, close but not quite. Tap 'Show Hint' if you are stumped, or try another guess!`);
       speakText("Close, but not quite! Let's try again.");
    }
  };

  const nextAnimalRound = () => {
     setGuessRound((prev) => (prev + 1) % PLAY_GUESSING_ANIMAL.length);
     setGuessResult("");
     setGuessAnswerInput("");
     setShowHint(false);
     stopSpeak();
  };

  // Camera start for magical exploration
  const startExploreCamera = async () => {
    setCameraActive(true);
    setExploreTextResult("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
         videoRef.current.srcObject = stream;
         videoRef.current.play();
      }
    } catch (e) {
      console.warn("Camera trigger blocked in child exploration mode:", e);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
       const stream = videoRef.current.srcObject as MediaStream;
       stream.getTracks().forEach(t => t.stop());
       videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureMagicalObject = async () => {
    if (!canvasRef.current || !videoRef.current) return;
    setIsExploreScanning(true);
    setOrbState("thinking");
    setExploreTextResult("Aura is sparkling magic on your camera feed...");

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Url = canvas.toDataURL("image/jpeg", 0.85);

        const response = await fetch("/api/gemini/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64Url,
            prompt: "You are Aura, a friendly magical assistant. Describe the object in this image in a cute, fun, and magical way for a child. Tell them an awesome scientific fact about it so they learn while playing!",
            settings: { profile: "A Child" }
          })
        });

        const data = await response.json();
        setExploreTextResult(data.text);
        setIsExploreScanning(false);
        speakText(data.text);
      }
    } catch (e: any) {
      console.error(e);
      setExploreTextResult("Mystic lens scanner fell asleep! Put a toy or leaf close, check network secrets, and click scan again!");
      setIsExploreScanning(false);
      setOrbState("idle");
    }
  };

  // Simulated child picture scanning (if webcam unreadable)
  const clickSimulatedObject = (description: string, sciencePrompt: string) => {
    setIsExploreScanning(true);
    setOrbState("thinking");
    setExploreTextResult("Sparkles falling... Scanning virtual toy...");
    setTimeout(() => {
       const simText = `Ooh look! I see a cute ${description}! Science Fact: Did you know that ${sciencePrompt}? Isn't nature filled with magic?`;
       setExploreTextResult(simText);
       setIsExploreScanning(false);
       speakText(simText);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#FDF8F2] flex flex-col justify-between text-[#4A3F35] selection:bg-pink-100">
      
      {/* Playful Header */}
      <header className="sticky top-0 bg-[#FDF8F2]/95 backdrop-blur-md z-40 border-b border-[#E8DCCF] p-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center space-x-3.5">
            <span className="text-3xl">✨</span>
            <div>
              <h1 className="serif text-3xl font-bold tracking-tight text-[#3A322B]">AURA Playroom</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8C7A6B] font-semibold">
                Magic Companion Engine: Active
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Narrator */}
            <button
              onClick={() => {
                if (voiceEnabled) {
                  stopSpeak();
                  setVoiceEnabled(false);
                } else {
                  setVoiceEnabled(true);
                  speakText("Hi! Voice storytelling is back on!");
                }
              }}
              className={`p-3 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                voiceEnabled 
                  ? "bg-pink-100 text-pink-600 border-pink-200" 
                  : "bg-white text-gray-400 border-gray-200"
              }`}
            >
              {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>

            <button
              onClick={onReset}
              className="text-xs bg-white text-pink-600 font-bold border-2 border-pink-200 hover:bg-pink-50 active:scale-95 px-4 py-2 rounded-2xl transition-all cursor-pointer"
            >
              Back to Home
            </button>
          </div>

        </div>
      </header>

      {/* Playroom main container */}
      <div className="max-w-7xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-8">
        
        {/* Playroom Nav (Bubbly Buttons) */}
        <nav className="lg:col-span-3 flex flex-row lg:flex-col gap-3 overflow-x-auto pb-2 lg:pb-0">
          
          <button
            onClick={() => { setActiveTab("talk"); stopSpeak(); }}
            className={`flex items-center space-x-3 w-full p-4 rounded-3xl text-left cursor-pointer transition-all border-2 shrink-0 ${
              activeTab === "talk"
                ? "bg-pink-100 text-pink-900 border-pink-300 shadow-sm"
                : "bg-white hover:bg-pink-50/50 border-pink-50 text-[#5C3E35]"
            }`}
          >
            <Bot className="h-6 w-6 text-pink-400 shrink-0" />
            <div className="text-sm">
              <span className="font-bold block">Talk to Aura</span>
              <span className="text-xs opacity-80 block">Chat with friendly characters</span>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab("learn"); stopSpeak(); }}
            className={`flex items-center space-x-3 w-full p-4 rounded-3xl text-left cursor-pointer transition-all border-2 shrink-0 ${
              activeTab === "learn"
                ? "bg-sky-100 text-sky-950 border-sky-300 shadow-sm"
                : "bg-white hover:bg-sky-50/50 border-pink-50 text-[#5C3E35]"
            }`}
          >
            <HelpCircle className="h-6 w-6 text-sky-400 shrink-0" />
            <div className="text-sm">
              <span className="font-bold block">Curious Facts</span>
              <span className="text-xs opacity-80 block">Why? How? What? answers</span>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab("stories"); stopSpeak(); setStoryStage("setup"); setStoryStream(""); }}
            className={`flex items-center space-x-3 w-full p-4 rounded-3xl text-left cursor-pointer transition-all border-2 shrink-0 ${
              activeTab === "stories"
                ? "bg-purple-100 text-purple-900 border-purple-300 shadow-sm"
                : "bg-white hover:bg-purple-50/50 border-pink-50 text-[#5C3E35]"
            }`}
          >
            <BookOpen className="h-6 w-6 text-purple-400 shrink-0" />
            <div className="text-sm">
              <span className="font-bold block">Magic Tales</span>
              <span className="text-xs opacity-80 block">Interactive fairytales picker</span>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab("play"); stopSpeak(); setGuessResult(""); }}
            className={`flex items-center space-x-3 w-full p-4 rounded-3xl text-left cursor-pointer transition-all border-2 shrink-0 ${
              activeTab === "play"
                ? "bg-amber-100 text-amber-950 border-amber-300 shadow-sm"
                : "bg-white hover:bg-amber-50/50 border-pink-50 text-[#5C3E35]"
            }`}
          >
            <Gamepad2 className="h-6 w-6 text-amber-400 shrink-0" />
            <div className="text-sm">
              <span className="font-bold block">Animal Riddles</span>
              <span className="text-xs opacity-80 block">Fun animal guessing game</span>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab("explore"); stopSpeak(); }}
            className={`flex items-center space-x-3 w-full p-4 rounded-3xl text-left cursor-pointer transition-all border-2 shrink-0 ${
              activeTab === "explore"
                ? "bg-emerald-100 text-emerald-950 border-emerald-300 shadow-sm"
                : "bg-white hover:bg-emerald-50/50 border-pink-50 text-[#5C3E35]"
            }`}
          >
            <Compass className="h-6 w-6 text-emerald-400 shrink-0" />
            <div className="text-sm">
              <span className="font-bold block">Secret Lens</span>
              <span className="text-xs opacity-80 block">Magical camera scanner</span>
            </div>
          </button>

          {/* Character selector panel */}
          <div className="hidden lg:block mt-6 p-5 bg-white rounded-3xl border-2 border-pink-100">
             <h4 className="text-xs font-bold text-pink-600 uppercase tracking-wide mb-3 flex items-center gap-1">
               <Smile className="h-3.5 w-3.5" />
               <span>Choose your Buddy</span>
             </h4>

             <div className="space-y-2">
               {CHILD_DEVICES.map(char => (
                 <button
                   key={char.name}
                   onClick={() => setSelectedCharacter(char)}
                   className={`w-full p-2.5 rounded-2xl border-2 text-left flex items-center space-x-2 text-xs cursor-pointer transition-all ${
                     selectedCharacter.name === char.name
                       ? "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                       : "bg-[#FAF8F5] hover:bg-white border-transparent"
                   }`}
                 >
                   <span className="text-xl">{char.emoji}</span>
                   <span>{char.name.split(" ")[0]} description</span>
                 </button>
               ))}
             </div>
          </div>

        </nav>

        {/* Playroom Canvas Stage */}
        <main className="lg:col-span-9 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            
            {/* WINDOW 1: TALK TO AURA */}
            {activeTab === "talk" && (
              <motion.div
                key="talk-stage"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6"
              >
                
                {/* Character Avatar Aura Orb panel */}
                <div className="md:col-span-5 bg-white border-2 border-pink-100 p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                  <div className={`p-4 bg-gradient-to-br ${selectedCharacter.avatarGradients} text-white rounded-3xl shadow-md mb-6 relative group overflow-hidden`}>
                     <span className="text-6xl block transform group-hover:scale-110 transition-transform">{selectedCharacter.emoji}</span>
                     <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-200 animate-spin" />
                  </div>

                  <h3 className="font-bold text-lg text-[#4C2E25]">{selectedCharacter.name}</h3>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping mt-1" />

                  {/* Multi-Colored Bubbly Pastel Rainbow Orb */}
                  <div className="my-6">
                    <AuraOrb status={orbState} isChild={true} size={150} />
                  </div>

                  <p className="text-xs text-slate-500 font-medium px-4 leading-relaxed">
                    Click the Orb above to hear my cute voice anytime.
                  </p>
                </div>

                {/* Right Side Chat logs */}
                <div className="md:col-span-7 bg-white p-6 rounded-3xl border-2 border-pink-100 flex flex-col justify-between min-h-[460px]">
                  
                  <div className="pb-3 border-b-2 border-pink-50 flex items-center space-x-2 text-pink-600 mb-4">
                     <Stars className="h-5 w-5 text-pink-400 animate-bounce" />
                     <span className="text-sm font-bold">Magical Speech Board</span>
                  </div>

                  {/* Messaging board scrolling */}
                  <div className="flex-1 overflow-y-auto max-h-[290px] pr-2 space-y-4">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                      >
                        <div className={`p-4 rounded-3xl max-w-[85%] leading-relaxed text-sm ${
                          msg.role === "user"
                            ? "bg-pink-400 text-white rounded-tr-none"
                            : "bg-[#FAECE8] text-[#5C3E35] rounded-tl-none font-medium"
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-xxs text-gray-400 font-mono mt-1 px-1">
                          {msg.role === "user" ? "You" : selectedCharacter.name.split(" ")[0]}
                        </span>
                      </div>
                    ))}

                    {isAiResponding && (
                      <div className="flex space-x-1 items-center p-3 bg-pink-50 text-pink-400 max-w-[80px] rounded-full animate-pulse justify-center">
                         <span>Talking...</span>
                      </div>
                    )}
                  </div>

                  {/* Input panel */}
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex mt-4 pt-3 border-t-2 border-pink-50 space-x-2"
                  >
                     <input
                       type="text"
                       value={inputValue}
                       onChange={(e) => setInputValue(e.target.value)}
                       placeholder="Say: 'Tell me a joke', 'What is gold dust', or chat with me..."
                       className="flex-1 bg-pink-50/50 hover:bg-pink-50 p-3.5 text-sm rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-pink-300 transition-all font-semibold"
                     />
                     <button
                       type="submit"
                       className="p-3.5 bg-pink-400 text-white rounded-2xl hover:bg-pink-500 transition-colors shadow-sm shadow-pink-200 cursor-pointer"
                     >
                       <Send className="h-5 w-5" />
                     </button>
                  </form>

                </div>

              </motion.div>
            )}

            {/* WINDOW 2: CURIOUS DIALOGS (LEARN) */}
            {activeTab === "learn" && (
              <motion.div
                key="learn-stage"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border-2 border-sky-100 p-6 rounded-3xl"
              >
                <div className="text-center max-w-lg mx-auto mb-8">
                  <span className="text-3xl block">🌈</span>
                  <h2 className="text-xl font-bold text-sky-950 mt-2">The Curious Spark Factboard</h2>
                  <p className="text-xs text-sky-700 font-medium">
                     Select any big questions below. Sylvia or Fiona will describe the science simply and cleanly!
                  </p>
                </div>

                {/* Question selector cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {CURIOUS_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        stopSpeak();
                        setMessages([
                          { id: `q-${idx}`, role: "user", text: q.text, timestamp: "" },
                          { id: `a-${idx}`, role: "model", text: q.reply, timestamp: "" }
                        ]);
                        speakText(q.reply);
                        setActiveTab("talk"); // switches to talk tab to display results
                      }}
                      className="p-5 bg-sky-50/40 hover:bg-sky-50 border-2 border-sky-100 rounded-3xl text-left cursor-pointer transition-all flex items-start space-x-3.5 group hover:-translate-y-1"
                    >
                      <span className="text-3xl p-2.5 bg-white rounded-2xl group-hover:scale-110 transition-transform shadow-xs">
                        {q.emoji}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-sky-950 group-hover:text-blue-900">{q.text}</h4>
                        <p className="text-xxs text-slate-500 mt-1 font-light">Click to learn and ask details!</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* WINDOW 3: MAGIC BEDTIME TALES GENERATION */}
            {activeTab === "stories" && (
              <motion.div
                key="stories-stage"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border-2 border-purple-100 p-6 rounded-3xl min-h-[460px]"
              >
                <div className="pb-3 border-b-2 border-purple-50 justify-between items-center sm:flex mb-5">
                   <div>
                     <h3 className="font-bold text-lg text-purple-950 flex items-center gap-1">
                       <BookOpen className="h-5 w-5 text-purple-400" />
                       <span>Magical Interactive Story Book</span>
                     </h3>
                     <p className="text-xs text-purple-700">Write your explorer name, pick a starting world, and forge a customized journey.</p>
                   </div>
                   
                   {storyStage === "reading" && (
                     <button
                       onClick={() => setStoryStage("setup")}
                       className="text-xs text-[#5C3E35] border border-purple-200 bg-purple-50 hover:bg-purple-100 font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                     >
                       Story Setup
                     </button>
                   )}
                </div>

                <AnimatePresence mode="wait">
                  
                  {/* STORY SETUP STAGE */}
                  {storyStage === "setup" && (
                    <motion.div
                      key="story-setup-form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="max-w-md mx-auto space-y-5 py-6"
                    >
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-purple-800 mb-1">
                          Adventurer character name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Barnaby the Brave Teddy..."
                          value={characterNameInput}
                          onChange={(e) => setCharacterNameInput(e.target.value)}
                          className="w-full bg-[#FAF8FC] p-3 border-2 border-purple-100 focus:ring-2 focus:ring-purple-300 rounded-2xl font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-purple-800 mb-1">
                          Where does your story start?
                        </label>
                        <select
                          value={settingInput}
                          onChange={(e) => setSettingInput(e.target.value)}
                          className="w-full bg-[#FAF8FC] p-3 border-2 border-purple-100 focus:ring-2 focus:ring-purple-300 rounded-2xl font-bold cursor-pointer text-sm focus:outline-none"
                        >
                          <option value="a glowing mushroom forest">A Glowing Mushroom Forest 🍄</option>
                          <option value="a secret floating castle in the candy clouds">A Secret Candy Cloud Floating Castle ☁️</option>
                          <option value="the sparkly neon depths of the dolphin ocean">Sparkly Neon Dolphin Ocean 🐬</option>
                          <option value="a giant moon chocolate volcano">Chocolate Moon Volcano 🌋</option>
                        </select>
                      </div>

                      <button
                        onClick={() => generateNewStory()}
                        className="w-full py-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-2xl shadow-md transition-all cursor-pointer text-sm flex items-center justify-center space-x-1.5"
                      >
                        <Sparkle className="h-4 w-4 animate-spin" />
                        <span>Bring My Story to Life!</span>
                      </button>
                    </motion.div>
                  )}

                  {/* STORY READING STAGE */}
                  {storyStage === "reading" && (
                    <motion.div
                      key="story-gameplay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                       <div className="bg-[#FAF7FD] p-6 rounded-3xl border-2 border-purple-50 min-h-[160px]">
                          {isStoryGenerating ? (
                            <div className="flex flex-col items-center justify-center py-10 space-y-3">
                              <span className="text-3xl animate-spin">🔮</span>
                              <p className="text-xs text-purple-600 font-mono tracking-wide">Fiona the dragon is weaving magical words...</p>
                            </div>
                          ) : (
                            <div className="font-serif leading-relaxed text-[#4C2E25] text-sm tracking-wide text-justify space-y-4 font-normal whitespace-pre-line">
                              {storyStream}
                            </div>
                          )}
                       </div>

                       {/* Options choice list */}
                       {!isStoryGenerating && storyChoices.length > 0 && (
                         <div className="space-y-3">
                           <span className="text-xs font-bold uppercase tracking-widest text-[#856372] block">
                             What does our brave adventurer do next? Choose:
                           </span>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                             {storyChoices.map((choice, idx) => (
                               <button
                                 key={idx}
                                 onClick={() => generateNewStory(choice)}
                                 className="p-4 bg-white hover:bg-purple-50 border-2 border-purple-200 text-purple-950 rounded-2xl text-xs text-left cursor-pointer transition-all hover:translate-x-1 hover:border-purple-400 font-semibold"
                               >
                                 <span className="font-bold text-purple-600">Choice {idx === 0 ? "A" : "B"}:</span> {choice}
                               </button>
                             ))}
                           </div>
                         </div>
                       )}

                    </motion.div>
                  )}

                </AnimatePresence>
              </motion.div>
            )}

            {/* WINDOW 4: PLAY ANIMAL RIDDLES */}
            {activeTab === "play" && (
              <motion.div
                key="play-stage"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border-2 border-amber-150 p-6 rounded-3xl"
              >
                <div className="text-center max-w-md mx-auto mb-6">
                   <Gamepad2 className="h-10 w-10 text-amber-500 mx-auto animate-bounce mb-2" />
                   <h2 className="text-xl font-bold text-[#4C2E25]">The Mystic Animal Riddle Arena</h2>
                   <p className="text-xs text-amber-700 leading-relaxed font-light">
                     Help Aura decipher which wonderful creature is being described! Can you guess?
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                   
                   {/* Riddle box */}
                   <div className="md:col-span-12 bg-amber-50/50 p-6 rounded-3xl border-2 border-amber-100 text-center relative overflow-hidden">
                     <span className="absolute -top-10 -left-10 text-6xl opacity-10">🤔</span>
                     <span className="text-xs font-bold font-mono text-amber-800 uppercase tracking-widest block mb-1">
                       Animal Case Round {guessRound + 1}
                     </span>
                     <h3 className="text-md font-semibold text-[#4C2E25] italic leading-relaxed">
                        &ldquo;{PLAY_GUESSING_ANIMAL[guessRound].description}&rdquo;
                     </h3>

                     <div className="mt-4 flex justify-center space-x-2">
                       <button
                         onClick={() => { setShowHint(!showHint); stopSpeak(); speakText(`Hint: ${PLAY_GUESSING_ANIMAL[guessRound].hint}`); }}
                         className="text-xxs px-3 py-1.5 bg-white text-[#5C3E35] border border-amber-200 font-bold rounded-xl cursor-pointer hover:bg-amber-100 transition-colors"
                       >
                         {showHint ? "Hide Hint" : "Get Hint ✨"}
                       </button>
                     </div>

                     {showHint && (
                       <p className="text-xs text-amber-900 bg-white/70 py-2 px-4 rounded-xl border border-amber-100 max-w-xs mx-auto mt-3 font-semibold">
                         {PLAY_GUESSING_ANIMAL[guessRound].hint}
                       </p>
                     )}
                   </div>

                   {/* Answer typing inputs */}
                   <div className="md:col-span-12 space-y-4">
                     <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Your answer (e.g. Chameleon, Elephant, Whale...)"
                          value={guessAnswerInput}
                          onChange={(e) => setGuessAnswerInput(e.target.value)}
                          className="flex-1 p-3.5 border-2 border-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300 rounded-2xl text-sm font-bold bg-[#FAF9F5]"
                        />
                        <button
                          onClick={() => handleAnimalGuess(guessAnswerInput)}
                          className="p-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold cursor-pointer text-sm"
                        >
                          Check Guess!
                        </button>
                     </div>

                     <div id="guessing-results-widget" className="flex flex-col sm:flex-row justify-between items-center bg-[#FAF8F5] p-4 rounded-2xl border border-amber-100 gap-3">
                       <p className="text-xs text-amber-900 font-semibold text-center sm:text-left">
                         {guessResult || "Type your guess above to test your science muscles!"}
                       </p>
                       <button
                         onClick={nextAnimalRound}
                         className="text-xxs py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shrink-0 cursor-pointer"
                       >
                         Next Animal Round
                       </button>
                     </div>

                   </div>

                </div>

              </motion.div>
            )}

            {/* WINDOW 5: SECRET LENS (MAGICAL CAMERA) */}
            {activeTab === "explore" && (
              <motion.div
                key="explore-stage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border-2 border-emerald-100 p-6 rounded-3xl"
              >
                <div className="mb-4">
                   <h2 className="text-xl font-bold text-emerald-950 flex items-center space-x-2">
                     <Camera className="h-6 w-6 text-emerald-500" />
                     <span>The Secret Spark Webcam Lens</span>
                   </h2>
                   <p className="text-xs text-emerald-700 font-semibold">
                     Hold up a leaf, a teddy bear, or a spoon to the webcam! Aura will analyze it and reveal a secret scientific fact!
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   
                   {/* Capture stage */}
                   <div className="bg-slate-100 rounded-3xl overflow-hidden aspect-video relative flex flex-col justify-center items-center border-2 border-emerald-50">
                     {cameraActive ? (
                       <>
                         <video 
                           ref={videoRef} 
                           referrerPolicy="no-referrer"
                           className="w-full h-full object-cover" 
                           playsInline 
                           muted 
                         />
                         <canvas ref={canvasRef} className="hidden" />
                         
                         <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2">
                           <button
                             onClick={captureMagicalObject}
                             disabled={isExploreScanning}
                             className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 flex items-center space-x-1"
                           >
                             <span>Capture & Scan Magic</span>
                           </button>
                           <button
                             onClick={stopCamera}
                             className="px-3 py-2 bg-slate-900 text-white text-xxs rounded-lg cursor-pointer"
                           >
                             Close
                           </button>
                         </div>
                       </>
                     ) : (
                       <div className="text-center p-6 flex flex-col items-center">
                         <Camera className="h-10 w-10 text-emerald-400 mb-2 animate-pulse" />
                         <span className="text-xs font-bold font-mono text-gray-500 block">WEBCAM DISCONNECTED</span>
                         <button
                           onClick={startExploreCamera}
                           className="mt-4 px-4 py-2 bg-[#4C312E] hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                         >
                           Activate Magic Lens
                         </button>
                       </div>
                     )}
                   </div>

                   {/* Scanning results side */}
                   <div className="flex flex-col justify-between">
                     <div>
                       <span className="text-xxs font-bold text-emerald-600 uppercase font-mono block mb-2">
                         Virtual Scan Demos (Try these)
                       </span>
                       <div className="flex flex-wrap gap-1.5 justify-start mb-4">
                         <button
                           onClick={() => clickSimulatedObject("Cute Teddy Bear", "Teddy bears are styled after real grizzly bears, but grizzly bear cubs can weigh as little as an apple when born!")}
                           className="text-xxs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold p-2.5 rounded-xl border border-emerald-200 cursor-pointer"
                         >
                           🧸 Scan Cute Toy
                         </button>
                         <button
                           onClick={() => clickSimulatedObject("Potted Ivy Plant", "Ivy plants use tiny little aerial root suction pads to climb walls over 100 feet high!")}
                           className="text-xxs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold p-2.5 rounded-xl border border-emerald-200 cursor-pointer"
                         >
                           🌿 Scan Green Leaf
                         </button>
                       </div>
                     </div>

                     <div className="bg-emerald-50/40 p-4 rounded-2xl border-2 border-emerald-100 min-h-24 relative flex-1 flex flex-col justify-center">
                       <span className="text-xxs font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded absolute top-2 right-3 font-semibold">
                         Aura secret fact
                       </span>
                       
                       {isExploreScanning ? (
                         <div className="flex items-center space-x-1.5 text-xs text-emerald-800 font-medium pt-4">
                           <span className="animate-spin text-lg">💡</span>
                           <span>Brewing magic fact...</span>
                         </div>
                       ) : (
                         <p className="text-xs font-bold leading-relaxed text-[#5C3E35] pt-4">
                           {exploreTextResult || "Holding up objects to the camera triggers Aura. Try scanning virtual toys above!"}
                         </p>
                       )}
                     </div>

                   </div>

                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </main>

      </div>

    </div>
  );
}
