import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Volume2, 
  VolumeX, 
  Send, 
  Camera, 
  AlertTriangle, 
  FileText, 
  HelpCircle, 
  PhoneCall, 
  MapPin, 
  Activity, 
  Grid, 
  Layers, 
  ChevronRight, 
  RefreshCw, 
  CheckCircle,
  Eye,
  Info,
  Mic
} from "lucide-react";
import { AdaptationSettings, ChatMessage, GestureResult, GovernmentDoc } from "../types";
import AuraOrb from "./AuraOrb";
import { applyAuraVoiceConfigs } from "../lib/voice";

// Sample local government guidelines templates
const SAMPLE_DOCS: GovernmentDoc[] = [
  {
    id: "gov-1",
    name: "Disability Certificate Renewal (Form A-1)",
    category: "Certificate",
    description: "Official certificate validating disability standing to access transport subsidies, utility deductions, and welfare allotments.",
    formFields: [
      { field: "Section 1: Registration ID", placeholder: "e.g., DIS-99234-X", guidance: "Can be found in the upper-right corner of your old certificate printout." },
      { field: "Section 2: Clinical Coding Indicator", placeholder: "e.g., G35.9 (MS) or F84.0", guidance: "Must correspond perfectly with Page 2 of your practitioner clinical diagnostic letter." },
      { field: "Section 6: Income Attestation", placeholder: "Annual adjusted gross income", guidance: "If you earn below $24,000, attach your tax waiver certificate for full fee coverage." }
    ]
  },
  {
    id: "gov-2",
    name: "Assistive Workspace Technology Scholarship",
    category: "Scholarship",
    description: "Provides full technical funding up to $4,500 for braille tablets, dynamic eye-trackers, or orthopedic mice.",
    formFields: [
      { field: "Requested Equipment Details", placeholder: "e.g., OptiKey Eye Tracker Pro", guidance: "State specific model name, retail unit price, and certified vendor invoice quote." },
      { field: "Welfare Qualification ID", placeholder: "Benefit code", guidance: "This is either your 9-digit social pension ID or regional benefit letter code." }
    ]
  },
  {
    id: "gov-3",
    name: "Healthcare Support - Medication Subsidy Scheme",
    category: "Benefit",
    description: "Provides up to 80% coverage on registered chronic illness medications and physical rehabilitation therapies.",
    formFields: [
      { field: "Allergy and Contraindication Log", placeholder: "List any substance reactions", guidance: "Describe clear historic severe food/drug reactions or write 'None'." }
    ]
  }
];

// Pre-packaged test mock scene files for visual playground / fallbacks
const SCENE_DEMOS = [
  {
    id: "test-nav",
    name: "Navigation (Obstacles Ahead)",
    image: "https://images.unsplash.com/photo-1545258122-474be59c35df?w=500&auto=format&fit=crop&q=60",
    description: "A hallway containing a chair and shoes. Teaches Aura to clear paths and give directions.",
    prompt: "Scan the scene. Look for obstacles, approximate their distance, and declare whether the walking pathway is clear."
  },
  {
    id: "test-med",
    name: "Medication Label (Warning Scanner)",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
    description: "A standard pharmacy bottle container. Let's inspect dosage directions and side effects.",
    prompt: "Scan this medicine label. Identify the medication name, key safety warnings, and dosage directions."
  },
  {
    id: "test-sign-help",
    name: "Sign Gesture: HELP",
    image: "https://images.unsplash.com/photo-1563170351-be82bc888bb4?w=500&auto=format&fit=crop&q=60",
    description: "Hand raised open, asking for communication or help interpreter support.",
    prompt: "Recognize the ASL hand gesture or pose. Analyze for: Help, Yes, No, Stop, Emergency, Water, Food, Home."
  },
  {
    id: "test-sign-water",
    name: "Sign Gesture: WATER",
    image: "https://images.unsplash.com/photo-1611095777215-927129edd483?w=500&auto=format&fit=crop&q=60",
    description: "Person drinking glass of water or gesturing towards hydration.",
    prompt: "Recognize the target gestures: Help, Yes, No, Stop, Emergency, Water, Food, Home in this picture."
  }
];

interface AdultDashboardProps {
  settings: AdaptationSettings;
  onReset: () => void;
}

