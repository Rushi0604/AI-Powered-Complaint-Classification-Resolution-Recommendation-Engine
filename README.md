# ⚡ Clear Flow — AI-Powered Complaint Classification & Resolution Recommendation Engine

> Resolve customer complaints **10x faster** with the power of AI — intelligent classification, priority scoring, fraud detection, and actionable recommendations in real-time.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [User Roles](#user-roles)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Screenshots](#screenshots)

---

## 🧠 Overview

**Clear Flow** is a full-stack AI web application that automates the end-to-end lifecycle of customer complaint management. It leverages a Groq LLM (Llama 3.3) with a rule-based fallback engine to:

- **Classify** complaints into categories (Delivery, Product Defect, Payment, etc.)
- **Prioritize** them as High / Medium / Low based on urgency scoring
- **Detect** suspicious or fraudulent complaints before they enter the pipeline
- **Recommend** actionable resolutions to support agents
- **Track** complaint history and status in real-time

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 AI Classification | LLM-powered complaint categorization using Groq (Llama 3.3) |
| 🔴 Priority Engine | Scores complaints as High / Medium / Low based on sentiment & keywords |
| 🛡️ Fraud Detection | Detects spam, manipulation, and fake complaints automatically |
| ✅ Resolution Recommendations | AI suggests top 3 actionable steps per complaint |
| 📋 Warranty Validation | Blocks complaints outside the product warranty window |
| 📊 Owner Dashboard | Real-time charts, priority queue, filters, search & AI analysis modal |
| 👤 Customer Profile | Owner can view full complaint history per customer |
| 🔐 Dual-Role Auth | Auto-detects Business Owner via `@owner.in` email domain |
| 📝 Complaint History | Customers can track all their past complaints and status |
| 👁️ Password Toggle | Show/hide password with eye button on login/signup |

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** (App Router) — React framework
- **TypeScript** — Type safety
- **Tailwind CSS 4** — Styling
- **Recharts** — Charts and analytics
- **Lucide React** — Icons

### Backend
- **Python + Flask** — REST API server
- **Flask-CORS** — Cross-origin support

### AI / ML
- **Groq API (Llama 3.3)** — LLM for complaint analysis
- **Rule-based Fallback Engine** — `analyzer.py`, `priority.py`, `fake_detector.py`, `recommender.py`

### Database & Auth
- **Supabase (PostgreSQL)** — Cloud database
- **Custom Auth** — localStorage session with `User_data` and `owner` tables (no Supabase Auth)

---

## 📁 Project Structure

```
├── backend/               # Flask API server
│   ├── app.py             # Main Flask app & /analyze endpoint
│   ├── analyzer.py        # Rule-based complaint categorizer
│   ├── priority.py        # Priority scoring engine
│   ├── fake_detector.py   # Fraud / fake complaint detection
│   ├── recommender.py     # Resolution recommendation engine
│   └── test.py            # API test script
│
├── api/                   # LLM service layer
│   └── app/
│       └── services/
│           ├── llm.py     # Groq LLM integration
│           └── prompts.py # LLM prompt templates
│
└── web/                   # Next.js frontend
    ├── app/
    │   ├── page.tsx        # Landing page + Auth modal
    │   ├── dashboard/      # Owner & Customer dashboard
    │   ├── submit/         # Complaint submission form
    │   └── history/        # Complaint history page
    ├── components/
    │   ├── AuthGuard.tsx   # Route protection
    │   └── Sidebar.tsx     # Navigation sidebar
    └── lib/
        ├── supabase.ts     # Supabase client
        └── roles.ts        # Role detection utility
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- A Supabase project
- A Groq API key

### 1. Clone the repository
```bash
git clone https://github.com/Rushi0604/AI-Powered-Complaint-Classification-Resolution-Recommendation-Engine.git
cd AI-Powered-Complaint-Classification-Resolution-Recommendation-Engine
```

### 2. Start the Backend (Flask)
```bash
cd backend
pip install flask flask-cors requests
python app.py
```
> Flask server runs on `http://127.0.0.1:5001`

### 3. Start the Frontend (Next.js)
```bash
cd web
npm install
npm run dev
```
> App runs on `http://localhost:3000`

---

## 🔑 Environment Variables

Create a `.env.local` file inside the `web/` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create a `.env` file inside the `api/` directory:

```env
GROQ_API_KEY=your_groq_api_key
```

---

## 👥 User Roles

| Role | How to identify | Access |
|---|---|---|
| **Customer** | Any regular email (e.g. `user@gmail.com`) | Submit complaints, view own history |
| **Business Owner** | Email ending in `@owner.in` (e.g. `admin@owner.in`) | Full dashboard, AI analysis, all complaints |

> No manual role selection needed — the system auto-detects based on email domain.

---

## 📡 API Endpoints

### `POST /analyze`
Analyzes a complaint using the AI engine.

**Request:**
```json
{
  "complaint": "The package arrived late and the product was broken."
}
```

**Response:**
```json
{
  "category": "Delivery Issue",
  "priority": "High",
  "status": "Valid",
  "reason": ["Severe damage to product", "Urgent language used"],
  "actions": ["Process refund immediately", "Offer compensation"]
}
```

---

## 🗄️ Database Schema

### `Complain_Data`
| Column | Type | Description |
|---|---|---|
| `complaint_id` | int | Unique complaint ID |
| `email` | text | Customer email |
| `product_type` | text | Type of product |
| `date` | timestamp | Submission timestamp |
| `category` | text | Complaint category |
| `problems` | text | Complaint type selected |
| `description` | text | Optional description |
| `priority` | text | High / Medium / Low |
| `resolve_status` | text | submitted / resolved |
| `ip_address` | text | Customer IP |

### `User_data`
| Column | Type |
|---|---|
| `email` | text (PK) |
| `password` | text |
| `user_name` | text |

### `owner`
| Column | Type |
|---|---|
| `email` | text (PK) |
| `password` | text |
| `owner_name` | text |

---

## 📸 Screenshots

> Dashboard with AI Priority Queue, Charts, Search & Filters
> Complaint Submission Form with Warranty Validation
> AI Intelligence Analysis Modal
> Customer Profile View

---

## 👨‍💻 Authors

Built as a final year college project by **Team Clear Flow**.

---

## 📄 License

This project is for academic purposes only.
