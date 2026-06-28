import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();
console.log("Gemini Key Loaded:", !!process.env.GEMINI_API_KEY);
console.log("KEY EXISTS:", !!process.env.GEMINI_API_KEY);
console.log("KEY STARTS WITH:", process.env.GEMINI_API_KEY?.slice(0, 8));
console.log("KEY PREFIX:", process.env.GEMINI_API_KEY?.slice(0, 12));
// Initialize the GoogleGenAI instance with telemetry headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
const PORT = 3000;

// Set body limit higher for receiving webcam base64 screenshots
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// --- API Endpoints ---

// 1. Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. Chat endpoint (Supports Adaptive System Instructions & Child Mode)
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history, settings } = req.body;
    if (!message) {
       res.status(400).json({ error: "Message is required." });
       return;
    }

    const currentSettings = settings || { profile: "Me", communication: "Text", support: "none" };

    // Formulate a robust system instruction based on Adaptation settings and core personality guidelines
    let systemInstruction = `You are Aura, an adaptive accessibility companion designed to help people with diverse needs navigate daily life, digital services, learning, and safety.

Your primary responsibility is not to chat. Your primary responsibility is to understand the user, adapt to them, and take appropriate actions.

# User Context
Profile: ${currentSettings.profile || "Adult"}
Communication mode: ${currentSettings.communication || "Text"}
Support needs: ${Array.isArray(currentSettings.support) ? currentSettings.support.join(", ") : (currentSettings.support || "none")}

CORE PRINCIPLES

1. Adapt First, Assist Second
- Continuously adapt to the user's profile, communication preferences, and accessibility needs.
- Change your behavior based on who the user is.

2. User Profiles
Adult User:
- Use professional, concise language.
- Focus on independence, accessibility, productivity, forms, government services, and real-world assistance.

Child User:
- Use simpler language.
- Be encouraging and playful.
- Focus on learning, exploration, stories, and safety.
- Avoid complex government or legal explanations.

3. Communication Modes
VOICE MODE: Listen for spoken responses. Accept natural language. Confirm important actions verbally.
TEXT MODE: Use concise readable text. Prioritize captions and written instructions.
SIGN MODE: Assume gesture recognition input is converted into text intents. Respond visually and clearly.

4. Accessibility Adaptation
VISION SUPPORT: Prioritize voice interaction. Read information aloud. Provide environmental descriptions. Use camera-based assistance when available.
HEARING SUPPORT: Prioritize text. Avoid depending on speech output. Provide captions and visual confirmations.
MOBILITY SUPPORT: Minimize required interaction. Support hands-free workflows. Use voice navigation whenever possible.
COGNITIVE SUPPORT: Use short sentences. Break tasks into small steps. Ask one question at a time.

5. Voice Navigation
When the user provides a voice answer:
- Profile Selection: "me", "myself", "for me" -> select Adult User. "child", "kid", "my son", "my daughter" -> select Child User
- Communication Selection: "voice" -> select Voice Mode. "text" -> select Text Mode. "sign" or "sign language" -> select Sign Mode
- Support Selection: "vision", "blind", "can't see" -> Vision Support. "hearing", "deaf", "hard of hearing" -> Hearing Support. "mobility", "movement" -> Mobility Support. "speech" -> Speech Support. "cognitive" -> Cognitive Support.
Always confirm the detected selection.

6. Reality Companion
When camera information is available:
- Describe surroundings clearly. Identify important objects. Answer navigation questions.
Examples: "Where is the door?" -> "The door is approximately two meters ahead and slightly to your right."

7. Government Assistant
Help users:
- Understand forms. Renew disability certificates. Apply for schemes. Understand requirements. Complete applications step-by-step.
Never invent legal information. If uncertain, clearly say so.

8. Safety Net
If the user expresses distress, confusion, emergency situations, provide calm guidance.
For emergencies: Ask for location. Identify immediate danger. Suggest contacting local emergency services.

9. Child Environment
Offer Stories, Learning, Exploration, Games, Safe educational content. Maintain a positive and encouraging tone.

10. Conversation Behavior
Always: Listen first. Understand intent. Adapt. Confirm actions. Guide users step-by-step.
Never overwhelm the user with unnecessary information.

Aura's purpose is to make technology, services, and environments accessible, understandable, and actionable for every user.`;

    // Prepare contents list from history
    // history formats: Array<{ role: 'user' | 'model', text: string }>
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
       for (const item of history) {
          contents.push({
             role: item.role === "user" ? "user" : "model",
             parts: [{ text: item.text }]
          });
       }
    }
    contents.push({
       role: "user",
       parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
         systemInstruction: systemInstruction,
         temperature: 0.7,
      }
    });

    res.json({ response: response.text });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ error: error.message || "An error occurred with the AI service." });
  }
});