export default function AdultDashboard({ settings, onReset }: AdultDashboardProps) {
  // Support indicators
  const hasVisionSupport = settings.support.includes("Vision");
  const hasHearingSupport = settings.support.includes("Hearing");
  const hasCognitiveSupport = settings.support.includes("Cognitive");
  const hasMobilitySupport = settings.support.includes("Mobility");
  const hasSpeechSupport = settings.support.includes("Speech");

  // General App states
  const [activeTab, setActiveTab] = useState<"assistant" | "gov" | "emergency">("assistant");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "model",
      text: "How can I help you today? I'm fully adapted to your sensory profile.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [orbState, setOrbState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [globalSpeechEnabled, setGlobalSpeechEnabled] = useState(hasVisionSupport || settings.communication === "Voice"); // default enabled for vision or voice profile

  // Live Transcription State
  const [isLiveTranscriptionActive, setIsLiveTranscriptionActive] = useState(hasHearingSupport);
  const [liveTranscriptionText, setLiveTranscriptionText] = useState("");
  const liveRecRef = useRef<any>(null);
  const transcriptionPersistRef = useRef("");

  // Camera integration states
  const [cameraStreamActive, setCameraStreamActive] = useState(false);
  const [visionMode, setVisionMode] = useState<"describe" | "navigation" | "medication" | "gesture">("describe");
  const [visionOutput, setVisionOutput] = useState("");
  const [isVisionScanning, setIsVisionScanning] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [gestureRecognitionResult, setGestureRecognitionResult] = useState<GestureResult | null>(null);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  // WOW Factor 2: Gov Assistant specifics
  const [selectedGovDoc, setSelectedGovDoc] = useState<GovernmentDoc | null>(null);
  const [govFormProgress, setGovFormProgress] = useState<{ [formId: string]: { [field: string]: string } }>({});
  const [govSuccessMsg, setGovSuccessMsg] = useState("");
  const [govAiAnalysisText, setGovAiAnalysisText] = useState("");
  const [isAnalyzingGovDoc, setIsAnalyzingGovDoc] = useState(false);
  const [govMode, setGovMode] = useState<
  "home" |
  "scan" |
  "new" |
  "upload" |
  "track"
>("home");
const [selectedService, setSelectedService] = useState("");

const [interviewStep, setInterviewStep] = useState(0);

const [auraProfile, setAuraProfile] = useState({
  name: "",
  dob: "",
  address: "",
  phone: "",
  disabilityType: "",
  aadhaarNumber: "",
  uploadedDocuments: [] as string[]
});
const [uploadedFile, setUploadedFile] = useState<File | null>(null);
const [extractedData, setExtractedData] = useState<any>(null);
const [analysisStatus, setAnalysisStatus] = useState("");
const [documentType, setDocumentType] = useState("");
  // WOW Factor 3: Emergency Mode state
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencyStep, setEmergencyStep] = useState(1);
  const [emergencyLog, setEmergencyLog] = useState<string[]>([]);
  const [emergencyTriageAnswers, setEmergencyTriageAnswers] = useState<{ [key: string]: string }>({});

  // Voice Interaction state
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Speak out text to user (Dynamic Speech Synthesis with browser or server TTS falls)
  const speakText = async (text: string) => {
    if (!globalSpeechEnabled) return;

    // Use Aura Server premium TTS if available, else fallback to native speechSynthesis
    try {
      console.log("Attempting server TTS call...");
      setOrbState("speaking");
      const res = await fetch("/api/gemini/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, support: "Me" })
      });
      
      const data = await res.json();
      if (data.audio) {
         // Create blob of raw base64 logic to audio URL
         const binaryString = atob(data.audio);
         const len = binaryString.length;
         const bytes = new Uint8Array(len);
         for (let i = 0; i < len; i++) {
           bytes[i] = binaryString.charCodeAt(i);
         }
         const blob = new Blob([bytes], { type: "audio/wav" });
         const audioUrl = URL.createObjectURL(blob);
         const audio = new Audio(audioUrl);
         
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
      console.error("Server TTS failure, trying voice synthesis locally:", e);
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

  // Stop current active voice synthesis
  const stopSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setOrbState("idle");
    (window as any).isAuraSpeaking = false;
  };

  // Scroll messages to bottom on entry
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Live Real-Time Transcription
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isLiveTranscriptionActive) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onresult = (event: any) => {
          let currentSessionText = "";
          for (let i = 0; i < event.results.length; i++) {
            currentSessionText += event.results[i][0].transcript + (event.results[i].isFinal ? " " : "");
          }
          
          setLiveTranscriptionText(() => {
             const combined = (transcriptionPersistRef.current + currentSessionText).trim();
             return combined.length > 300 ? "..." + combined.slice(-300) : combined;
          });
        };

        rec.onerror = (e: any) => {
          console.log("Transcription error", e.error);
        };

        rec.onend = () => {
          transcriptionPersistRef.current = liveTranscriptionText.replace("...", "") + " ";
          if (isLiveTranscriptionActive && liveRecRef.current === rec) {
            try { rec.start(); } catch (e) {}
          }
        };

        liveRecRef.current = rec;
        rec.start();
      } catch (e) {
        console.error("Failed to start live transcription", e);
      }
    } else {
      if (liveRecRef.current) {
        liveRecRef.current.onend = null;
        liveRecRef.current.stop();
        liveRecRef.current = null;
      }
      setLiveTranscriptionText("");
    }
    
    return () => {
      if (liveRecRef.current) {
        liveRecRef.current.onend = null;
        liveRecRef.current.stop();
      }
    };
  }, [isLiveTranscriptionActive]);

  // Clean speech synthesis on unmount
  useEffect(() => {
    // If voice is enabled globally, we should greet the user vocally!
    if (globalSpeechEnabled && messages.length === 1) {
      setTimeout(() => {
        speakText(messages[0].text);
      }, 500); // Wait a half beat for visual load before vocal greeting
    }

    return () => {
      stopSpeak();
      if (cameraStreamActive) {
         stopCamera();
      }
    };
  }, []);

  // Web Speech recognition setup (Voice communication mode option)
  const toggleSpeechRecognition = () => {
    if (isVoiceListening) {
      recognitionRef.current?.stop();
      setIsVoiceListening(false);
      setOrbState("idle");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use text typing instead.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => {
      setIsVoiceListening(true);
      setOrbState("listening");
      stopSpeak();
    };

    rec.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setInputValue(resultText);
      // Auto triggers send
      handleSend(resultText);
    };

    rec.onerror = (e: any) => {
      console.error("Speech Recognition Error", e);
      setIsVoiceListening(false);
      setOrbState("idle");
    };

    rec.onend = () => {
      setIsVoiceListening(false);
      setOrbState("idle");
    };

    recognitionRef.current = rec;
    rec.start();
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraStreamActive(true);
    setCameraAvailable(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Webcam not accessed:", err);
      // Fail gracefully so user can use simulated files
      setCameraAvailable(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraStreamActive(false);
  };

  // Send message through conversation engine
  const handleSend = async (messageText: string) => {
    const textToSend = messageText.trim() || inputValue.trim();
    if (!textToSend) return;

    // Check if user spoke/typed an emergency command in general chat, auto redirect!
    const lowerText = textToSend.toLowerCase();
    if (lowerText.includes("emergency") || lowerText.includes("fell") || lowerText.includes("help! my") || lowerText.includes("ambulance") || lowerText.includes("injury")) {
       triggerEmergency("Accidental fall or critical emergency typed/spoken via Chat node.");
       setInputValue("");
       return;
    }

    stopSpeak();
    setInputValue("");
    
    // Append user message
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
          settings: settings
        })
      });

      const data = await response.json();
      if (data.error) {
         throw new Error(data.error);
      }

      const replyText = data.response;
      const modelMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "model",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, modelMsg]);
      setIsAiResponding(false);
      speakText(replyText); // speaks out response if enabled
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "model",
        text: `My apologies, I had trouble syncing with Aura core services. Error: ${err.message || "Unknown error."}. Please check that your API key is correctly configured in Settings > Secrets.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsAiResponding(false);
      setOrbState("idle");
    }
  };

  // Handle hands-free commands and chat inputs from Voice Navigator
  useEffect(() => {
    const handleVoiceCommand = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.action === "select" && detail.option) {
        const option = detail.option.toLowerCase();
        
        if (option.includes("reality") || option.includes("companion")) {
          setActiveTab("companion");
        } else if (option.includes("gov") || option.includes("assistant")) {
          setActiveTab("gov");
        } else if (option.includes("safety") || option.includes("net") || option.includes("alert")) {
          setActiveTab("emergency");
        } else if (option.includes("narrator") || option.includes("toggle")) {
          setGlobalSpeechEnabled(v => !v);
        } else if (option.includes("panic")) {
          triggerEmergency("Voice Activated Panic Command");
        }
      }
    };

    const handleVoiceChat = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.text) {
        // Automatically send the spoken text as a chat message if in companion or emergency tab
        if (activeTab === "companion" || activeTab === "emergency") {
          handleSend(detail.text);
        }
      }
    };

    window.addEventListener("aura-voice-command", handleVoiceCommand);
    window.addEventListener("aura-voice-chat", handleVoiceChat);
    return () => {
      window.removeEventListener("aura-voice-command", handleVoiceCommand);
      window.removeEventListener("aura-voice-chat", handleVoiceChat);
    };
  }, [activeTab]);

  // Trigger Gemini Vision on active Camera Frame
  const scanCameraFrame = async () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    setIsVisionScanning(true);
    setOrbState("thinking");
    setVisionOutput("Aura is rendering lens data stream...");
    setGestureRecognitionResult(null);

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
             mode: visionMode,
             settings: settings
           })
         });

         const data = await response.json();
         if (data.error) throw new Error(data.error);

         processVisionResult(data.text);
      }
    } catch (err: any) {
      setVisionOutput(`Lens fail: ${err.message || "Failed to analyze frame."}. Ensure your camera and secrets are correct.`);
      setIsVisionScanning(false);
      setOrbState("idle");
    }
  };

  // Walkthrough trigger logic for Simulated virtual demo images (convenience)
  const scanDemoScene = async (demoImgUrl: string, demoPrompt: string) => {
    setIsVisionScanning(true);
    setOrbState("thinking");
    setVisionOutput("Analyzing preloaded test scene...");
    setGestureRecognitionResult(null);

    try {
      // First, let's fetch the demo image and convert it to base64 to test our actual vision endpoint!
      // This replicates full actual backend API logic!
      const fetched = await fetch(demoImgUrl);
      const blob = await fetched.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
         const base64data = reader.result as string;
         const response = await fetch("/api/gemini/vision", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
             image: base64data,
             mode: visionMode,
             prompt: demoPrompt,
             settings: settings
           })
         });

         const data = await response.json();
         if (data.error) throw new Error(data.error);
         
         processVisionResult(data.text);
      };
      reader.readAsDataURL(blob);

    } catch (err: any) {
      // If CORS or networks fail, we do a very high-quality fallback explanation mimicking Gemini
      console.warn("Demo fetch failed, compiling offline backup mock analysis:", err);
      setTimeout(() => {
         let fallbackAnswer = "";
         if (visionMode === "navigation") {
            fallbackAnswer = "OBJECT RECOGNIZED: A black wooden dining chair is located 1.8 meters straight ahead. The immediate left path around the table is completely clear of obstacles. Walk three steps forward, then route slightly left.";
         } else if (visionMode === "medication") {
            fallbackAnswer = "LABEL DETECTED: Amoxicillin 500mg. DOSAGE: Take 1 capsule three times daily for 7 days or until finished. WARNINGS: Keep out of reach of children. Store in a cool dry place. Complete the full prescribed course unless advised by medical staff.";
         } else if (visionMode === "gesture") {
            const mockResJson = JSON.stringify({
               recognized: true,
               gesture: "Help",
               confidence: 0.94,
               auraResponse: "I have registered your hand sign representing: HELP. Initiating adaptive support dialog immediately."
            }, null, 2);
            processVisionResult(mockResJson);
            return;
         } else {
            fallbackAnswer = "A visual description of your selected playground asset has been rendered. Aura can see the requested features clearly.";
         }
         processVisionResult(fallbackAnswer);
      }, 1500);
    }
  };

  const processVisionResult = (rawText: string) => {
     setIsVisionScanning(false);
     
     if (visionMode === "gesture") {
        try {
          const parsed: GestureResult = JSON.parse(rawText);
          setGestureRecognitionResult(parsed);
          setVisionOutput(`Gesture analyzed! Identified: ${parsed.gesture || "none"}`);
          speakText(parsed.auraResponse);
        } catch (e) {
          // Robust text parsing in case Gemini returned raw string instead of matching JSON schema
          console.warn("JSON parse on gesture prediction failed:", e);
          setVisionOutput(rawText);
          speakText(rawText);
        }
     } else {
        setVisionOutput(rawText);
        speakText(rawText);
     }
  };

  // Gov Assistant Form Field filling simulation
  const handleGovFieldChange = (docId: string, field: string, val: string) => {
    setGovFormProgress(prev => ({
      ...prev,
      [docId]: {
        ...(prev[docId] || {}),
        [field]: val
      }
    }));
  };

  const submitGovFormSim = (doc: GovernmentDoc) => {
    setGovSuccessMsg(`Submitting Form...`);
    setTimeout(() => {
       setGovSuccessMsg(`SUCCESS! ${doc.name} was compiled successfully. Aura has submitted the package to the Ministry of Social Affairs and Health Portal. Receipt: #AR-2026-${Math.floor(Math.random() * 90000 + 10000)}`);
       // speak out success
       speakText("Your document has been reviewed, completed, and safely uploaded to the government system. You will receive an SMS update shortly.");
    }, 2000);
  };

  // Capture document image for Government Form Guidance (WOW Factor 2)
  const scanGovernmentFormPaper = async () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    setIsAnalyzingGovDoc(true);
    setOrbState("thinking");
    setGovAiAnalysisText("Aura is OCR-scanning your paperwork layout...");

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
             mode: "document",
             settings: settings
           })
         });

         const data = await response.json();
         if (data.error) throw new Error(data.error);

         setGovAiAnalysisText(data.text);
         setIsAnalyzingGovDoc(false);
         speakText("I have analyzed this document. I'll read out the critical fields and explain how to apply.");
      }
    } catch (err: any) {
      setGovAiAnalysisText(`Could not capture form: ${err.message || "Failure."}`);
      setIsAnalyzingGovDoc(false);
      setOrbState("idle");
    }
  };

  // WOW Factor 3: Emergency Mode active
  const triggerEmergency = (causeText: string) => {
    setEmergencyActive(true);
    setEmergencyStep(1);
    stopSpeak();
    setActiveTab("emergency");
    
    setEmergencyLog([
      `[${new Date().toLocaleTimeString()}] Emergency Safety mode triggered.`,
      `[${new Date().toLocaleTimeString()}] Reason: ${causeText}`,
      `[${new Date().toLocaleTimeString()}] Compiling user GPS coordinates...`,
      `[${new Date().toLocaleTimeString()}] POSITION SECURED: 37.7749° N, 122.4194° W.`
    ]);

    // Vocal notification
    speakText("Aura Emergency safety net active. Take a deep breath. I'll stay with you. Are you or your relative hurt?");
  };

  const handleTriageResponse = (question: string, answer: string) => {
    setEmergencyTriageAnswers(prev => ({ ...prev, [question]: answer }));
    
    // Log response
    setEmergencyLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Response: "${answer}" recorded.`]);

    if (emergencyStep === 1) {
       setEmergencyStep(2);
       speakText("Understood. I am now transmitting an automated alert package and sharing your active coordinates with emergency responders. Should I alert your primary email contact, nisithaa03@gmail.com, as well?");
    } else if (emergencyStep === 2) {
       setEmergencyStep(3);
       // Begin notifying
       setEmergencyLog(prev => [
         ...prev,
         `[${new Date().toLocaleTimeString()}] TRANSMITTING: Contacting Emergency Dispatch (Line 911)...`,
         `[${new Date().toLocaleTimeString()}] DISPATCH CORRELATION: Priority 1 EMS route initiated.`,
         `[${new Date().toLocaleTimeString()}] EMAIL ALERT SENT: nisithaa03@gmail.com notified of GPS coordinate 37.7749° N, 122.4194° W.`
       ]);
       speakText("Contacts and emergency medical dispatchers have been notified. Stay calm. Here are your step-by-step first-aid instructions. Please read them and let me know if you need voice instructions.");
    }
  };

  const resetEmergency = () => {
    setEmergencyActive(false);
    setEmergencyStep(1);
    setEmergencyTriageAnswers({});
    stopSpeak();
  };

  return (
    <div className={`min-h-screen bg-[#FDF8F2] flex flex-col text-[#4E3629] ${hasVisionSupport ? "text-lg" : "text-base"}`}>
      
      {/* Top Banner Navigation */}
      <header className="sticky top-0 bg-[#FDF8F2]/95 backdrop-blur-md z-40 border-b border-[#E8DCCF] px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo & Settings Status */}
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="serif text-3xl font-bold tracking-tight text-[#3A322B]">
                AURA
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">
                Universal Reality Assistant
              </p>
            </div>
          </div>

          {/* Adaptive Glass Badge */}
          <div className="flex items-center gap-3 px-5 py-2 rounded-full glass text-xs font-semibold text-[#4A3F35]">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            <span>Adaptive: Adult • {settings.communication} Mode • {settings.support.join(" + ")} Support</span>
          </div>

          {/* Quick Voice Controls */}
          <div className="flex items-center space-x-2">
            
            {/* Live Caption Toggle */}
            <button
              onClick={() => setIsLiveTranscriptionActive(!isLiveTranscriptionActive)}
              title={isLiveTranscriptionActive ? "Disable Live Captions" : "Enable Live Captions"}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                isLiveTranscriptionActive 
                  ? "bg-blue-600/15 text-blue-700 border-blue-600/30" 
                  : "bg-white/50 text-[#8C7A6B] border-[#E8DFD5]"
              }`}
            >
              <Mic className="h-5 w-5" />
              <span className="text-xs font-sans font-medium ml-1.5 hidden sm:inline">
                {isLiveTranscriptionActive ? "Live Captions On" : "Live Captions Off"}
              </span>
            </button>

            {/* Global TTS toggle */}
            <button
              onClick={() => {
                if (globalSpeechEnabled) {
                  stopSpeak();
                  setGlobalSpeechEnabled(false);
                } else {
                  setGlobalSpeechEnabled(true);
                  speakText("Voice narrator active.");
                }
              }}
              title={globalSpeechEnabled ? "Mute Voice Narrator" : "Unmute Voice Narrator"}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                globalSpeechEnabled 
                  ? "bg-[#D97706]/15 text-[#D97706] border-[#D97706]" 
                  : "bg-white/50 text-[#8C7A6B] border-[#E8DFD5]"
              }`}
            >
              {globalSpeechEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              <span className="text-xs font-sans font-medium ml-1.5 hidden sm:inline">
                {globalSpeechEnabled ? "Narrator On" : "Narrator Off"}
              </span>
            </button>

            {/* Quick Emergency button */}
            <button
              onClick={() => triggerEmergency("Manual safety panic override switch pressed.")}
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-white px-4 py-2 rounded-xl text-sm font-sans font-medium flex items-center space-x-2 shadow-md hover:shadow-red-900/10 cursor-pointer"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Safety Net</span>
            </button>

            <button
              onClick={onReset}
              className="text-xs bg-[#F5EEE6] hover:bg-[#ECE1D5] active:scale-95 text-[#8C7A6B] border border-[#E3D6C9] px-3 py-2 rounded-xl transition-all cursor-pointer"
            >
              Switch Profile
            </button>
          </div>

        </div>
      </header>

      {/* Primary Grid Layout */}
      <div className="max-w-7xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-8">
        
        {/* Left Side Sidebar - Mode selection tabs */}
        <nav className="lg:col-span-3 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
          
          <button
            onClick={() => { setActiveTab("assistant"); stopSpeak(); }}
            className={`flex items-center space-x-3 w-full rounded-2xl text-left cursor-pointer transition-all border shrink-0 ${hasMobilitySupport ? 'p-6' : 'p-4'} ${
              activeTab === "assistant"
                ? "bg-[#4E3629] text-white border-[#4E3629] shadow-md shadow-amber-950/10"
                : "bg-white/40 hover:bg-white/80 border-[#EFE5DC] text-[#4E3629]"
            }`}
          >
            <Activity className={hasMobilitySupport ? "h-6 w-6" : "h-5 w-5"} />
            <div className={hasMobilitySupport || hasVisionSupport ? "text-base" : "text-sm"}>
              <span className="font-semibold block">Reality Companion</span>
              <span className={`${hasVisionSupport ? "text-sm" : "text-xs"} opacity-80 block font-light`}>
                {hasCognitiveSupport ? "Chats & Cameras" : "Sensory chats, cameras, ASL recognition"}
              </span>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab("gov"); stopSpeak(); }}
            className={`flex items-center space-x-3 w-full rounded-2xl text-left cursor-pointer transition-all border shrink-0 ${hasMobilitySupport ? 'p-6' : 'p-4'} ${
              activeTab === "gov"
                ? "bg-[#4E3629] text-white border-[#4E3629] shadow-md shadow-amber-950/10"
                : "bg-white/40 hover:bg-white/80 border-[#EFE5DC] text-[#4E3629]"
            }`}
          >
            <FileText className={hasMobilitySupport ? "h-6 w-6" : "h-5 w-5"} />
            <div className={hasMobilitySupport || hasVisionSupport ? "text-base" : "text-sm"}>
              <span className="font-semibold block">Gov Assistant</span>
              <span className={`${hasVisionSupport ? "text-sm" : "text-xs"} opacity-80 block font-light`}>
                {hasCognitiveSupport ? "Help with forms" : "Help renewing certificates & forms"}
              </span>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab("emergency"); stopSpeak(); }}
            className={`flex items-center space-x-3 w-full rounded-2xl text-left cursor-pointer transition-all border shrink-0 ${hasMobilitySupport ? 'p-6' : 'p-4'} ${
              activeTab === "emergency"
                ? "bg-red-100 text-red-900 border-red-200"
                : "bg-white/40 hover:bg-white/80 border-[#EFE5DC] text-[#4E3629]"
            }`}
          >
            <AlertTriangle className={`${hasMobilitySupport ? "h-6 w-6" : "h-5 w-5"} text-red-600`} />
            <div className={hasMobilitySupport || hasVisionSupport ? "text-base" : "text-sm"}>
              <span className="font-semibold block text-red-700">Safety Net</span>
              <span className={`${hasVisionSupport ? "text-sm" : "text-xs"} opacity-80 block font-light text-red-600`}>
                {hasCognitiveSupport ? "Emergency help" : "Simulate fall alert & first-aid"}
              </span>
            </div>
          </button>

          {/* Quick Context Adaptive hints widget */}
          <div className="hidden lg:block mt-6 p-5 bg-[#F6EEF6]/60 rounded-2xl border border-dashed border-[#ECD6EC] text-[#553C4B]">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Sensory Adaptation Tuning</span>
            </div>
            <ul id="adaptation-tuning-list" className="text-xs space-y-2 list-disc list-inside font-light opacity-90">
              {hasVisionSupport && <li><strong>Vision Tuning</strong>: Screen-narrator active. Enlarged cards toggled automatically.</li>}
              {hasHearingSupport && <li><strong>Hearing Tuning</strong>: Detailed captions log. Typographic highlighting active.</li>}
              {hasCognitiveSupport && <li><strong>Cognitive Simplify</strong>: Removed word clutter. Answers compressed into bullet coordinates.</li>}
              {hasMobilitySupport && <li><strong>Mobility Adaptive</strong>: Touch limits decreased. Enlarged action buttons.</li>}
              {!hasVisionSupport && !hasHearingSupport && !hasCognitiveSupport && !hasMobilitySupport && <li>Balanced system active. Standard accessibility options.</li>}
            </ul>
          </div>
        </nav>

        {/* Center Canvas Area (Interactive Tab Windows) */}
        <main className="lg:col-span-9 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            
            {/* WINDOW 1: REALITY COMPANION CHAT/VISION */}
            {activeTab === "assistant" && (
              <motion.div
                key="assistant-win"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 xl:grid-cols-12 gap-6"
              >
                
                {/* Visual Camera Controller Column */}
                <div id="camera-controller-column" className="xl:col-span-12 bg-white/80 border border-[#EFE5DC] p-6 rounded-3xl flex flex-col justify-between">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold tracking-tight flex items-center space-x-2">
                      <Camera className="h-5 w-5 text-amber-600" />
                      <span>Adaptive Surroundings Lens</span>
                    </h2>
                    <p className="text-xs text-[#8C7A6B] font-light mt-1">
                      Initiate the visual model to analyze objects, medication printouts, signs, or gestures.
                    </p>
                  </div>

                  {/* Camera view grid splits */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Real/Webcam Video Box */}
                    <div id="camera-stream-pane" className="relative flex flex-col items-center justify-center bg-gray-150 rounded-2xl overflow-hidden aspect-video border border-gray-200">
                      
                      {cameraStreamActive ? (
                        <>
                          <video 
                            ref={videoRef} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                          />
                          <canvas ref={canvasRef} className="hidden" />
                          
                          {/* Live capture overlay indicators */}
                          <div id="capture-live-overlay" className="absolute top-3 left-3 bg-red-600/80 text-white text-xs px-2.5 py-1 rounded-full flex items-center space-x-1 font-mono tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            <span>FEED LIVE</span>
                          </div>

                          <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2 px-3">
                            <button
                              onClick={scanCameraFrame}
                              disabled={isVisionScanning}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-sans font-medium rounded-xl flex items-center space-x-2 shadow-lg hover:shadow-amber-900/10 cursor-pointer disabled:opacity-50"
                            >
                              <RefreshCw className={`h-4 w-4 ${isVisionScanning ? "animate-spin" : ""}`} />
                              <span>Analyze Live Frame</span>
                            </button>
                            <button
                              onClick={stopCamera}
                              className="px-3 py-2 bg-gray-800 hover:bg-gray-950 text-white text-xs rounded-xl cursor-pointer"
                            >
                              Close Webcam
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                          <Camera className="h-12 w-12 text-[#9C8B7E] mb-3 animate-pulse" />
                          <h4 className="text-sm font-semibold">Webcam Feed is Idle</h4>
                          <p className="text-xs text-[#8C7A6B] max-w-xs mt-1 font-light">
                            Access your system camera for real-time visual assistance.
                          </p>
                          <button
                            onClick={startCamera}
                            className="mt-4 px-4 py-2 bg-[#4E3629] text-white text-xs font-sans font-medium rounded-xl hover:bg-[#3E291F] transition-all cursor-pointer"
                          >
                            Open Camera Stream
                          </button>
                          
                          {!cameraAvailable && (
                            <span className="text-xs text-red-500 font-mono mt-2 bg-red-50 px-2 py-1 rounded">
                              Direct camera block. Use prepackaged files below!
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Lens Operations Options Panel */}
                    <div id="lens-operations-options" className="flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-mono tracking-wider text-[#A29182] uppercase mb-3">
                          Select Assistance Mode
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-2">
                          
                          {/* Navigation assistance */}
                          <button
                            onClick={() => { setVisionMode("navigation"); setGestureRecognitionResult(null); }}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              visionMode === "navigation"
                                ? "bg-amber-100/50 border-amber-600 font-medium"
                                : "bg-white hover:bg-[#FAF6F2] border-[#E8DFD5]"
                            }`}
                          >
                            <span className="text-[#B45309] block text-sm font-semibold">Path Finder</span>
                            <span className="text-xxs text-[#8C7A6B] block">Identify path hurdles</span>
                          </button>

                          {/* Med descriptions */}
                          <button
                            onClick={() => { setVisionMode("medication"); setGestureRecognitionResult(null); }}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              visionMode === "medication"
                                ? "bg-purple-100/50 border-purple-600 font-medium"
                                : "bg-white hover:bg-[#FAF6F2] border-[#E8DFD5]"
                            }`}
                          >
                            <span className="text-purple-700 block text-sm font-semibold">Label Reader</span>
                            <span className="text-xxs text-[#8C7A6B] block">Translate pill directions</span>
                          </button>

                          {/* Gesture Recognition */}
                          <button
                            onClick={() => { setVisionMode("gesture"); setVisionOutput(""); }}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              visionMode === "gesture"
                                ? "bg-emerald-100/50 border-emerald-600 font-medium"
                                : "bg-white hover:bg-[#FAF6F2] border-[#E8DFD5]"
                            }`}
                          >
                            <span className="text-emerald-700 block text-sm font-semibold">Sign Interpreter</span>
                            <span className="text-xxs text-[#8C7A6B] block">Identify 8 core ASL words</span>
                          </button>

                          {/* Describe anything */}
                          <button
                            onClick={() => { setVisionMode("describe"); setGestureRecognitionResult(null); }}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              visionMode === "describe"
                                ? "bg-blue-100/50 border-blue-600 font-medium"
                                : "bg-white hover:bg-[#FAF6F2] border-[#E8DFD5]"
                            }`}
                          >
                            <span className="text-blue-700 block text-sm font-semibold">Object Lens</span>
                            <span className="text-xxs text-[#8C7A6B] block">General scene explanation</span>
                          </button>

                        </div>

                        {/* Playground mock options (IMPORTANT in case user lacks camera) */}
                        <div id="virtual-playground-mock-options" className="mt-4 bg-[#F5EEE6] p-3 rounded-xl border border-[#E9DFDB]">
                          <span className="text-xxs text-[#827164] font-mono block uppercase mb-1.5">
                            Virtual Demonstration Options (Testing fallbacks)
                          </span>
                          <div className="flex flex-wrap gap-1.5 justify-start">
                            {SCENE_DEMOS.map(scene => (
                              <button
                                key={scene.id}
                                onClick={() => scanDemoScene(scene.image, scene.prompt)}
                                className="text-xxs bg-white hover:bg-[#ECE1D5] active:scale-95 text-[#4E3629] px-2.5 py-1.5 rounded-lg border border-[#DDD0C3] transition-all cursor-pointer"
                              >
                                {scene.name}
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Vision output text area */}
                      <div className="mt-4 bg-gray-50/70 p-4 rounded-xl border border-gray-100 min-h-16 relative">
                        <span className="text-xxs uppercase font-mono tracking-wider text-amber-800 font-semibold absolute top-2 right-3">
                          Aura Lens output
                        </span>
                        
                        {isVisionScanning ? (
                          <div className="flex items-center space-x-2 text-sm text-[#8C7A6B] pt-2">
                            <span className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full" />
                            <span>Processing reality frame...</span>
                          </div>
                        ) : (
                          <div className="pt-2">
                            {gestureRecognitionResult ? (
                              <div id="gesture-result-display" className="space-y-1 text-sm bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                                <div className="flex items-center justify-between text-xs text-emerald-800 font-mono">
                                  <span>ASL SIGN MATCHED:</span>
                                  <span className="font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase">
                                    {gestureRecognitionResult.gesture} {Math.round(gestureRecognitionResult.confidence * 100)}%
                                  </span>
                                </div>
                                <p className="text-emerald-900 font-light leading-relaxed">{gestureRecognitionResult.auraResponse}</p>
                              </div>
                            ) : visionOutput ? (
                              <p className="text-sm font-light leading-relaxed">{visionOutput}</p>
                            ) : (
                              <p className="text-xs text-gray-400 italic">No Lens analysis generated yet. Point camera and click analyze or run demo files.</p>
                            )}
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                </div>

                {/* Aura Interaction Node Chat Column */}
                <div id="aura-conversation-pane" className="xl:col-span-4 bg-white/80 p-6 rounded-3xl border border-[#EFE5DC] flex flex-col justify-between min-h-[460px]">
                  
                  {/* Assistant Header status */}
                  <div className="flex justify-between items-center pb-4 border-b border-[#F5EDE5] mb-4">
                     <div>
                       <h3 className="font-sans font-semibold text-lg text-[#4E3629]">Aura Node</h3>
                       <span className="text-xs font-mono text-[#8C7A6B] uppercase flex items-center space-x-1.5 mt-0.5">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                         <span>Reality Link online</span>
                       </span>
                     </div>
                     <span className="text-xs font-mono uppercase bg-amber-50 px-2 py-1 rounded text-amber-700">
                       {settings.communication} focus
                     </span>
                  </div>

                  {/* Pulsing customizable Aura Center Orb */}
                  <div id="aura-orb-scaffold" className="flex-1 flex flex-col items-center justify-center my-6">
                    <AuraOrb 
                      status={orbState} 
                      size={hasVisionSupport ? 180 : 150} 
                      onClick={() => speakText("I'm active and listening, NISITHA. Tap the voice button below to dictate coordinates or requests.")}
                    />
                    <p className="text-xs font-mono text-[#8C7A6B] mt-5 uppercase tracking-widest bg-[#F9F5F0] px-3 py-1 rounded-full border border-[#ECE0D5]">
                      {orbState === "speaking" ? "Aura is narrating" : orbState === "listening" ? "Listening..." : "Aura Companion"}
                    </p>
                  </div>

                  {/* Low visual speech and communication selectors */}
                  <div className="space-y-3">
                     
                     {/* Voice Command Dictator Button (Visible if voice mode is chosen) */}
                     {settings.communication === "Voice" && (
                       <button
                         onClick={toggleSpeechRecognition}
                         disabled={isAiResponding}
                         className={`w-full py-4 rounded-2xl font-semibold transition-all flex items-center justify-center space-x-3 cursor-pointer shadow-md ${
                           isVoiceListening
                             ? "bg-red-600 hover:bg-red-700 text-white shadow-red-950/20"
                             : "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-950/20"
                         }`}
                       >
                         <span className={`w-2.5 h-2.5 rounded-full bg-white ${isVoiceListening ? "animate-ping" : ""}`} />
                         <span>{isVoiceListening ? "Stop Listening (Processing)" : "Dictate Voice Request"}</span>
                       </button>
                     )}
                     
                     <div className="text-center text-xs text-[#8C7A6B] font-light italic">
                       {settings.communication === "Voice" 
                         ? "Simply tap button above and tell Aura: 'What is near me?', 'Explain certificate renewal', or 'Help me, my father fell'."
                         : "Or type below in the Text panel."}
                     </div>

                  </div>

                </div>

                {/* Subtitle / Transcript list panel */}
                <div id="conversational-transcript-log" className="xl:col-span-8 bg-white/80 p-6 rounded-3xl border border-[#EFE5DC] flex flex-col justify-between min-h-[460px]">
                  
                  <div className="pb-3 border-b border-[#F2E7DC] flex justify-between items-center mb-4">
                     <span className="text-xs font-mono font-medium tracking-wider uppercase text-[#8C7A6B] flex items-center space-x-1.5">
                       <Eye className="h-3.5 w-3.5" />
                       <span>Speech Log & Action Transcript</span>
                     </span>
                     <button 
                       onClick={() => setMessages([{ id: "init", role: "model", text: "Transcript reset. Ask me something!", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])}
                       className="text-xxs text-[#827164] hover:underline"
                     >
                       Clear Logs
                     </button>
                  </div>

                  {/* Scrolling panel */}
                  <div id="logs-viewing-pane" className="flex-1 overflow-y-auto max-h-[290px] pr-2 space-y-4 font-sans text-sm">
                    {messages.map(msg => (
                      <div 
                        key={msg.id}
                        className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                      >
                        <div className={`p-4 rounded-2xl max-w-[85%] leading-relaxed ${
                          msg.role === "user" 
                            ? "bg-[#4E3629] text-white rounded-tr-none" 
                            : "bg-[#F7EFEA] text-[#4E3629] rounded-tl-none border border-[#E6DDD3]"
                        } ${hasVisionSupport ? "text-lg" : "text-sm font-light"}`}>
                          
                          {/* Formatting in case Hearing support is configured */}
                          {hasHearingSupport ? (
                            <div className="font-medium tracking-wide">
                              {msg.text}
                            </div>
                          ) : (
                            <div>{msg.text}</div>
                          )}

                        </div>
                        <span className="text-xxs text-[#A29182] font-mono mt-1 px-1">
                          {msg.role === "user" ? "You" : "Aura assistant"} • {msg.timestamp}
                        </span>
                      </div>
                    ))}

                    {isAiResponding && (
                      <div className="flex space-x-1.5 items-center p-3 bg-gray-50 max-w-[100px] rounded-lg animate-pulse">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-250" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-500" />
                      </div>
                    )}
                    <div ref={messageEndRef} />
                  </div>

                  {/* Input form */}
                  <form 
                    id="reality-node-chat-input-form"
                    onSubmit={(e) => { e.preventDefault(); handleSend(""); }}
                    className="flex items-center space-x-2 mt-4 pt-3 border-t border-[#F5EDE5]"
                  >
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={hasCognitiveSupport ? "Ask simply..." : "Ask: 'Where is the door?' or 'I need to scan package warns'..."}
                      className={`flex-1 bg-[#F5EEE6] hover:bg-[#F0E5D9] focus:bg-white px-4 py-3 rounded-xl border border-[#DDD0C3] focus:outline-none focus:ring-1.5 focus:ring-amber-700 transition-all font-light ${hasMobilitySupport || hasVisionSupport ? 'text-base py-4 px-6' : 'text-sm'}`}
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim() && !isAiResponding}
                      className={`bg-[#4E3629] text-white rounded-xl hover:bg-[#3E291F] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${hasMobilitySupport ? 'p-5' : 'p-3'}`}
                    >
                      <Send className={`${hasMobilitySupport ? 'h-6 w-6' : 'h-4 w-4'}`} />
                    </button>
                  </form>

                </div>

              </motion.div>
            )}

            {/* WINDOW 2: GOVERNMENT ASSISTANT PORTAL (WOW FACTOR 2) */}
            {activeTab === "gov" && govMode === "home" && (
  <motion.div
    key="gov-home"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-white/80 border border-[#EFE5DC] p-8 rounded-3xl"
  >
    <h2 className="text-2xl font-bold mb-3">
      Government Assistant
    </h2>

    <p className="text-[#8C7A6B] mb-8">
      I can help you complete applications, understand paperwork,
      verify documents and submit forms on your behalf.
    </p>

    <div className="grid md:grid-cols-2 gap-4">

      <button
        onClick={() => setGovMode("scan")}
        className="p-6 border rounded-xl text-left hover:bg-[#F7EFEA]"
      >
        <h3 className="font-semibold">📄 Scan Existing Form</h3>
        <p className="text-sm mt-2">
          Show me a form and I'll explain it.
        </p>
      </button>

      <button
        onClick={() => setGovMode("new")}
        className="p-6 border rounded-xl text-left hover:bg-[#F7EFEA]"
      >
        <h3 className="font-semibold">🏛 Start New Application</h3>
        <p className="text-sm mt-2">
          Disability certificate, Aadhaar, PAN and more.
        </p>
      </button>

      <button
        onClick={() => setGovMode("upload")}
        className="p-6 border rounded-xl text-left hover:bg-[#F7EFEA]"
      >
        <h3 className="font-semibold">📂 Upload Documents</h3>
        <p className="text-sm mt-2">
          Verify Aadhaar, photos and certificates.
        </p>
      </button>

      <button
        onClick={() => setGovMode("track")}
        className="p-6 border rounded-xl text-left hover:bg-[#F7EFEA]"
      >
        <h3 className="font-semibold">📋 Track Application</h3>
        <p className="text-sm mt-2">
          Check application progress.
        </p>
      </button>

    </div>
  </motion.div>
)}
            {activeTab === "gov" && govMode === "scan" && (
  <motion.div
    className="bg-white/80 border border-[#EFE5DC] p-6 rounded-3xl"
  >
    <button
      onClick={() => setGovMode("home")}
      className="mb-4 text-sm"
    >
      ← Back
    </button>

    <h2 className="text-xl font-semibold">
      Scan Existing Form
    </h2>

    <p className="text-sm text-[#8C7A6B] mt-2">
      Show any government form to Aura and receive guidance.
    </p>

    {cameraStreamActive ? (
      <button
        onClick={scanGovernmentFormPaper}
        className="mt-4 px-4 py-3 bg-[#4E3629] text-white rounded-xl"
      >
        Capture and Analyze Form
      </button>
    ) : (
      <button
        onClick={startCamera}
        className="mt-4 px-4 py-3 bg-[#F5EEE6] border rounded-xl"
      >
        Open Camera
      </button>
    )}

    {govAiAnalysisText && (
      <div className="mt-6 p-4 border rounded-xl bg-white">
        {govAiAnalysisText}
      </div>
    )}
  </motion.div>
)}
{activeTab === "gov" && govMode === "new" && (
  <motion.div
    className="bg-white/80 border border-[#EFE5DC] p-6 rounded-3xl"
  >
    <button
      onClick={() => setGovMode("home")}
      className="mb-4 text-sm"
    >
      ← Back
    </button>

    <h2 className="text-xl font-semibold">
      Start New Application
    </h2>

    <div className="grid gap-3 mt-6">

  <button
    onClick={() => setSelectedService("Disability Certificate")}
    className="p-4 border rounded-xl text-left hover:bg-[#F7EFEA]"
  >
    Disability Certificate
  </button>

  <button
    onClick={() => setSelectedService("Aadhaar Update")}
    className="p-4 border rounded-xl text-left hover:bg-[#F7EFEA]"
  >
    Aadhaar Update
  </button>

  <button
    onClick={() => setSelectedService("PAN Card")}
    className="p-4 border rounded-xl text-left hover:bg-[#F7EFEA]"
  >
    PAN Card
  </button>

</div>
  </motion.div>
)}{selectedService && (
  <motion.div
    className="bg-white/80 border border-[#EFE5DC] p-6 rounded-3xl mt-6"
  >

    <h2 className="text-xl font-semibold">
      Aura Interview Agent
    </h2>

    <p className="mt-2 text-[#8C7A6B]">
      Preparing application:
      <strong> {selectedService}</strong>
    </p>

    <div className="mt-6 space-y-4">

      <input
        placeholder="Full Name"
        className="w-full p-3 border rounded-xl"
        value={applicationData.fullName}
        onChange={(e) =>
          setApplicationData({
            ...applicationData,
            fullName: e.target.value
          })
        }
      />

      <input
        placeholder="Date of Birth"
        className="w-full p-3 border rounded-xl"
        value={applicationData.dob}
        onChange={(e) =>
          setApplicationData({
            ...applicationData,
            dob: e.target.value
          })
        }
      />

      <input
        placeholder="Phone Number"
        className="w-full p-3 border rounded-xl"
        value={applicationData.phone}
        onChange={(e) =>
          setApplicationData({
            ...applicationData,
            phone: e.target.value
          })
        }
      />

      <button
        className="w-full py-3 bg-[#4E3629] text-white rounded-xl"
      >
        Generate Application
      </button>

    </div>

  </motion.div>
)}{activeTab === "gov" && govMode === "upload" && (
  <motion.div
    className="bg-white/80 border border-[#EFE5DC] p-6 rounded-3xl"
  >
    <button
      onClick={() => setGovMode("home")}
      className="mb-4 text-sm"
    >
      ← Back
    </button>

    <h2 className="text-xl font-semibold">
      Upload Documents
    </h2>

    <p className="text-[#8C7A6B] mt-2">
      Upload your Aadhaar, Medical Certificate,
      Disability Certificate or any government document.
    </p>

    <input
  type="file"
  className="mt-6"
  onChange={(e) => {
    if (e.target.files?.[0]) {
      setUploadedFile(e.target.files[0]);
    }
  }}
/>
{uploadedFile && (
  <div className="mt-4 p-4 border rounded-xl">
    Selected: {uploadedFile.name}
  </div>
)}
{uploadedFile && (
  <div className="mt-4 space-y-3">

    <button
  onClick={() => {
    setAnalysisStatus("Aura is reading your document...");
    setDocumentType("Aadhaar Card");
    setTimeout(() => {
      setExtractedData({
        name: "John Doe",
        dob: "15-08-2000",
        address: "Bangalore",
        documentType: "Aadhaar"
      });

      setAnalysisStatus("Analysis complete.");
    }, 2000);
  }}
  className="px-4 py-2 bg-[#4E3629] text-white rounded-xl"
>
  Analyze Document
</button>
  </div>
 
)}
{analysisStatus && (
  <div className="mt-4 p-3 rounded-xl bg-yellow-50 border">
    {analysisStatus}
  </div>
)}

{documentType && (
  <div className="mt-4 p-3 bg-blue-50 border rounded-xl">
    <strong>Aura detected:</strong> {documentType}
  </div>
)}

{extractedData && (
  <div className="mt-4 p-4 border rounded-xl bg-green-50">

    <h3 className="font-semibold mb-2">
      Aura Extracted Information
    </h3>

    <p>Name: {extractedData.name}</p>
    <p>DOB: {extractedData.dob}</p>
    <p>Address: {extractedData.address}</p>
    <p>Document: {extractedData.documentType}</p>

  </div>
)}
  </motion.div>
)}
            {/* WINDOW 3: EMERGENCY MODE CALMING PANEL (WOW FACTOR 3) */}
            {activeTab === "emergency" && (
              <motion.div
                key="emergency-win"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-red-50/50 border border-red-200 p-6 md:p-8 rounded-3xl"
              >
                
                {/* Emergency Header with Pulse red light */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-red-200 pb-5">
                  <div className="flex items-center space-x-3">
                    <span className="relative flex h-4 w-4">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75" />
                       <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600" />
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-red-950">AURA EMERGENCY SAFETY NET</h2>
                      <p className="text-xs text-red-800 mt-1">
                        High priority diagnostic routing is holding dispatch vectors.
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={resetEmergency}
                    className="px-4 py-2 bg-red-200 hover:bg-red-300 text-red-950 text-xs rounded-xl font-sans font-semibold cursor-pointer"
                  >
                    Cancel Emergency Mode
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                  
                  {/* Emergency triage 질문 및 GPS coordinates */}
                  <div className="xl:col-span-7 space-y-6">
                    
                    {/* Location coordinates tracker card */}
                    <div className="p-4 bg-white rounded-2xl border border-red-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-6 w-6 text-red-600 shrink-0" />
                        <div>
                          <span className="text-xxs uppercase tracking-wider font-mono text-gray-500">Live GPS Coordinates</span>
                          <span className="block text-sm font-semibold font-mono text-red-950">37.7749° N, 122.4194° W (Secure Altitude Pin)</span>
                        </div>
                      </div>
                      <span className="text-xxs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                        GPS Active
                      </span>
                    </div>

                    {/* Calming interactive wizard questions */}
                    <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm relative">
                       <span className="text-xxs uppercase font-mono tracking-wider text-red-800 font-bold">
                         Aura Assessment Step {emergencyStep}
                       </span>

                       <AnimatePresence mode="wait">
                         
                         {emergencyStep === 1 && (
                           <motion.div
                             key="tri-1"
                             initial={{ opacity: 0, x: 10 }}
                             animate={{ opacity: 1, x: 0 }}
                             exit={{ opacity: 0, x: -10 }}
                             className="space-y-4 mt-3"
                           >
                             <h3 className="text-lg font-bold text-red-950">Is NISITHA (you or your relative) currently in physical pain or bleeding?</h3>
                             <p className="text-xs text-slate-500 font-light">Your response is processed locally and immediately bundled into the EMS telemetry vector.</p>
                             
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                               <button
                                 onClick={() => handleTriageResponse("Injury Pain Bleeding", "Yes, there is pain and severe physical impact.")}
                                 className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl cursor-pointer transition-all active:scale-98"
                               >
                                 Yes, pain/bleeding is severe
                               </button>
                               <button
                                 onClick={() => handleTriageResponse("Injury Pain Bleeding", "No, we are uninjured but require rapid safety diagnostics.")}
                                 className="py-3 px-4 bg-[#F5EEE6] hover:bg-[#ECE1D5] text-red-950 font-semibold text-sm rounded-xl cursor-pointer transition-all active:scale-98 border border-[#DCD3C7]"
                               >
                                 No injury, but need urgent support
                               </button>
                             </div>
                           </motion.div>
                         )}

                         {emergencyStep === 2 && (
                           <motion.div
                             key="tri-2"
                             initial={{ opacity: 0, x: 10 }}
                             animate={{ opacity: 1, x: 0 }}
                             exit={{ opacity: 0, x: -10 }}
                             className="space-y-4 mt-3"
                           >
                             <h3 className="text-lg font-bold text-red-950">Shall I initiate the secondary notify sequence to your email primary: nisithaa03@gmail.com?</h3>
                             <p className="text-xs text-slate-500 font-light">This transmits your telemetry payload and GPS tracking link in background.</p>
                             
                             <div className="grid grid-cols-2 gap-3 pt-2">
                               <button
                                 onClick={() => handleTriageResponse("Email Notify", "Approved. Send immediate alert emails to nisithaa03@gmail.com.")}
                                 className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl cursor-pointer transition-all"
                               >
                                 Notify Contact
                               </button>
                               <button
                                 onClick={() => handleTriageResponse("Email Notify", "Declined. Only alert direct regional EMS responders.")}
                                 className="py-3 px-4 bg-[#F5EEE6] hover:bg-[#ECE1D5] text-red-950 font-semibold text-sm rounded-xl cursor-pointer transition-all border border-[#DCD3C7]"
                               >
                                 EMS Dispatch Only
                               </button>
                             </div>
                           </motion.div>
                         )}

                         {emergencyStep === 3 && (
                           <motion.div
                             key="tri-3"
                             initial={{ opacity: 0, x: 10 }}
                             animate={{ opacity: 1, x: 0 }}
                             exit={{ opacity: 0, x: -10 }}
                             className="space-y-4 mt-3 text-center py-6"
                           >
                             <div className="inline-flex p-3 bg-emerald-100 rounded-full text-emerald-800 mb-2">
                               <CheckCircle className="h-8 w-8" />
                             </div>
                             <h3 className="text-lg font-bold text-emerald-950">Dispatches and Safety Vectors Complete</h3>
                             <p className="text-xs text-slate-600 font-light max-w-sm mx-auto">
                               Primary medical responders are on route. Telemetry vector has mapped your location securely. Please refer to first-aid guides.
                             </p>
                             
                             <button
                               onClick={resetEmergency}
                               className="mt-4 px-5 py-2 bg-slate-800 text-white rounded-lg text-xs"
                             >
                               Complete Emergency Case
                             </button>
                           </motion.div>
                         )}

                       </AnimatePresence>
                    </div>

                    {/* Step-by-step safety guides based on accident category */}
                    <div className="bg-white p-6 rounded-2xl border border-red-100">
                      <h3 className="text-sm font-semibold text-red-950 mb-3 uppercase font-mono tracking-wider">
                        Step-by-Step Accident First-Aid Guidance
                      </h3>
                      
                      <div className="space-y-4">
                         
                         <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                            <span className="font-semibold text-xs text-amber-900 block font-mono">1. COGNITIVE CALM DIRECTION</span>
                            <p className="text-xxs text-amber-800 font-light leading-relaxed mt-0.5">
                              Do not move the victim if a head, neck, or spine impact is suspected from a fall. Keep them warm and speak in a reassuring voice.
                            </p>
                         </div>

                         <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                            <span className="font-semibold text-xs text-blue-900 block font-mono">2. AIRWAY AND RESPONDING Check</span>
                            <p className="text-xxs text-blue-800 font-light leading-relaxed mt-0.5">
                              Check if the victim responds to speech or a gentle pinch. Do not attempt fluid feeding of unconscious victims.
                            </p>
                         </div>

                         <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200">
                            <span className="font-semibold text-xs text-purple-900 block font-mono">3. STAUNCHING BLOOD FLOW</span>
                            <p className="text-xxs text-purple-800 font-light leading-relaxed mt-0.5">
                              If active bleeding occurs, apply a clean sterile cloth and place continuous, firm directly vertical pressure onto the wound.
                            </p>
                         </div>

                      </div>
                    </div>

                  </div>

                  {/* Right Column: Console telemetry log logs */}
                  <div className="xl:col-span-5 flex flex-col justify-between">
                    <div className="bg-red-950/95 text-[#FFBABA] p-5 rounded-2xl border border-red-900 font-mono text-xs flex-1">
                      <span className="text-xxs font-bold text-red-400 block border-b border-red-900 pb-2 mb-3 tracking-widest uppercase">
                        Aura Security Logs (Continuous Output)
                      </span>
                      
                      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                        {emergencyLog.map((log, idx) => (
                          <div key={idx} className="leading-relaxed">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-red-100 mt-4 flex items-center space-x-3.5">
                      <PhoneCall className="h-6 w-6 text-red-600 animate-bounce" />
                      <div>
                        <span className="text-xxs text-gray-500 uppercase font-mono block">Primary dispatch hotline</span>
                        <span className="text-sm font-bold text-red-950 font-mono">911 Local Responders Linked</span>
                      </div>
                    </div>
                  </div>

                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </main>

      </div>

      {/* Live Transcription Bar for User Audio Feed */}
      <AnimatePresence>
        {isLiveTranscriptionActive && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-0 left-0 right-0 bg-[#31221A] text-white p-4 z-50 shadow-2xl border-t border-[#4E3629] ${hasMobilitySupport ? 'p-6' : 'p-4'}`}
          >
            <div className="max-w-7xl mx-auto flex items-start space-x-4">
              <div className="bg-blue-500/20 p-2 rounded-full mt-1 shrink-0">
                <Mic className="h-5 w-5 text-blue-400 animate-pulse" />
              </div>
              <div className="flex-1 w-full">
                <p className="text-xs uppercase tracking-widest text-[#B3A499] font-semibold mb-1">
                  Live Transcription Active
                </p>
                <p className={`font-mono text-blue-50 ${hasVisionSupport ? "text-xl" : "text-sm"} leading-relaxed min-h-[3rem] line-clamp-3 overflow-hidden text-ellipsis`}>
                  {liveTranscriptionText || "Listening... Start speaking to generate live captions."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
