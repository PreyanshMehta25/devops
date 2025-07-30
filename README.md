# StackIt - Modern Q&A Platform

A beautiful, modern, and feature-rich Q&A platform for programming questions, built with React, TypeScript, and Node.js.

## ✨ Features

### 🎨 Modern UI/UX
- **Colorful & Vibrant Design**: Purple, pink, and blue gradient theme
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Smooth Animations**: Hover effects, transitions, and micro-interactions
- **Glass Morphism**: Modern backdrop blur effects
- **Custom Scrollbars**: Beautiful gradient scrollbars

### 🔐 Authentication & Authorization
- **Clerk Integration**: Secure user authentication
- **Role-based Access**: Admin and user roles
- **Protected Routes**: Secure access to user-specific features

### 📝 Question Management
- **Rich Text Editor**: ReactQuill with code highlighting
- **Image Upload**: Support for question images (up to 5MB)
- **Tags System**: Colorful gradient tags for categorization
- **Draft Support**: Save questions as drafts
- **SEO-friendly URLs**: Automatic slug generation

### 💬 Answer System
- **Voting System**: Upvote/downvote questions and answers
- **Accept Answers**: Question owners can mark best answers
- **Reply to Answers**: Nested reply system
- **Edit/Delete**: Full CRUD operations for answers
- **Real-time Updates**: Instant feedback and updates

### 🔍 Search & Filtering
- **Smart Search**: Search by title, content, and tags
- **Advanced Filters**: Latest, oldest, unanswered questions
- **Pagination**: Efficient page navigation
- **Sorting Options**: Multiple sorting criteria

### 📊 User Dashboard
- **Personal Statistics**: Question counts, votes, drafts
- **Question Management**: View, edit, delete your questions
- **Activity Tracking**: Monitor your contributions

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Quill** for rich text editing
- **Lucide React** for icons
- **React Helmet** for SEO

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Multer** for file uploads
- **CORS** for cross-origin requests
- **DOMPurify** for content sanitization

### Authentication
- **Clerk** for user management

## 🎯 API Endpoints

### Questions
- `GET /api/questions` - Get all questions (with pagination)
- `GET /api/questions/:slug` - Get single question
- `POST /api/questions` - Create new question
- `PUT /api/questions/:slug` - Update question
- `DELETE /api/questions/:slug` - Delete question
- `POST /api/questions/:id/vote` - Vote on question
- `POST /api/questions/user` - Get user's questions

### Answers
- `GET /api/answers/question/:questionId` - Get answers for question
- `GET /api/answers/:id` - Get single answer
- `POST /api/answers` - Create new answer
- `PUT /api/answers/:id` - Update answer
- `DELETE /api/answers/:id` - Delete answer
- `POST /api/answers/:id/vote` - Vote on answer
- `POST /api/answers/:id/reply` - Reply to answer
- `PATCH /api/answers/:id/accept` - Accept answer

## 🎨 Design System

### Color Palette
- **Primary**: Purple gradients (#8b5cf6 to #ec4899)
- **Secondary**: Blue gradients (#3b82f6 to #1d4ed8)
- **Success**: Green gradients (#10b981 to #059669)
- **Warning**: Yellow/Orange gradients (#f59e0b to #d97706)
- **Error**: Red gradients (#ef4444 to #dc2626)

### Typography
- **Font**: Inter (Google Fonts)
- **Headings**: Bold with gradient text effects
- **Body**: Clean, readable text with proper line height

### Components
- **Cards**: Rounded corners with shadows and hover effects
- **Buttons**: Gradient backgrounds with hover animations
- **Forms**: Modern input styling with focus states
- **Tags**: Colorful gradient badges
- **Modals**: Glass morphism effects

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- MongoDB
- Clerk account

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### Environment Variables

#### Backend (.env)
```env
MONGODB_URI=your_mongodb_connection_string
PORT=5001
```

#### Frontend (.env)
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:5001
```

## 🎯 Key Features Implementation

### 1. Modern UI Components
- **Gradient Backgrounds**: Beautiful color transitions
- **Hover Effects**: Smooth scale and shadow animations
- **Loading States**: Custom spinners and skeleton screens
- **Toast Notifications**: Success/error feedback
- **Mobile Responsive**: Perfect on all screen sizes

### 2. Enhanced User Experience
- **Real-time Feedback**: Immediate response to user actions
- **Error Handling**: Graceful error messages and recovery
- **Loading States**: Clear indication of processing
- **Accessibility**: Proper ARIA labels and keyboard navigation

### 3. Advanced Functionality
- **Image Upload**: Drag & drop with preview
- **Rich Text Editing**: Code blocks, lists, formatting
- **Voting System**: Prevent duplicate votes
- **Answer Management**: Full CRUD with ownership checks
- **Search & Filter**: Efficient querying and filtering

## 🚀 Performance Optimizations

- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Automatic resizing and compression
- **Caching**: Efficient data caching strategies
- **Bundle Splitting**: Optimized code splitting
- **CDN Ready**: Static assets optimized for CDN

## 🔒 Security Features

- **Content Sanitization**: DOMPurify for XSS prevention
- **Input Validation**: Comprehensive form validation
- **Authentication**: Secure Clerk integration
- **Authorization**: Role-based access control
- **CORS**: Proper cross-origin configuration

## 📱 Mobile Experience

- **Touch-friendly**: Large touch targets
- **Responsive Design**: Adaptive layouts
- **Mobile Navigation**: Collapsible menu
- **Touch Gestures**: Swipe and tap interactions
- **Performance**: Optimized for mobile devices

## 🎨 Customization

The application is highly customizable:

- **Theme Colors**: Easy color scheme changes
- **Component Styling**: Modular CSS architecture
- **Layout Options**: Flexible grid system
- **Animation Settings**: Configurable transitions
- **Typography**: Customizable font settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Clerk** for authentication
- **Tailwind CSS** for styling
- **Lucide** for icons
- **React Quill** for rich text editing
- **Vite** for build tooling

---

**StackIt** - Where questions meet beautiful answers! 🚀