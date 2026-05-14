# Production Grade AI Resume Builder SaaS - Full Project Prompt

## Project Overview

Build a **production-grade Resume Builder SaaS platform** where users can:

- Sign up/login securely
- Verify email using OTP via Brevo
- Create professional industry-ready resumes
- Choose from multiple templates
- Edit resumes in real-time
- Preview resumes before download
- Download ATS-friendly PDF resumes
- Save multiple resumes
- Edit resumes later

The platform should be modern, fast, scalable, mobile responsive, and production-ready.

---

# Tech Stack

## Frontend
- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion

## Backend
- Next.js Server Actions / API Routes

## Database
- PostgreSQL (Supabase)

## ORM
- Prisma ORM

## Authentication
- Custom JWT Authentication
- Email OTP verification using Brevo

## PDF Generation
- @react-pdf/renderer

## Deployment
- Vercel

---

# Core Features

## Authentication System

### Signup
- User enters:
  - Name
  - Email
  - Password

### OTP Verification
- Generate 6-digit OTP
- Send OTP using Brevo API
- OTP expiry: 5 minutes
- Rate limit OTP requests

### Login
- Email + Password
- JWT/session-based auth

### Forgot Password
- Send reset OTP/email

---

# Dashboard

After login, user should see:

- Create Resume button
- List of saved resumes
- Resume thumbnails/previews
- Edit resume
- Duplicate resume
- Delete resume

---

# Resume Builder

## Resume Sections

### Personal Information
- Full Name
- Email
- Phone
- Location
- LinkedIn
- GitHub
- Portfolio

### Professional Summary
- AI-generated suggestions
- Character limit indicator

### Skills
- Add skill chips
- Skill suggestions dropdown
- Categories:
  - Frontend
  - Backend
  - Database
  - DevOps
  - Languages
  - Tools

### Education
- College Name
- Degree
- CGPA
- Start/End Date

### Experience
- Company
- Role
- Duration
- Description
- Add multiple experiences

### Projects
- Project Name
- Description
- Technologies Used
- GitHub Link
- Live Link

### Certifications
- Certification Name
- Provider
- Date

### Achievements
- Add achievements dynamically

---

# Resume Templates

Create at least:

1. Modern Template
2. ATS-Friendly Template
3. Minimal Template
4. Developer Template

Requirements:
- Fully responsive
- Print optimized
- ATS compatible
- Professional spacing
- Modern typography

---

# Resume Preview

## Features
- Live preview while editing
- Zoom in/out
- Switch templates instantly
- Preview before download

---

# PDF Download

Requirements:
- Generate real PDF
- Selectable text
- ATS-friendly
- High quality export
- Multi-page support

Do NOT use screenshot-to-PDF methods.

Use:
- @react-pdf/renderer

---

# UI/UX Requirements

## Design
- Clean modern UI
- Minimalistic
- Premium SaaS feel

## Components
- Sidebar navigation
- Stepper form
- Progress indicator
- Toast notifications
- Skeleton loaders
- Empty states
- Modal dialogs

## Responsive
- Mobile responsive
- Tablet optimized
- Desktop optimized

---

# Security Requirements

## Passwords
- Hash using bcryptjs

## OTP
- Store hashed OTP
- Expire after 5 minutes

## Rate Limiting
- Prevent spam OTP requests

## Validation
- Use Zod validation

## Environment Variables
Store securely:
- DATABASE_URL
- BREVO_API_KEY
- JWT_SECRET

---

# Suggested Database Schema

## users

```sql
id
name
email
password_hash
email_verified
created_at
```

## otp_verifications

```sql
id
email
otp_hash
expires_at
verified
created_at
```

## resumes

```sql
id
user_id
title
template_id
created_at
updated_at
```

## resume_sections

```sql
id
resume_id
section_type
content_json
created_at
```

---

# API Endpoints

## Auth APIs

```txt
POST /api/auth/signup
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/login
POST /api/auth/forgot-password
```

## Resume APIs

```txt
GET /api/resumes
POST /api/resumes
PUT /api/resumes/:id
DELETE /api/resumes/:id
```

---

# Folder Structure

```txt
/app
/components
/lib
/hooks
/actions
/api
/templates
/prisma
/types
/utils
```

---

# Important Features To Add Later

## AI Features
- AI professional summary
- AI project description enhancement
- ATS score checker
- Grammar improvements
- Job-role based optimization

## Premium Features
- Premium templates
- Multiple downloads
- Public resume link
- Custom themes

## Analytics
- Resume views
- Download count

---

# Development Rules

- Use TypeScript everywhere
- Follow clean architecture
- Reusable components
- Modular folder structure
- Proper error handling
- Proper loading states
- SEO optimized
- Production-ready code only

---

# Final Goal

The final product should feel like:

- Resume.io
- Novoresume
- Reactive Resume
- Enhancv

But with:
- Better UI
- Faster performance
- Modern stack
- AI enhancement features
- ATS optimization

The platform must be scalable and ready for real users.
