import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AdaptationSettings, ProfileType } from "./types";
import SplashScreen from "./components/SplashScreen";
import ProfileSelection from "./components/ProfileSelection";
import AdultOnboarding from "./components/AdultOnboarding";
import AdultDashboard from "./components/AdultDashboard";
import ChildDashboard from "./components/ChildDashboard";
import VoiceNavigator from "./components/VoiceNavigator";

type GlobalAppState = 
  | "splash"
  | "profile_select"
  | "adult_onboarding"
  | "adult_dashboard"
  | "child_dashboard";

export default function App() {
  const [appState, setAppState] = useState<GlobalAppState>("splash");
  const [onboardingStep, setOnboardingStep] = useState<"communication" | "support">("communication");
  const [settings, setSettings] = useState<AdaptationSettings>({
    profile: null,
    communication: "Text",
    support: ["none"]
  });

  // Handle splash completion
  const handleSplashComplete = () => {
    setAppState("profile_select");
  };

  // Handle profile selection
  const handleProfileSelect = (profile: ProfileType) => {
    if (profile === "Me") {
      setSettings(prev => ({ ...prev, profile: "Me" }));
      setAppState("adult_onboarding");
    } else if (profile === "A Child") {
      setSettings(prev => ({ ...prev, profile: "A Child" }));
      setAppState("child_dashboard");
    }
  };

  // Handle Adult Onboarding completion
  const handleAdultOnboardingComplete = (completedSettings: AdaptationSettings) => {
    setSettings(completedSettings);
    setAppState("adult_dashboard");
  };

  // Reset helper
  const handleReset = () => {
    setAppState("profile_select");
    setSettings({
      profile: null,
      communication: "Text",
      support: ["none"]
    });
    setOnboardingStep("communication");
  };

  // Determine current screen and available vocal navigation options for Voice Navigation Engine
  let currentScreenName = "Welcome Screen";
  let voiceOptions: string[] = [];

  if (appState === "profile_select") {
    currentScreenName = "Profile Selection";
    voiceOptions = ["Me", "A Child"];
  } else if (appState === "adult_onboarding") {
    if (onboardingStep === "communication") {
      currentScreenName = "Communication Selection";
      voiceOptions = ["Voice", "Text", "Sign Language", "Next Step"];
    } else {
      currentScreenName = "Support Selection";
      voiceOptions = ["Vision", "Hearing", "Speech", "Mobility", "Cognitive", "Multiple", "Standard/Normal", "Back to Modality", "Enter Aura Companion"];
    }
  } else if (appState === "adult_dashboard") {
    currentScreenName = "Adult Dashboard";
    voiceOptions = ["Reality Companion", "Gov Assistant", "Safety Net", "Narrator Toggle", "Panic Alert"];
  } else if (appState === "child_dashboard") {
    currentScreenName = "Aura Playroom";
    voiceOptions = ["Talk to Aura", "Curious Facts", "Magic Tales", "Animal Riddles", "Secret Lens"];
  }

  return (
    <div id="app-root-scaffold" className="min-h-screen bg-[#FDF8F2] font-sans antialiased overflow-x-hidden selection:bg-[#E5AA70]/30 selection:text-[#4E3629]">
      <AnimatePresence mode="wait">
        
        {/* State 1: SPLASH INTRO */}
        {appState === "splash" && (
          <motion.div
            key="splash-screen-wrapper"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SplashScreen onComplete={handleSplashComplete} />
          </motion.div>
        )}

        {/* State 2: PROFILE SELECT */}
        {appState === "profile_select" && (
          <motion.div
            key="profile-selection-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ProfileSelection onSelect={handleProfileSelect} />
          </motion.div>
        )}

        {/* State 3: ADULT ONBOARDING ADAPTATIONS */}
        {appState === "adult_onboarding" && (
          <motion.div
            key="adult-onboarding-wrapper"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AdultOnboarding 
              onComplete={handleAdultOnboardingComplete}
              onBack={() => setAppState("profile_select")}
              onStepChange={setOnboardingStep}
            />
          </motion.div>
        )}

        {/* State 4: ADULT COMPANION DASHBOARD */}
        {appState === "adult_dashboard" && (
          <motion.div
            key="adult-dashboard-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AdultDashboard 
              settings={settings}
              onReset={handleReset}
            />
          </motion.div>
        )}

        {/* State 5: CHILD PLAYROOM DASHBOARD */}
        {appState === "child_dashboard" && (
          <motion.div
            key="child-dashboard-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ChildDashboard 
              onReset={handleReset}
            />
          </motion.div>
        )}

      </AnimatePresence>
      {appState !== "splash" && (
        <VoiceNavigator currentScreen={currentScreenName} options={voiceOptions} />
      )}
    </div>
  );
}
