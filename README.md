# Campus One 🎓

**Campus One** is an AI-powered full-stack college super app designed to centralize all major campus activities into a single platform. It integrates academics, placements, student communities, hostel services, networking, and AI-driven tools to improve the overall student experience.

> ⚡ Currently under active development.

---

## ✨ Features Implemented

### 🔐 Authentication & User Management

* Secure authentication using **Supabase Auth**
* Email verification and password reset
* Role-based access control
* Persistent user sessions

### 📊 Student Dashboard

* Personalized dashboard for students
* Centralized access to all campus modules
* Responsive and modern UI

### 📚 Academic Management

* Attendance tracking
* Assignment management
* Timetable management
* Notes organization

### 💼 Placement Hub

* Company listings and application tracking
* AI-powered mock interviews
* ATS resume analyzer
* Behavioral, Technical, and HR interview simulations
* Interview history and feedback reports

### 🤖 AI Features

* Gemini-powered AI assistant
* ATS resume analysis
* AI-generated mock interview questions
* Intelligent feedback and scoring system

### 🏪 Marketplace

* Buy and sell products within campus
* Search and filtering support
* Product listings with image uploads
* Seller information and messaging support

### 👥 Community Platform

* Create and interact with posts
* Upvote/downvote system
* Comments and discussions
* Real-time optimistic UI updates

### 🏛 Clubs & Events

* Club discovery and memberships
* Event registrations and cancellations
* Waitlist management
* Notifications for registrations

### 🏠 Hostel Module

* Hostel complaint management
* Complaint tracking with statuses
* Mess menu display
* Image support for complaints

### 🌐 Student Network

* Discover students across branches
* Follow/Unfollow functionality
* Student profiles and social links
* Search and filtering by skills and branch

### 🔔 Notifications

* System notifications
* Event notifications
* Follow notifications
* Real-time updates

---

# 🛠 Tech Stack

## Frontend

* Next.js 15
* React
* TypeScript
* Tailwind CSS
* Zustand
* React Hook Form
* ShadCN UI

## Backend

* Next.js API Routes
* Prisma ORM
* PostgreSQL
* Supabase Authentication

## AI

* Google Gemini API

## Other Tools

* UploadThing / File Upload APIs
* Sonner Toast
* Zod Validation

---

# 🗄 Database

Built using **Prisma ORM + PostgreSQL** with modules including:

* Users & Profiles
* Placements
* Interview Sessions
* Community Posts
* Clubs & Members
* Events & Registrations
* Marketplace Listings
* Hostel Complaints
* Notifications
* Student Network (Follow System)

---

# 📂 Project Structure

```bash
src/
├── app/
│   ├── (auth)
│   ├── (dashboard)
│   │   ├── placements
│   │   ├── community
│   │   ├── clubs
│   │   ├── marketplace
│   │   ├── hostel
│   │   ├── network
│   │   └── settings
│   └── api/
├── components/
├── lib/
├── prisma/
├── store/
└── types/
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/your-username/campus-one.git
cd campus-one
```

## Install Dependencies

```bash
npm install
```

## Environment Variables

Create a `.env.local` file:

```env
DATABASE_URL=
DIRECT_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GOOGLE_GEMINI_API_KEY=
```

## Run Prisma

```bash
npx prisma generate
npx prisma db push
```

## Start Development Server

```bash
npm run dev
```

---

# 📌 Roadmap

### Remaining Features

* Admin Panel
* Real-time Chat
* Recommendation System
* Mobile Responsiveness Improvements
* Analytics Dashboard
* Push Notifications
* Production Deployment

---

# 🎯 Vision

Campus One aims to become a **single digital ecosystem for college students**, replacing multiple disconnected systems with one AI-powered platform.

---

### Built with ❤️ using Next.js, Supabase, Prisma, PostgreSQL and Gemini AI.
