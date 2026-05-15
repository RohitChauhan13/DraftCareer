# DraftCareer

DraftCareer is a full-stack resume builder for creating, saving, customizing, and exporting professional resumes. It gives users a focused workspace for building ATS-friendly resumes, choosing templates, managing saved resume history, and downloading polished PDFs.

## Why DraftCareer

Many resume tools feel either too rigid or too generic. DraftCareer is designed to make the resume-building flow fast, clear, and credible: users can sign up, verify their account, build a resume section by section, preview it live, switch templates, save progress, and export a final PDF when ready.

## Features

- User signup, login, logout, password reset, and email OTP verification
- Secure password hashing with `bcryptjs`
- JWT-based session handling with HTTP-only cookies
- Dashboard for saved resumes
- Create, edit, duplicate, and delete resumes
- Structured resume sections for personal details, skills, experience, projects, education, certifications, and achievements
- Template and theme selection
- Live resume preview
- PDF export using `html2pdf.js`
- PostgreSQL persistence through Prisma
- Validation with Zod
- Responsive UI built with Tailwind CSS

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **UI:** React 19, Tailwind CSS, Lucide React, Framer Motion
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** Custom JWT authentication, bcrypt password hashing, OTP verification
- **Email:** Brevo SMTP API
- **Validation:** Zod
- **PDF Export:** html2pdf.js
- **Language:** TypeScript

## Getting Started

### Prerequisites

- Node.js 20 or newer recommended
- npm
- PostgreSQL database
- Brevo account/API key for production email sending

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="your-long-random-secret-at-least-24-characters"
BREVO_API_KEY="your-brevo-api-key"
BREVO_SENDER_EMAIL="your-verified-sender@example.com"
BREVO_SENDER_NAME="DraftCareer"
```

Notes:

- `DATABASE_URL` is required by Prisma.
- `JWT_SECRET` must be at least 24 characters.
- Brevo variables are needed for production OTP emails. In development, OTP codes are logged to the console when Brevo is not configured.
- Users default to the `user` role. Set your own `users.role` value to `admin` directly in the database to manage donation settings from `/account`.

### Admin and Donation Settings

The `/donation` donation page is controlled from the database. After migrations run, every account has `users.role = 'user'` by default. To make your account an admin, update your user row directly:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Admin users can open `/account` to manage:

- Show or hide the `/donation` page
- UPI ID
- Show or hide only the QR code

### Public Resume Links

Saved resumes can be made public from the builder. When public sharing is enabled, the app creates a random link like:

```text
/share/9f1a2b3c4d5e6f70
```

Turning sharing off keeps the slug reserved but shows a private/unavailable page to visitors.

### Database Setup

Generate the Prisma client:

```bash
npm run prisma:generate
```

Run migrations:

```bash
npm run prisma:migrate
```

### Development

```bash
npm run dev
```

The app will start on the default Next.js development port, usually `http://localhost:3000`.

### Production Build

```bash
npm run build
npm run start
```

## Project Structure

```text
app/                 Next.js routes, pages, layouts, and API handlers
components/          Reusable UI and feature components
lib/                 Auth, email, Prisma, validation, and utility helpers
prisma/              Database schema and migrations
templates/           Resume templates, themes, and preview rendering
types/               Shared TypeScript types
utils/               Resume data transformation helpers
```

## Core Workflows

### Authentication

Users can create an account, verify their email with an OTP, log in, reset their password, and maintain a session through secure cookies.

### Resume Builder

The builder stores resume data in structured sections, making it easier to edit individual parts of a resume while keeping the preview and saved database format consistent.

### Templates and Export

Users can choose a template/theme, preview the result, save changes, and export the resume as a PDF.

## Deployment Notes

This project can be deployed on platforms that support Next.js and PostgreSQL, such as Vercel plus a managed Postgres provider. Before deploying, configure all required environment variables and run Prisma migrations against the production database.

## Repository

GitHub: https://github.com/RohitChauhan13/DraftCareer

## License

This project is currently private/proprietary. Add a license file if you plan to distribute it publicly.
