# SmartAttend
**A Modern, Full-Stack Real-Time Smart Attendance System**

[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![Express.js](https://img.shields.io/badge/Express.js-5-404D59?style=flat-square&logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-4EA94B?style=flat-square&logo=mongodb)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-RealTime-white?style=flat-square&logo=socket.io)](https://socket.io)

SmartAttend streamlines the process of tracking student attendance using custom-duration static QR codes, strict geo-fencing validation, and seamless WebSocket connections. It provides an intuitive interface for teachers to manage sessions and for students to mark their presence securely and instantly.

---

## Key Features

- **Secure Authentication**: Local (JWT-based) authentication with role-based access control (Admin, Teacher, Student).
- **Smart QR Code Attendance**: Teachers generate a static QR code valid for a custom duration (e.g., 5 minutes). The session automatically closes when the time expires.
- **Geo-Fencing Protection**: Students must be within the physical bounds of the classroom to mark attendance successfully. If outside the radius, their attendance is marked as "Flagged" to prevent proxy attendance from dorms or outside campus.
- **Real-Time Updates**: Live dashboard updates for teachers when students mark their attendance, powered by Socket.IO WebSockets.
- **Excel Bulk Imports**: Easily import both Student and Faculty data in bulk via Excel spreadsheets. The system handles auto-generation of credentials.
- **Session Analytics**: Complete workflows for creating attendance sessions, viewing visual analytics (Recharts), and tracking individual student history.

---

## How It Works: In-Depth Technical Workflows

### 1. The QR Code & Geo-Fencing Attendance Flow
The system enforces physical presence through a combination of timed cryptography and geolocation.

**Step-by-step:**
1. **Session Creation**: The teacher selects a classroom (which has predefined latitude/longitude coordinates in the database) and sets a session duration (e.g., 2 minutes).
2. **QR Generation**: The backend generates a secure token and a `setTimeout` timer. The frontend displays the QR code using `qrcode.react`.
3. **Student Scanning**: The student logs in and uses the built-in scanner (powered by `html5-qrcode`).
4. **GPS Fetching**: Before sending the request, the frontend strictly requests the student's current GPS location using `navigator.geolocation`.
5. **Validation**: The frontend sends the QR token, Session ID, and GPS coordinates to the `/api/attendance/mark` endpoint.
6. **Backend Processing**: 
   - The server validates the token to ensure the session hasn't expired.
   - The server calculates the **Haversine Distance** between the student's GPS coordinates and the classroom's coordinates.
   - If the distance is `<= 50 meters` (or custom radius), attendance is logged as **Present**.
   - If the distance is `> 50 meters`, attendance is logged but marked as **Flagged**, and the exact distance is recorded in the remarks for teacher review.
7. **Real-time Event**: The backend emits a `attendance-marked` event via Socket.IO, instantly updating the teacher's screen without a page refresh.

### 2. Bulk Excel Processing Flow
To onboard hundreds of students or faculty instantly, admins use the bulk import system.

**Step-by-step:**
1. **File Upload**: The Admin uploads an `.xlsx` file from the frontend via `multipart/form-data`.
2. **Multer Middleware**: The backend intercepts the file using `multer` and temporarily holds it in a memory buffer.
3. **SheetJS Parsing**: The `xlsx` package reads the buffer and converts the Excel sheet into an array of JSON objects.
4. **Data Normalization**: The backend standardizes column headers (case-insensitive) to ensure flexibility in the uploaded files.
5. **Credential Auto-Generation**:
   - **For Teachers**: Emails are auto-generated from their names (e.g., `teachercs@smartattend.com`). The default password is set to `teacher123`.
   - **For Students**: The `Enrollment Number` becomes their login username. The password is automatically constructed using `[First_Word_Of_Name]@[Last_4_Digits_Of_Enrollment]` (e.g., `BRAHMBHATT@0005`).
6. **Password Hashing**: All generated passwords are encrypted via `bcrypt`.
7. **Bulk Insertion**: Validated records are bulk inserted into MongoDB using `Model.insertMany()` for maximum performance.

---

## Detailed Package List

### Frontend (React 19 + Vite)
| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | Core UI Library (v19) |
| `react-router-dom` | Client-side routing and layout management |
| `tailwindcss`, `@tailwindcss/vite` | Modern utility-first CSS styling (v4) |
| `axios` | Robust HTTP client for API requests |
| `socket.io-client` | Real-time WebSocket communication |
| `html5-qrcode` | Accessing device cameras to scan QR codes |
| `qrcode.react` | Generating static SVG/Canvas QR codes |
| `lucide-react` | Clean, modern SVG icon library |
| `recharts` | Rendering beautiful analytic charts and graphs |

### Backend (Express.js 5)
| Package | Purpose |
|---------|---------|
| `express` | Core API framework (v5) |
| `mongoose` | MongoDB Object Data Modeling (ODM) |
| `socket.io` | WebSocket server for real-time events |
| `jsonwebtoken` | Generating and verifying secure JWT tokens |
| `bcrypt` | Cryptographic hashing of user passwords |
| `multer` | Handling `multipart/form-data` for file uploads |
| `xlsx` | SheetJS: Parsing Excel files into JSON |
| `zod`, `express-validator` | Strict request schema and data validation |
| `helmet`, `cors`, `hpp` | Security middlewares (Headers, CORS, Param Pollution) |
| `express-rate-limit` | Preventing brute-force attacks |
| `pino`, `pino-pretty`, `morgan` | Fast and formatted application logging |

---

## Getting Started & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local instance or Atlas URI)

### 1. Environment Variables Configuration
Navigate to the `server` directory and create a `.env` file using the following template:

```env
PORT=3000
MONGO_URL=mongodb://127.0.0.1:27017/smartattend
ACCESSTOKEN=your_super_secret_access_token_key
REFRESHTOKEN=your_super_secret_refresh_token_key
```

### 2. Backend Setup
Install dependencies and start the server:

```bash
cd server
npm install
npm run dev
```

### 3. Frontend Setup
Open a new terminal, navigate to the `frontend` directory, install dependencies, and run the development server:

```bash
cd frontend
npm install
npm run dev
```

---

## Default Accounts & Credentials

The system comes pre-seeded with default admin accounts.

**Admin Login:** 
- **Email:** `admin@smartattend.com`
- **Password:** `admin123`

*(Use the Admin account to create classrooms, subjects, and import your Faculty and Students via Excel!)*