// 3. Vision-based Scene, Obstacle, Medication Label, Document, and Gesture Analysis Code
app.post("/api/gemini/vision", async (req, res) => {
  try {
    const { image, prompt, mode, settings } = req.body;
    console.log("VISION REQUEST RECEIVED");
    console.log("MODE:", mode);
    console.log("IMAGE LENGTH:", image?.length);
    if (!image) {
       res.status(400).json({ error: "Base64 image is required." });
       return;
    }

    // Parse the image data URL
    const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    let mimeType = "image/jpeg";
    let base64Data = image;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data
      }
    };

    let finalPrompt = prompt || "Describe what is in front of me.";
    let responseSchema: any = undefined;
    let responseMimeType: string | undefined = undefined;

    // Adapt vision analyzing based on Mode
    if (mode === "navigation") {
       finalPrompt = `
You are Aura Reality Companion.

You are an assistive navigation companion for users who need help understanding and navigating their surroundings.

Your primary goal is NOT to describe the image.

Your primary goal is to help the user navigate safely.

Priority order:

1. Doors and exits
2. Obstacles and hazards
3. Clear walking paths
4. Furniture
5. People
6. Important objects
7. General scene description

Navigation Rules:

- Give directional guidance whenever possible.
- Use words like:
  ahead
  left
  right
  slightly left
  slightly right
  behind
  nearby
  directly in front

- If a door is visible:
  Explain where it is.

- If a path is visible:
  Explain whether it is clear.

- If obstacles exist:
  Warn the user immediately.

- If text is visible:
  Mention it briefly.

Response Style:

- Speak as Aura.
- Be concise.
- Be confident.
- Be helpful.

Never say:
"Based on the image"
"It appears"
"I think"
"The image shows"

Instead say:
"I can see..."
"There is..."
"The path ahead is clear..."
"A door is visible..."

Keep responses under 80 words.

User Request:
${prompt || "Describe my surroundings"}
`;
    } else if (mode === "document") {
       finalPrompt = "You are an expert government form assistant. Examine this uploaded document/form. Identify what form this is, extract the key visible information fields, list critical fields the user must fill, and give step-by-step guidance on how they should approach completing this paperwork. Keep your tone highly reassuring, simple, and step-by-step.";
    } else if (mode === "medication") {
       finalPrompt = "You are a professional medical product and medication assistant. Read the visible labels in this image carefully. Extract: 1. Medication Name, 2. Key dosage instructions / directions, 3. Critical safety warnings or expiry warnings if visible. If the label is blurry, give a friendly notice and list the readable portions.";
    } else if (mode === "gesture") {
       // Wow Factor 5: Sign language / gesture recognition
       finalPrompt = `You are an expert American Sign Language / general gesture assistant. 
       Look closely at the person's hand(s) and posture in this frame. 
       Analyze if they are gesturing or signing one of these 8 specific concepts:
       - Help
       - Yes
       - No
       - Stop
       - Emergency
       - Water
       - Food
       - Home
       
       Verify if their gesture corresponds to any of these. If yes, identify it and write a short, warm, supportive accessibility response. 
       You MUST return your answer in standard JSON format matching this schema:
       {
         "recognized": boolean,
         "gesture": "Help" | "Yes" | "No" | "Stop" | "Emergency" | "Water" | "Food" | "Home" | null,
         "confidence": number (between 0.0 and 1.0),
         "auraResponse": "A supportive sentence from Aura"
       }`;
       
       responseMimeType = "application/json";
       responseSchema = {
          type: Type.OBJECT,
          properties: {
             recognized: { type: Type.BOOLEAN, description: "Whether one of the target gestures was successfully identified" },
             gesture: { type: Type.STRING, description: "The name of the recognized gesture, or null" },
             confidence: { type: Type.NUMBER, description: "A confidence value between 0.0 and 1.0" },
             auraResponse: { type: Type.STRING, description: "The assistant's spoken or textual response to the gesture" }
          },
          required: ["recognized", "gesture", "confidence", "auraResponse"]
       };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, { text: finalPrompt }],
      config: {
         responseMimeType: responseMimeType,
         responseSchema: responseSchema,
         temperature: mode === "gesture" ? 0.2 : 0.4
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Vision Error:", error);
    res.status(500).json({ error: error.message || "An error occurred with visual analysis." });
  }
});

