export type ProfileType = "Me" | "A Child" | null;

export type CommunicationMode = "Voice" | "Text" | "Sign Language";

export type SupportType = 
  | "Vision" 
  | "Hearing" 
  | "Speech" 
  | "Mobility" 
  | "Cognitive" 
  | "Multiple" 
  | "Prefer not to say"
  | "none";

export interface AdaptationSettings {
  profile: ProfileType;
  communication: CommunicationMode;
  support: SupportType[]; 
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  audio?: string; // Optional base64 audio string for speech output
}

export interface GestureResult {
  recognized: boolean;
  gesture: "Help" | "Yes" | "No" | "Stop" | "Emergency" | "Water" | "Food" | "Home" | null;
  confidence: number;
  auraResponse: string;
}

export interface GovernmentDoc {
  id: string;
  name: string;
  description: string;
  category: "Certificate" | "Scheme" | "Benefit" | "Scholarship";
  formFields: { field: string; placeholder: string; guidance: string }[];
}
