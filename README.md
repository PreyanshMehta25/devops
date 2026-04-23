# StackIt - Modern Q&A Platform

A beautiful, modern, and feature-rich Q&A platform for programming questions, built with React, TypeScript, and Node.js.

## ✨ Features

### 🎨 Modern UI/UX
- Colorful and vibrant gradient theme
- Responsive design for desktop, tablet, and mobile
- Smooth animations and hover effects
- Glass morphism UI components
- Custom scrollbars

### 🔐 Authentication & Authorization
- Clerk Integration for secure login/signup
- Role-based access control
- Protected routes

### 📝 Question Management
- Rich Text Editor using ReactQuill
- Image Upload support
- Tags system
- Draft support
- SEO-friendly URLs

### 💬 Answer System
- Voting system for questions and answers
- Accept answers
- Reply to answers
- Edit/Delete answers
- Real-time updates

### 🔍 Search & Filtering
- Search by title, content, and tags
- Filters: latest, oldest, unanswered
- Pagination
- Sorting options

### 📊 User Dashboard
- Personal statistics
- Manage posted questions
- Activity tracking

---

## 🚀 Tech Stack

### Frontend
- React 18 with TypeScript
- Vite
- Tailwind CSS
- React Router
- React Quill
- Lucide React
- React Helmet

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Multer
- CORS
- DOMPurify

### Authentication
- Clerk

---

## 🎯 API Endpoints

### Questions
- GET /api/questions
- GET /api/questions/:slug
- POST /api/questions
- PUT /api/questions/:slug
- DELETE /api/questions/:slug
- POST /api/questions/:id/vote
- POST /api/questions/user

### Answers
- GET /api/answers/question/:questionId
- GET /api/answers/:id
- POST /api/answers
- PUT /api/answers/:id
- DELETE /api/answers/:id
- POST /api/answers/:id/vote
- POST /api/answers/:id/reply
- PATCH /api/answers/:id/accept

---

## 🎨 Design System

### Color Palette
- Primary: Purple gradients
- Secondary: Blue gradients
- Success: Green gradients
- Warning: Yellow/Orange gradients
- Error: Red gradients

### Typography
- Inter Font
- Bold headings
- Readable body text

### Components
- Cards
- Buttons
- Forms
- Tags
- Modals

---

## 🛠️ Installation

### Backend Setup

```bash
cd backend
npm install
npm start
