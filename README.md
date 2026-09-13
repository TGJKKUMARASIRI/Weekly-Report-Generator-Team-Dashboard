# Weekly Report Generator & Team Dashboard

Full-stack web application enabling team members to submit weekly work reports and managers to review, request corrections, and analyze team productivity.

## Tech Stack
- **Frontend:** React (Vite, TypeScript, Tailwind CSS, Lucide Icons, Axios, React Router)
- **Backend:** Node.js, Express, TypeScript, Mongoose
- **Database:** MongoDB Atlas
- **Authentication:** JWT & bcryptjs (Role-Based Access Control)

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
# Create .env file based on .env.example
npm run seed   # Seed default users and sample projects
npm run dev    # Server runs on http://localhost:4000