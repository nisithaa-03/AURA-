import { motion } from "motion/react";

interface AuraOrbProps {
  status: "idle" | "listening" | "thinking" | "speaking";
  isChild?: boolean;
  onClick?: () => void;
  size?: number; // width/height in px
}

export default function AuraOrb({ status, isChild = false, onClick, size = 180 }: AuraOrbProps) {
  // Determine gradient colors based on profile
  // Adult Aura: Warm Amber / Soft Gold (#F59E0B, #D97706)
  // Child Aura: Playful Sky / Pastel Pink / Mint gradient (#38BDF8, #F472B6, #34D399)
  const gradientId = isChild ? "childGrad" : "adultGrad";

  // Sizing variances based on status
  const getScale = () => {
    switch (status) {
      case "listening":
        return [1.0, 1.12, 1.0];
      case "thinking":
        return [1.05, 0.95, 1.05];
      case "speaking":
        return [1.0, 1.15, 0.95, 1.08, 1.0];
      case "idle":
      default:
        return [1.0, 1.04, 1.0];
    }
  };

  // Pulse durations based on state
  const getDuration = () => {
    switch (status) {
      case "listening":
        return 1.4;
      case "thinking":
        return 0.8;
      case "speaking":
        return 1.1;
      case "idle":
      default:
        return 3.0; // Slow calm respiration
    }
  };

  return (
    <div 
      className="relative flex items-center justify-center cursor-pointer select-none"
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      {/* Background Outer Glow Layer 1 */}
      <motion.div
        className="absolute rounded-full filter blur-xl opacity-40 mix-blend-multiply"
        style={{
          width: size * 1.3,
          height: size * 1.3,
          background: isChild 
            ? "radial-gradient(circle, rgba(167,139,250,0.5) 0%, rgba(244,114,182,0.5) 100%)"
            : "radial-gradient(circle, rgba(253,186,116,0.4) 0%, rgba(224,146,103,0.15) 100%)"
        }}
        animate={{
          scale: status === "speaking" ? [1, 1.25, 0.95, 1.15, 1] : [1, 1.08, 1],
          opacity: status === "listening" ? [0.4, 0.7, 0.4] : status === "thinking" ? [0.4, 0.6, 0.4] : 0.4
        }}
        transition={{
          duration: getDuration(),
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Background Outer Glow Layer 2 (Contrasting Accent and Pulse) */}
      <motion.div
        className="absolute rounded-full filter blur-2xl opacity-30"
        style={{
          width: size * 1.5,
          height: size * 1.5,
          background: isChild 
            ? "radial-gradient(circle, rgba(56,189,248,0.4) 0%, rgba(52,211,153,0.3) 100%)"
            : "radial-gradient(circle, rgba(251,191,36,0.20) 0%, rgba(253,186,116,0.1) 100%)"
        }}
        animate={{
          scale: status === "speaking" ? [0.95, 1.18, 1.0] : [1, 1.05, 1],
        }}
        transition={{
          duration: 4.0,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Main Interactive Orb Body */}
      <motion.div
        className="relative rounded-full shadow-2xl flex items-center justify-center p-1 border border-white/20"
        style={{
          width: size,
          height: size,
        }}
        animate={{
          scale: getScale(),
          rotate: status === "thinking" ? 360 : status === "speaking" ? [0, 5, -5, 3, 0] : 0
        }}
        transition={{
          scale: {
            duration: getDuration(),
            repeat: Infinity,
            ease: "easeInOut"
          },
          rotate: {
            duration: status === "thinking" ? 4.0 : 10.0,
            repeat: Infinity,
            ease: status === "thinking" ? "linear" : "easeInOut"
          }
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full rounded-full"
        >
          <defs>
            {/* Adult Glow (Pale Faded Orange / Natural Peach) */}
            <radialGradient id="adultGrad" cx="45%" cy="40%" r="55%" fx="35%" fy="30%">
              <stop offset="0%" stopColor="#FFFDFB" />
              <stop offset="35%" stopColor="#FFEDD5" />
              <stop offset="75%" stopColor="#FED7AA" />
              <stop offset="100%" stopColor="#E49E7C" />
            </radialGradient>

            {/* Child Glow (Soft Playful Sweet Pastel Rainbow) */}
            <radialGradient id="childGrad" cx="42%" cy="38%" r="55%" fx="30%" fy="28%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="30%" stopColor="#BAE6FD" />
              <stop offset="65%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#818CF8" />
            </radialGradient>
            
            {/* Liquid wave distortion filter to make the orb feel organic */}
            <filter id="liquidGlow">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>

          {/* Interactive Liquid Surface */}
          <circle 
            cx="50" 
            cy="50" 
            r="46" 
            fill={`url(#${gradientId})`} 
            filter={status !== "idle" ? "url(#liquidGlow)" : undefined}
          />

          {/* Internal Shimmer Accent */}
          <circle cx="45" cy="42" r="30" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="3 1" opacity="0.3" />
          <circle cx="50" cy="50" r="41" fill="none" stroke="white" strokeWidth="1.5" opacity="0.15" />
          <circle cx="34" cy="30" r="8" fill="white" opacity="0.4" filter="blur(1px)" />
        </svg>

        {/* Floating status dots overlapping the core */}
        {status === "listening" && (
          <span className="absolute flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-white/40"></span>
          </span>
        )}
      </motion.div>

      {/* Floating Interactive Labels for Screenreaders */}
      <span className="sr-only">Aura Assistant Orb — State: {status}</span>
    </div>
  );
}
