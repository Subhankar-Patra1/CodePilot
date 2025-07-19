# 🚀 CodePilot – AI-Powered Code Review Tool

![CodePilot Logo](public/logo.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-blue?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-API-ffb300?logo=google)](https://ai.google.dev/)

---

> **CodePilot** is your AI-powered code review assistant. Paste or upload your code, and get instant, actionable feedback, bug detection, and improved code suggestions – all powered by Google Gemini AI. No usage limits: bring your own API key!

---

## ✨ Features

- 🤖 **AI Code Review**: Get instant feedback, bug detection, and best practice suggestions for 20+ languages.
- 📝 **Improved Code Output**: Receive a fully rewritten, improved version of your code (not just diffs).
- 🔄 **Chunked Review & Continuation**: Handles large code by chunking and auto-continuing until the full improved code is returned.
- 🎬 **Real-Time Typing Effect**: Watch improved code appear with a typewriter animation.
- 🧑‍💻 **Bring Your Own API Key**: No quota limits – store your Gemini API key locally for unlimited reviews.
- 🧭 **Onboarding & Welcome Modal**: Friendly onboarding with a "Do not show again" option.
- 🛠️ **Settings Dialog**: Securely manage your API key in a beautiful, accessible modal.
- 📚 **Review Library**: Search, edit, and manage your past code reviews.
- 🦾 **Accessibility**: ARIA roles, focus rings, keyboard navigation, and color contrast.
- 📱 **Mobile Responsive**: Works beautifully on all devices.
- 🌗 **Theme Toggle**: Light/dark mode with smooth transitions.
- 🛡️ **Security**: API key is stored only in your browser (never sent to our servers).
- 🦄 **Delightful UX**: Toasts, progress bars, skeleton loaders, tooltips, and confetti!
- 🔍 **SEO Optimized**: Meta tags, Open Graph, Twitter cards, and favicon included.

---

## 🖥️ Tech Stack

- [Next.js 14 (App Router)](https://nextjs.org/)
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/) (Dialog, AlertDialog, Tooltip, Accordion)
- [Framer Motion](https://www.framer.com/motion/) (Animations)
- [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) (Code display)
- [Google Gemini AI](https://ai.google.dev/) (via Genkit)

---

## 🚦 Quick Start

1. **Clone the repo:**
   ```bash
   git clone https://github.com/your-username/CodePilot.git
   cd CodePilot
   ```
2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```
3. **Set up your environment:**
   - Copy `.env.example` to `.env` and fill in any required values (if needed).
   - _Note: Your Gemini API key is entered in the app UI, not in the .env file!_
4. **Run the app locally:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
5. **Open in your browser:**
   - Visit [http://localhost:3000](http://localhost:3000)

---

## 🔑 How to Use

1. **Paste or upload your code** in the main input area.
2. **Select the language** and strictness level.
3. **Enter your Gemini API key** in Settings (bottom left ⚙️).
4. **Click "Review Code"** and watch the magic happen!
5. **Copy improved code** with one click, or get detailed explanations for any feedback.

---

## 📦 Project Structure

```
CodePilot/
  ├─ src/
  │   ├─ app/           # Main pages and layout
  │   ├─ components/    # UI and feature components
  │   ├─ hooks/         # Custom React hooks
  │   ├─ ai/            # AI flows and prompt logic
  │   └─ lib/           # Utilities
  ├─ public/            # Static assets (favicon, logo)
  ├─ .env.example       # Example environment file
  ├─ package.json       # Project metadata
  └─ README.md          # This file
```

---

## 🛡️ Security & Privacy

- Your Gemini API key is **never sent to our servers** – it stays in your browser.
- All code reviews are processed client-side via your API key.

---

## 🙌 Contributing

Pull requests, issues, and suggestions are welcome! Please open an issue or PR to discuss improvements or report bugs.

---

## 📄 License

[MIT](LICENSE)

---

## 💡 Inspiration

CodePilot was built to make AI code review accessible, delightful, and unlimited for every developer. Happy coding! ✨