// 4. Text-To-Speech (TTS) Endpoint
app.post("/api/gemini/tts", async (req, res) => {
  try {
    const { text, support } = req.body;
    if (!text) {
       res.status(400).json({ error: "Text is required to speak." });
       return;
    }

    // Select suitable voice (Zephyr is modern/softer/clear)
    let voiceName = "Zephyr"; 

    console.log(`Generating TTS with voice: ${voiceName} for text: "${text.substring(0, 50)}..."`);
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say naturally, clearly, and warmly: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audio: base64Audio });
    } else {
      res.status(500).json({ error: "No audio generated from the speech service." });
    }
  } catch (error: any) {
    console.error("Gemini TTS Error:", error);
    res.status(500).json({ error: error.message || "An error occurred generating voice synthesis." });
  }
});
// 5. Voice Navigation Engine Endpoint
app.post("/api/gemini/voice-navigate", async (req, res) => {
  try {
    const { screen, options, transcript } = req.body;
    if (!screen || !options || !transcript) {
       res.status(400).json({ error: "screen, options, and transcript are required." });
       return;
    }


    const systemPrompt = `You are Aura's Voice Navigation Engine.
Your purpose is to help users interact with the application hands-free.
You do not simply transcribe speech.
You listen to the user's words, determine their intent, and select the correct option representing what they want to click on the current screen.

You MUST analyze the user's spoken transcript, the current screen name, and the available options, and return a JSON object conforming to the schema.

Rules:
1. Understand what option the user intends to select.
2. Match their speech to the closest valid option.
3. Return the selected option.
4. If confidence is low, return action: "clarify".
5. Never select an option that is not visible on the current screen.
6. Match synonyms and natural language (e.g. 'me', 'myself', 'it is for me' -> 'Me'; 'child', 'kid', 'playroom' -> 'A Child'; 'voice', 'speak', 'spoken' -> 'Voice'; 'type', 'text', 'keyboard' -> 'Text'; 'sign', 'gesture', 'camera' -> 'Sign Language'; 'blind', 'vision', 'low vision' -> 'Vision'; 'wheelchair', 'hands free', 'movement' -> 'Mobility'; 'hearing', 'deaf', 'audio issues' -> 'Hearing').`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Screen: "${screen}"\nAvailable Options: ${JSON.stringify(options)}\nUser Transcript: "${transcript}"`
        }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: ["select", "clarify"], description: "The action decision" },
            option: { type: Type.STRING, description: "The matched option value EXACTLY as spelled in the input array" }
          },
          required: ["action"]
        },
        temperature: 0.1
      }
    });

    const result = JSON.parse(response.text.trim());
    console.log("Voice Navigation Match Output:", result);
    res.json(result);
  } catch (error: any) {
    console.error("Voice Navigation Error:", error);
    res.status(500).json({ error: error.message || "An error occurred with voice navigation analysis." });
  }
});


// --- Express Static Asset Delivery & Vite Middleware ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring development environment...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Configuring production environment...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Aura Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
