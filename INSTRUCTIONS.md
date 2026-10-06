# MindAxis — Comprehensive Installation & Execution Manual

Welcome to **MindAxis**, an AI-assisted student mental wellness and campus counseling platform featuring double-blind student identity protection.

This document provides a step-by-step guide on installing, configuring, running, and demonstrating the complete system.

---

## 🏗️ System Architecture & Stack

- **Mobile App**: React Native (Expo SDK 57), TypeScript, React Native Reanimated, Expo Router.
- **Backend API**: Python 3.11, FastAPI, SQLAlchemy ORM, SQLite/Postgres.
- **Security & Privacy**: JWT Authentication, Double-Blind Identity Separation (`anonymous_id`), Bcrypt OTP hashing.
- **Deployment Tunnels**: Localtunnel / Ngrok HTTPS tunnels for mobile connectivity.

---

## 📋 System Prerequisites

Ensure the following tools are installed on your system:
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **Git**: Installed and configured
- **Android Device / Emulator** (or Expo Go app)

---

## ⚙️ Installation Guide

### 1. Clone the Repository
```bash
git clone https://github.com/Atharva-O1/MindAxis.git
cd MindAxis
```

### 2. Backend Setup
Open a terminal in the project root directory:
```bash
cd backend
python -m venv .venv
```

Activate virtual environment & install dependencies:
- **Windows (Git Bash / Command Prompt)**:
  ```bash
  .venv/Scripts/python.exe -m pip install -r requirements.txt
  ```
- **macOS / Linux**:
  ```bash
  source .venv/bin/activate
  pip install -r requirements.txt
  ```

### 3. Frontend Setup
In the main project root directory (`MindAxis/`):
```bash
npm install
```

---

## 🚀 Running the Application (3 Simple Steps)

To run the complete system, launch **2 separate terminals** on your computer.

### Step 1: Start the Backend Server (Terminal 1)
In the `backend/` directory:
- **Windows (Git Bash)**:
  ```bash
  .venv/Scripts/python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  ```
- **Windows (PowerShell)**:
  ```powershell
  .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  ```
- **macOS / Linux**:
  ```bash
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  ```

> **Verification**: Open `http://localhost:8000/health` in your browser. It should return `{"status": "ok"}`. Interactive Swagger API documentation is available at `http://localhost:8000/docs`.

---

### Step 2: Start the Secure Public Tunnel (Terminal 2)
In the main `MindAxis/` root directory:
```bash
npx localtunnel --port 8000 --subdomain small-numbers-own
```
*This exposes your local backend over secure HTTPS (`https://small-numbers-own.loca.lt`) so your physical mobile device can connect from anywhere.*

---

### Step 3: Launch the Mobile App

#### Option A: Run on Standalone Android Phone (Recommended for Evaluation)
1. Download the standalone Android APK directly to your phone:
   👉 **[Download MindAxis `.apk`](https://expo.dev/artifacts/eas/USWMMvpnd8fsACP9jxGgN-h354dNITQZIpBM2fDlBsQ.apk)**
2. Install the `.apk` on your Android device.
3. Open the **MindAxis** app — it will automatically connect to your live backend!

#### Option B: Live Web Projection (For Classrooms / Projectors)
In the main `MindAxis/` root directory:
```bash
npx expo start
```
- Press **`w`** in the terminal to launch the web client live in Google Chrome.

#### Option C: Live Phone Testing via Expo Go
1. Install **Expo Go** from Google Play Store or Apple App Store.
2. Run `npx expo start` in your terminal and scan the generated QR code.

---

## 🔑 Demo Walkthrough & Presentation Guide

### Workflow A: Student Experience
1. **Sign In**: Enter any student email address (e.g. `student@college.ac.in`).
2. **OTP Verification**: Enter the 6-digit code (sent via email or printed in backend terminal console).
3. **Clinical Tools**:
   - **Mood Check-in**: Record daily mood metrics.
   - **PHQ-9 & GAD-7**: Take interactive depression and anxiety self-assessments.
   - **Journal**: Create encrypted personal mental health reflection entries.
4. **Book Counselor Appointment**:
   - Navigate to **Campus Counselor** tile on Home dashboard.
   - Choose a counselor (*Dr. Ananya Sharma*), pick an upcoming date and time slot, and tap **Book Appointment**.

---

### Workflow B: Counselor Schedule Portal (Faculty / Presenter View)
1. **Access Portal**: On the initial sign-in screen, tap **"Campus Staff / Counselor Login"** at the bottom.
2. **Profile & Authentication**:
   - Select or type Counselor Name (*Dr. Ananya Sharma*).
   - Enter Counselor Access Key: **`MINDAXIS26`**.
3. **Counselor Dashboard**:
   - Demonstrates **Double-Blind Identity Protection**: All appointments display anonymous student alias handles (e.g., `Anonymous Student #a4f8-92c1`) rather than real student emails.
   - Counselors can tap **Mark Completed** or **Cancel** to update session statuses in real time.

---

## 🛠️ Troubleshooting & FAQ

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| `bash: uvicorn: command not found` | Virtual environment not activated in shell | Use `.venv/Scripts/python.exe -m uvicorn ...` |
| `Could not reach the server` in App | Localtunnel server not running | Ensure Terminal 2 (`npx localtunnel ...`) is active |
| `502 Bad Gateway` on Tunnel URL | Backend server stopped | Ensure Terminal 1 (uvicorn) is running on port 8000 |

---

*MindAxis © 2026 — Secure, Anonymous Student Wellness & Campus Counseling Platform.*
