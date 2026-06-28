# 🌟 AURA – AI Reality Companion for Accessible Living

> **Empowering people with disabilities through Multimodal AI and Intelligent Automation.**

AURA is an AI-powered accessibility companion that helps people with disabilities navigate the physical and digital world independently. By combining multimodal AI, computer vision, document intelligence, and UiPath automation, AURA understands the user's environment, simplifies complex government processes, automates paperwork, and provides personalized assistance through a single accessible platform.

---

## 🎯 Problem Statement

Millions of people with disabilities struggle with everyday digital and physical interactions.

Some common challenges include:

* Understanding complex government paperwork
* Filling lengthy application forms
* Accessing disability benefits and schemes
* Navigating unfamiliar environments
* Reading printed documents
* Managing emergency situations independently

Current AI assistants answer questions, but very few actually complete real-world tasks on behalf of the user.

AURA bridges this gap by acting as an intelligent accessibility companion.

---

## ✨ Key Features

### 🌍 Reality Companion

* Real-time scene understanding
* Object and obstacle detection
* Environmental awareness
* Voice-guided assistance

---

### 📄 Government Assistant

* Scan physical government forms
* Upload official documents
* Explain complex paperwork in simple language
* Auto-fill applications
* Eligibility recommendations
* Track submitted applications

---

### 📑 Intelligent Document Understanding

Supports:

* Aadhaar Card
* Disability Certificate
* Medical Certificate
* PAN Card
* Government Letters
* Passport Photos

Aura automatically extracts important information and stores it securely for future applications.

---

### 🧠 Aura Profile Vault

Stores verified user information securely so users never need to repeatedly upload the same documents or enter the same information.

---

### 🤖 UiPath Intelligent Automation

Aura automates repetitive government processes including:

* Portal navigation
* Form filling
* Document upload
* Application submission
* Receipt generation
* Status tracking

---

### 🚨 Emergency Assistance

Designed to help users quickly request assistance during emergencies through accessible interaction methods.
---

# 🏗️ System Architecture

```text
                  User
                    │
                    ▼
        ┌─────────────────────┐
        │   React Frontend    │
        └─────────────────────┘
                    │
                    ▼
          Aura Intelligence Layer
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
 Reality AI   Document AI   Government AI
      │             │             │
      └─────────────┼─────────────┘
                    ▼
            Gemini AI Models
                    │
                    ▼
          Aura Profile Vault
                    │
          Eligibility Engine
                    │
                    ▼
          UiPath Automation
                    │
                    ▼
        Government Portals
```

---

# 🛠️ Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Artificial Intelligence

* Gemini API
* Gemini Vision
* OCR
* Prompt Engineering

### Intelligent Automation

* UiPath Studio
* UiPath Agent Builder
* UiPath Maestro
* UiPath API Workflows
* UiPath Automation Cloud

### Backend

* Node.js
* Express
* REST APIs

---

# 🤖 UiPath Components Used

This project leverages multiple UiPath capabilities:

* UiPath Studio
* Agent Builder
* Maestro
* API Workflows
* Intelligent Document Automation
* Browser Automation
* Form Automation

---

# 🧠 Agent Type

**Hybrid AI Agent**

This solution combines:

* ✅ Low-Code UiPath Agents
* ✅ AI-powered Gemini Agents

to provide intelligent decision-making together with end-to-end process automation.
---

# 🔄 How AURA Works

## 1️⃣ User Interaction

The user interacts with Aura using voice, text, camera, or document upload depending on their accessibility needs.

↓

## 2️⃣ AI Understanding

Gemini analyzes the user's request to determine their intent.

Examples:

* "I need a disability certificate."
* "Read this government letter."
* "Help me apply for a scholarship."

Aura dynamically decides the next steps instead of relying on hardcoded workflows.

↓

## 3️⃣ Document Intelligence

When documents are uploaded or scanned, Aura:

* Detects the document type
* Extracts important fields
* Explains difficult terminology
* Verifies missing information

↓

## 4️⃣ Aura Profile Vault

Extracted information is securely stored inside the Aura Profile.

This enables users to reuse verified information across future applications without repeatedly uploading documents.

↓

## 5️⃣ Eligibility Engine

Aura evaluates the user's profile against available government schemes and recommends services they may qualify for.

Examples:

* Disability Certificate
* Scholarship Programs
* Travel Concessions
* Assistive Device Schemes

↓

## 6️⃣ Intelligent Automation

Once the user confirms the application, UiPath automates the entire submission process by:

* Navigating government portals
* Filling application forms
* Uploading supporting documents
* Submitting applications
* Downloading receipts
* Tracking application status

↓

## 7️⃣ Continuous Assistance

Aura continues assisting after submission by:

* Tracking application progress
* Explaining government responses
* Sending reminders
* Recommending additional services
* Providing ongoing accessibility support
---

# 🚀 Installation & Setup

## Prerequisites

Before running AURA, ensure you have:

* Node.js (v18 or later)
* npm
* A Gemini API Key
* UiPath Studio (for automation workflows)

---

## Clone the Repository

```bash
git clone https://github.com/nisithaa-03/AURA-.git
cd AURA-
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Environment Variables

Create a `.env.local` file in the project root.

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

---

## Run the Application

```bash
npm run dev
```

The application will be available locally at:

```
http://localhost:5173
```

---

# 📂 Project Structure

```
AURA/
│
├── src/
│   ├── components/
│   ├── lib/
│   └── App.tsx
│
├── server.ts
├── package.json
├── public/
├── docs/
│
└── README.md
```

---

# 🔮 Future Scope

We envision AURA evolving into a comprehensive AI accessibility ecosystem by introducing:

* Real-time navigation assistance
* Offline accessibility support
* Regional language support
* Live government portal integrations
* Smart wearable integration
* Secure cloud-based Aura Profile
* AI-powered accessibility recommendations
* Healthcare and hospital integrations
* Smart home accessibility controls
* Multi-agent collaboration using UiPath

---

# 👥 Contributors

**Nisithaa**

Built for **UiPath AgentHack 2026**

---

# ❤️ Acknowledgements

We would like to thank UiPath for organizing AgentHack and providing an opportunity to build AI-powered automation solutions that create meaningful real-world impact.

Our goal with AURA is to demonstrate how multimodal AI and intelligent automation can empower people with disabilities to live with greater independence, dignity, and confidence.
