export const getAuraVoice = (voices: SpeechSynthesisVoice[]) => {
  return voices.find(v => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Natural"))) || voices.find(v => v.lang.startsWith("en"));
};

export const applyAuraVoiceConfigs = (utterance: SpeechSynthesisUtterance) => {
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  if ('speechSynthesis' in window) {
    const voices = window.speechSynthesis.getVoices();
    const auraVoice = getAuraVoice(voices);
    if (auraVoice) {
      utterance.voice = auraVoice;
    }
  }
};
