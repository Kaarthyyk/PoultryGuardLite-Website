# 🐔 PoultryGuardLite Website v1.0

An AI-powered poultry farm management web application built with Next.js, Firebase, and Google Gemini AI.

---

## Features

- 🔐 Firebase Authentication
- 🏠 Dashboard Analytics
- 🐔 Farm Management
- 📦 Batch Management
- 📈 Weekly Entries
- 🤖 AI Disease Detection (Gemini Vision)
- 📜 AI Scan History
- 📄 PDF Report Generation
- 👤 User Profile Management
- ⚙️ Settings
- 🌙 Premium Dark Theme
- 📱 Responsive Design
- ☁️ Firebase Firestore Integration

---

## Tech Stack

- Next.js
- React
- TypeScript
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase App Check
- Google Gemini AI
- Recharts
- jsPDF
- Tailwind CSS

---

## Requirements

- Node.js 20 or later
- npm

---

## Installation

Clone the project or extract the ZIP.

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Rename:

```
.env.example
```

to

```
.env.local
```

Update all values with your own Firebase and Gemini credentials.

Example:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

GEMINI_API_KEY=
```

---

## Run Development Server

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

## Production Build

```bash
npm run build
npm start
```

---

## Project Structure

```
src/
 ├── app/
 ├── components/
 ├── config/
 ├── contexts/
 ├── hooks/
 ├── lib/
 ├── repositories/
 └── types/

public/
scripts/
```

---

## Firebase Configuration

Configure:

- Authentication
- Firestore Database
- Storage
- App Check (Optional)
- Google Gemini API Key

---

## Build Validation

Before deployment execute:

```bash
npm run lint
```

```bash
npx tsc --noEmit
```

```bash
npm run build
```

All commands should complete without errors.

---

## Deployment

Recommended Platforms:

- Vercel
- Firebase Hosting

---

## Version

Current Release

**PoultryGuardLite Website v1.0**

---

## Notes

This project uses Firebase services and Google Gemini AI.

Before deploying to production, ensure:

- Firebase Authentication is configured.
- Firestore security rules are configured.
- Firebase Storage rules are configured.
- Gemini API Key is valid.
- Firebase App Check is configured if enabled.

---

## License

This project is provided for the client as a custom-developed application.

Unauthorized redistribution or resale without permission from the developer is prohibited.

---

Developed by

**Kadhi Studios**

AI-Powered Software & Digital Solutions

© 2026 Kadhi Studios. All Rights Reserved.