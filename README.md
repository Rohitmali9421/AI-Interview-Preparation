# 🎯 AI Interviewer System

A full-stack AI-powered interview practice platform built with the MERN stack. Practice technical and HR interviews with an intelligent virtual interviewer that asks questions, evaluates your answers, and provides detailed feedback.

## ✨ Features

- **AI-Powered Questions** — Dynamic question generation via Google Gemini API
- **Real-time Evaluation** — Instant scoring and feedback on every answer
- **Voice I/O** — Speech-to-Text input + Text-to-Speech question reading
- **Any Domain/Role** — Marketing, Finance, Sales, Nursing, Teaching, Tech, etc.
- **3 Difficulty Levels** — Easy, Medium, Hard
- **Analytics Dashboard** — Score trends, domain performance charts
- **JWT Authentication** — Secure register/login
- **Admin Panel** — User management and platform analytics
- **Dark/Light Mode** — Toggleable theme

## 🗂️ Project Structure

```
ai-interviewer/
├── client/               # React frontend
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route-level pages
│       ├── hooks/        # Custom React hooks (speech)
│       ├── services/     # Axios API service layer
│       └── context/      # React context (Auth)
└── server/               # Node.js/Express backend
    ├── controllers/      # Business logic
    ├── routes/           # API route definitions
    ├── models/           # Mongoose schemas
    ├── middleware/        # Auth middleware
    └── config/           # DB connection
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API Key ([Get one free](https://aistudio.google.com/))

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
# In /server, copy and fill in your values:
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-interviewer
JWT_SECRET=your_super_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
```

```bash
# In /client:
cp .env.example .env
```

Edit `client/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Run the Application

```bash
# Terminal 1 — Start backend
cd server
npm run dev

# Terminal 2 — Start frontend
cd client
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## 🔑 Default Admin

To make a user an admin, update their role in MongoDB:
```js
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Styling | CSS Variables + custom design system |
| Charts | Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| AI | Google Gemini 2.0 Flash |
| Voice | Web Speech API (browser-native) |

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user

### Interviews
- `POST /api/interviews` — Create session
- `PUT /api/interviews/:id/start` — Start session
- `PUT /api/interviews/:id/questions` — Add questions
- `PUT /api/interviews/:id/answer` — Submit answer
- `PUT /api/interviews/:id/complete` — Complete session
- `GET /api/interviews` — List user's sessions
- `GET /api/interviews/analytics` — Score analytics

### AI
- `POST /api/ai/generate-questions` — Generate questions
- `POST /api/ai/evaluate-answer` — Evaluate answer
- `POST /api/ai/generate-report` — Generate final report

### Admin (admin only)
- `GET /api/admin/users` — List all users
- `GET /api/admin/analytics` — Platform stats
- `DELETE /api/admin/users/:id` — Delete user

## 🌐 Deployment

### Backend (Railway / Render)
Set environment variables and deploy the `server/` folder.

### Frontend (Vercel / Netlify)
Set `REACT_APP_API_URL` to your deployed backend URL and deploy `client/`.

## 📝 License

MIT
