# 🎓 CampusConnect

> An all-in-one university student engagement platform featuring student dashboards, club management, real-time event tracking, certificate generation, analytics, and live notifications.

### Project Overview

https://github.com/user-attachments/assets/4b985d66-b8c9-4067-9377-d3f44e8a2d12

---

## 📚 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Setup Instructions](#setup-instructions)
- [API Routes](#api-routes)
  - [Student APIs](#student-apis)
  - [Club Admin Dashboard APIs](#club-dashboard-apis)
- [WebSocket Events](#websocket-events)
- [Analytics & Graphs](#analytics--graphs)
- [Deployment Notes](#deployment-notes)
- [Contributors](#contributors)
- [License](#license)
- [Screenshots](#screenshots)

---

## 📖 About

**CampusConnect** is a web-based platform that bridges the gap between university students and student clubs by offering:

- A dashboard for students to explore, subscribe, and interact with clubs.
- A powerful club admin dashboard to manage events, committee members, certificates, feedback, and real-time data analytics.
- Live updates via WebSockets for RSVPs, notifications, and analytics tracking.

---

## ✨ Features

### 👩‍🎓 Student Dashboard
- Explore all clubs and events
- RSVP to events
- View issued certificates
- Give feedback to clubs
- Receive real-time notifications

### 🏛️ Club Dashboard
- Manage committee members
- Create and edit events
- View event RSVP details
- Upload and issue certificates
- Collect and analyze feedback
- Push notifications to subscribers
- Track analytics (engagement, RSVP trends, etc.)

### 📊 Analytics
- Live RSVP and view tracking
- Event capacity monitoring
- Subscriber growth trends
- Feedback distribution pie chart
- Certificate issuance reports

### 📡 Real-time Communication
- WebSockets for:
  - RSVP counter
  - Notifications
  - Live analytics events

---

## ⚙️ Tech Stack

| Frontend        | Backend        | Database        | Real-Time      | Other Tools     |
|----------------|----------------|-----------------|----------------|-----------------|
| Next.js (App Router) | Express.js      | Supabase (PostgreSQL) | Socket.io       | Vercel, Render  |
| TypeScript      | Node.js        |                 |                | dotenv, multer  |

---

## 🗂️ Folder Structure

```
client/
  └── src/
      └── app/
          ├── student-login/
          ├── clubs/[club_id]/dashboard/
          ├── admin/university-upload/
          └── ...
server/
  ├── routes/
  ├── controllers/
  ├── middlewares/
  ├── utils/
  └── src/index.js
```

---

## 🚀 Setup Instructions

```bash
# Clone the repo
git clone https://github.com/your-username/campusconnect.git
cd campusconnect

# Setup client
cd client
npm install

# Setup server
cd ../server
npm install

# Create .env files in both /client and /server
# Refer to .env.example for required variables

# Start development
npm run dev      # from client/
npm run dev      # from server/
```

---

## 📡 API Routes

### 👨‍🎓 Student APIs (`/api/student`)
| Endpoint                          | Method | Description                          |
|----------------------------------|--------|--------------------------------------|
| `/subscriptions`                 | GET    | Get all club subscriptions           |
| `/certificates`                  | GET    | View issued certificates             |
| `/feedback/:clubId`              | POST   | Submit feedback for a club           |
| `/notifications`                 | GET    | Fetch student notifications          |
| `/profile`                       | GET    | Get student profile data             |

### 🧑‍💼 Club Dashboard APIs (`/api/clubs/:clubId/`)
| Section         | Endpoint                                  | Method | Description                                |
|----------------|-------------------------------------------|--------|--------------------------------------------|
| Events          | `/events`, `/events/:eventId`             | GET/POST/PUT/DELETE | Manage events                        |
| RSVPs           | `/rsvps`, `/rsvps/download`               | GET    | View and download RSVP data                |
| Certificates    | `/certificates/upload`, `/view/:id`       | POST/GET | Upload and view certificates              |
| Committee       | `/committee`, `/committee/search`         | GET/POST/PUT/DELETE | Manage committee members     |
| Feedback        | `/feedback/analytics`                     | GET    | Fetch feedback analytics (pie chart data)  |
| Analytics       | `/analytics`                              | GET    | Fetch all analytics data                   |
| Notifications   | `/notifications/send`                     | POST   | Send notification to subscribers           |
| Club Settings   | `/edit`                                   | PUT    | Edit club name, description, logo etc.     |

---

## 🔌 WebSocket Events

| Event Name             | Direction     | Payload Description                        |
|------------------------|---------------|---------------------------------------------|
| `join_event_room`      | client → server | `{ eventId }`                              |
| `rsvp_count_updated`   | server → client | `newCount`                                 |
| `join_student_room`    | client → server | `{ studentId }`                            |
| `notification_received`| server → client | `notification`                             |

---

## 📈 Analytics & Graphs

### ✅ Graphs implemented
- Event RSVPs over time (Bar graph)
- Event views over time
- Subscriber growth over time
- Feedback distribution (Pie chart)
- Certificate issuance count

**Tech used:** Chart.js or Recharts (client-side), Supabase queries (server-side)

---

## 🛠️ Deployment Notes

- **Frontend:** Deployed to [Vercel](https://vercel.com/)
- **Backend:** Hosted on [Render](https://render.com/)
- **CORS:** Configured with `credentials: true` and proper `origin`
- **Certificates:** Served statically from `uploads/certificates/` via `express.static`
- **WebSockets:** Socket.IO configured with proper CORS and same origin

---

## 🧑‍💻 Contributors

- [Tirthraj Raval](https://github.com/Tirthraj-Raval) - Full-stack Developer, UI/UX, Database Design

---

## 🖼️ Screenshots


### 🎓 Student Dashboard
<img width="1900" height="911" alt="image" src="https://github.com/user-attachments/assets/99f31b67-6602-4fbc-9ec2-4b4443425081" />

### 🧑‍💼 Club Admin Dashboard
<img width="1914" height="912" alt="image" src="https://github.com/user-attachments/assets/01a619ea-502a-4d4f-ac73-42fede3b0580" />


---

## 📄 License

No license has been granted for this project yet, so all rights are reserved by
the author. A license may be added in a future release.
