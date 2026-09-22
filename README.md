
# 🏥 CareQueue — Doctor Appointment Queue Management System

A real-time, single-hospital, multi-department appointment booking and queue management platform built with **Node.js, Express, MongoDB, Socket.io, React (Vite), and Tailwind CSS**.

The platform handles patient slot booking, walk-in registration, and manages a live, weighted **priority queue per doctor** using a **custom Min-Heap data structure**.

---

## 🌟 Core Features

- **Custom Min-Heap Priority Queue (DSA)**: Rebuilds and balances live queues based on urgency:
  $$\text{priorityScore} = \text{basePosition} - (\text{emergency}? 1000 : 0) - (\text{senior}? 50 : 0) - (\text{waitingMins} \times 0.5)$$
- **Role-Based Access Control (RBAC)**: 4 strictly scoped roles (`patient`, `doctor`, `receptionist`, `admin`).
- **Atomic Double-Booking Prevention**: MongoDB `findOneAndUpdate` atomic operations with compound unique indexes (`doctor`, `date`, `slotId`).
- **Real-Time WebSocket Updates**: Socket.io room isolation per doctor (`doctor:<doctorId>`) pushing instant queue advances and position badges without page refreshes.
- **Walk-in Patient Support**: Receptionists can instantly register walk-in patients directly into doctor priority heaps.
- **Glassmorphic Modern UI**: Built with Vite + React + Tailwind CSS with dark mode aesthetics and responsive dashboards.

---

## 📂 Project Architecture

```text
Doctor Appointment Queue/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB & Socket.io configuration
│   │   ├── controllers/     # Auth, Doctor, Appointment, Queue & Admin controllers
│   │   ├── dsa/             # Custom MinHeap DSA implementation & QueueManager
│   │   ├── middleware/      # JWT auth, RBAC guards & express-validator
│   │   ├── models/          # User, Doctor, Appointment & QueueEntry Mongoose schemas
│   │   ├── routes/          # Express REST API routes
│   │   ├── utils/           # Nodemailer notification logger
│   │   ├── seed.js          # Database seeder (Departments, Doctors, Slots, Accounts)
│   │   └── server.js        # Express HTTP + Socket.io entrypoint
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # Navbar, SlotPicker, DoctorCard, LiveQueueList, NextPatientCard
    │   ├── context/         # AuthContext & SocketContext
    │   ├── hooks/           # useAuth & useSocket
    │   ├── pages/           # Home, Login, Register, Patient, Doctor, Receptionist & Admin dashboards
    │   └── services/        # Axios API client
    └── package.json
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
cd backend

# Install backend dependencies
npm install

# (Optional) Seed the database with departments, doctors, slots & admin accounts
npm run seed

# Run the server in development mode
npm run dev
```

The backend server runs on `http://localhost:5000`.

### 2. Frontend Setup

In a separate terminal window:

```bash
cd frontend

# Install frontend dependencies
npm install

# Start the Vite development server
npm run dev
```

The React app will launch on `http://localhost:5173`.

---

## 🔑 Pre-Seeded Demo Credentials

After running `npm run seed`, you can sign in with any of these pre-configured accounts:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Super Admin** | `admin@hospital.com` | `Admin@123` | Full system governance, onboard staff, analytics |
| **Receptionist** | `receptionist@hospital.com` | `Recep@123` | Walk-in registration, check-ins, emergency bumps |
| **Doctor** | `sharma@hospital.com` | `Password123` | Active consultation room, queue advance, leave requests |
| **Patient** | `patient@hospital.com` | `Password123` | Slot booking, live position tracker, appointment history |
| **Senior Patient**| `senior@hospital.com` | `Password123` | Automatic senior citizen priority bump |

---

## 🧪 Testing the Custom Min-Heap

You can run the standalone MinHeap unit test suite anytime:

```bash
cd backend
npm run test:heap
```

---

## 🛰️ REST API Endpoints Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register patient account |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT |
| `GET` | `/api/doctors` | Public | List doctors (optional `?department=`) |
| `GET` | `/api/doctors/:id/slots` | Public | Get available date & time slots |
| `POST` | `/api/appointments/book` | Patient/Recep/Admin | Atomic appointment slot booking |
| `POST` | `/api/appointments/walk-in` | Recep/Admin | Register walk-in patient directly into heap |
| `PUT` | `/api/appointments/:id/check-in` | Patient/Recep/Admin | Check in patient on appointment day |
| `GET` | `/api/queue/:doctorId` | Public | Get live prioritized doctor queue |
| `PUT` | `/api/queue/:doctorId/next` | Doctor/Admin | Call next patient & advance min-heap queue |
| `PUT` | `/api/queue/:doctorId/no-show/:id` | Doctor/Recep/Admin | Mark patient absent |
| `GET` | `/api/admin/reports/summary` | Admin | Get system analytics summary |

>>>>>>> 64a0947 (Initial commit)
