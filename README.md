# ConnecTED Frontend

**The comprehensive React web application for the ConnecTED School Management Platform.**

ConnecTED Frontend is a modern, responsive, and feature-rich single-page application built with React, Vite, and Tailwind CSS. It provides role-specific dashboards for Administrators, Teachers, and Parents, enabling seamless management of school operations, academic tracking, and real-time communication.

---

## 📋 Table of Contents

- [ConnecTED Frontend](#connected-frontend)
  - [📋 Table of Contents](#-table-of-contents)
  - [🎯 Overview](#-overview)
  - [✨ Key Features](#-key-features)
  - [🛠️ Tech Stack](#️-tech-stack)
  - [📁 Project Structure](#-project-structure)
  - [🚀 Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [🔐 Environment Variables](#-environment-variables)
  - [📜 Available Scripts](#-available-scripts)
  - [🧠 State Management](#-state-management)
  - [🛡️ Routing \& Access Control](#️-routing--access-control)
  - [🎨 Styling \& UI](#-styling--ui)
  - [🌍 Internationalization (i18n)](#-internationalization-i18n)

---

## 🎯 Overview

The ConnecTED frontend serves as the primary user interface for the platform, seamlessly integrating with the Node.js/Express backend and Firebase Authentication. It features dedicated portals for different user roles:

- **Admin Portal:** Comprehensive control over users, classes, announcements, and school-wide analytics.
- **Teacher Portal:** Tools for managing classes, taking attendance, recording grades, and assigning homework.
- **Parent Portal:** A clean interface to monitor their children's academic progress, attendance, and communicate with teachers.

---

## ✨ Key Features

- ✅ **Role-Based Routing:** Secure routes that adapt based on the user's role (Admin, Teacher, Parent) and approval status.
- ✅ **Real-Time Communication:** Instant messaging with teachers and parents powered by Socket.io.
- ✅ **Comprehensive Dashboards:** Data visualization using Recharts for attendance trends and grade analytics.
- ✅ **Responsive Design:** A mobile-first approach ensuring the app works perfectly on desktops, tablets, and smartphones.
- ✅ **Internationalization:** Multi-language support using `i18next`.
- ✅ **Form Validation:** Robust client-side validation using `react-hook-form` and `zod`.
- ✅ **Dark Mode Support:** Built-in theme toggling utilizing Tailwind CSS and `next-themes`.
- ✅ **Push Notifications:** Integration with Firebase Cloud Messaging (FCM) for real-time alerts.

---

## 🛠️ Tech Stack

| Category             | Technology                         |
| -------------------- | ---------------------------------- |
| **Core**             | React 18, TypeScript, Vite         |
| **Routing**          | React Router DOM v6                |
| **State Management** | Redux Toolkit, Redux Persist       |
| **Data Fetching**    | React Query, Axios                 |
| **Authentication**   | Firebase Auth                      |
| **Styling**          | Tailwind CSS, Framer Motion        |
| **UI Components**    | Radix UI (shadcn/ui), Lucide React |
| **Forms**            | React Hook Form, Zod               |
| **Charts**           | Recharts                           |
| **Real-Time**        | Socket.io-client                   |
| **i18n**             | i18next, react-i18next             |

---

## 📁 Project Structure

```
connected/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images, fonts, and global styles
│   ├── components/         # Reusable UI components (buttons, cards, modals)
│   ├── data/               # Static data and mock data
│   ├── docs/               # Local documentation
│   ├── hooks/              # Custom React hooks (useAuth, useSocket, etc.)
│   ├── i18n/               # Internationalization config and locales
│   ├── lib/                # Utility functions and library configurations
│   ├── pages/              # Route components
│   │   ├── admin/          # Admin-specific pages
│   │   ├── teacher/        # Teacher-specific pages
│   │   ├── parent/         # Parent-specific pages
│   │   └── shared/         # Pages shared across roles
│   ├── services/           # API services (Axios interceptors, endpoints)
│   ├── store/              # Redux slices and store configuration
│   ├── types/              # TypeScript interfaces and types
│   ├── App.tsx             # Main application component & router setup
│   └── main.tsx            # Entry point
├── .env.local              # Environment variables
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm**, **yarn**, or **bun**

### Installation

1. **Navigate to the frontend directory:**

   ```bash
   cd connected
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.local` or create one with your configuration (see below).

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

---

## 🔐 Environment Variables

Create a `.env.local` file in the root of the `connected` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 📜 Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the app for production.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run test`: Runs unit tests using Vitest.

---

## 🧠 State Management

The application uses **Redux Toolkit** for global state management:

- **Auth Slice**: Manages user session, tokens, and role information.
- **UI Slice**: Manages global UI states like theme, sidebar toggles, and modals.
- **Redux Persist**: Ensures that essential state (like authentication tokens and theme preferences) persists across page reloads.

Data fetching and caching for API requests are handled by **React Query**, providing robust loading states, error handling, and automatic background refetching.

---

## 🛡️ Routing & Access Control

Routing is protected based on authentication and user roles:

1. **Public Routes:** Login, Signup, Landing page.
2. **Protected Routes:** Require a valid Firebase session.
3. **Role-Based Routes:** Checks the user's `role` (`admin`, `teacher`, `parent`) before granting access to specific dashboards.
4. **Approval Gate:** Newly registered teachers and parents are redirected to a `/pending` route until an admin approves their account.

---

## 🎨 Styling & UI

The frontend leverages **Tailwind CSS** for rapid UI development and **Radix UI** primitives (via `shadcn/ui`) for accessible, unstyled components.

- Global CSS variables are defined in `src/index.css` for theming (colors, border radius).
- `framer-motion` is used to implement smooth page transitions and micro-interactions.

---

## 🌍 Internationalization (i18n)

The app is built to support multiple languages using `i18next`.

- Translation files are stored in `src/i18n/locales/`.
- The active language can be toggled from the user settings/header.
- It uses `i18next-browser-languagedetector` to automatically apply the user's preferred browser language.
