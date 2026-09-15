# Weekly Report Generator & Team Dashboard

Full-stack web application enabling team members to submit weekly work reports and managers to review, request corrections, and analyze team productivity.

## Tech Stack
- **Frontend:** React (Vite, TypeScript, Tailwind CSS, Lucide Icons, Axios, React Router, React Markdown)
- **Backend:** Node.js, Express, TypeScript, Mongoose
- **Database:** MongoDB Atlas
- **Authentication:** JWT & bcryptjs (Role-Based Access Control)
- **AI Integration:** OpenAI API (`gpt-4o-mini`) for dynamic report summarization

## Setup Instructions

### Prerequisites

- Node.js 18 or later and npm
- MongoDB Community Server running locally, or a MongoDB Atlas connection
- Git, if cloning the repository

### 1. Install Dependencies

Install dependencies for both applications:

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/weekly_report_db
JWT_SECRET=replace-this-with-a-strong-secret
OPENAI_API_KEY=your-open-ai-key # Required for Manager AI Chat Assistant features
```

`OPENAI_API_KEY` is optional unless the manager AI Chat Assistant is being used. For MongoDB Atlas, replace `MONGO_URI` with the connection string provided by Atlas.

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:4000/api
```

### 3. Run the Database

The backend connects to MongoDB automatically when it starts. Use either a local MongoDB server or MongoDB Atlas.

#### Option A: Local MongoDB

Start the MongoDB service using the method appropriate for your installation. You can also start it manually on Windows:

```powershell
mongod --dbpath C:\data\db
```

The default local database connection is:

```text
mongodb://localhost:27017/weekly_report_db
```

#### Option B: MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Add your IP address to the Atlas network access list.
3. Create a database user.
4. Copy the Atlas connection string into `backend/.env` as `MONGO_URI`.

After MongoDB is available, optionally seed development data:

```bash
cd backend
npm run seed
```

The seed command creates a manager, two team members, and three projects. It deletes existing users and projects before inserting sample data, so use it only for development.

### 4. Run the Backend

Open a terminal in the `backend` directory:

```bash
cd backend
npm run dev
```

The backend runs at `http://localhost:4000` by default. Check the health endpoint at `http://localhost:4000/health`.

For a production-style run:

```bash
npm run build
npm start
```

### 5. Run the Frontend

Open a second terminal in the `frontend` directory:

```bash
cd frontend
npm run dev
```

Vite normally serves the frontend at `http://localhost:5173`. Open the URL printed in the terminal. The frontend uses `VITE_API_URL` to connect to the backend.

### Development Login Accounts

When the seed command is used, these accounts are available:

| Role | Email | Password |
| --- | --- | --- |
| Manager | `manager@example.com` | `Password123!` |
| Team member | `john@example.com` | `Password123!` |
| Team member | `alice@example.com` | `Password123!` |

Change these credentials and the JWT secret before using the application outside local development.