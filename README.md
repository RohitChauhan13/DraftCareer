# DraftCareer

DraftCareer is a full-stack resume builder built with Next.js and TypeScript. It helps users create, save, preview, customize, and export ATS-friendly resumes from structured sections like experience, projects, skills, education, certifications, and achievements.

## Why DraftCareer

DraftCareer strikes a balance between guided structure and visual flexibility. Users sign up, verify with OTP, manage resumes in a dashboard, pick templates, and export PDF-ready resumes without leaving the browser.

## Features

- Email-based signup, login, logout, password reset, and OTP verification
- Secure password hashing with `bcryptjs`
- JWT session cookies and custom auth logic
- Resume dashboard with create, edit, duplicate, and delete actions
- Structured resume sections for personal details, work history, projects, education, certifications, and achievements
- Template and theme selection with live preview
- Public resume sharing via secure slugs
- Donation page visibility and admin-controlled donation settings
- Feedback collection and admin review pages
- AI enhancement controls and usage tracking
- Custom template tag management
- PDF export using `html2pdf.js`
- PostgreSQL persistence with Prisma
- Validation with Zod
- Responsive UI with Tailwind CSS

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **UI:** React 19, Tailwind CSS, Lucide React, Framer Motion, Sonner
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT, bcrypt password hashing, OTP verification
- **Email:** Brevo SMTP API
- **PDF Export:** html2pdf.js
- **Validation:** Zod
- **Language:** TypeScript

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL database
- Brevo account/API key for production email sending
- (Optional) Groq API key for AI-powered enhancements

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
NEXT_PUBLIC_SITE_URL="https://your-deployment-url.com"
GROQ_API_KEY="your-groq-api-key"
GROQ_MODELS="qwen/qwen3-32b,llama-3.3-70b-versatile,meta-llama/llama-4-scout-17b-16e-instruct,groq/compound-mini,groq/compound"
```

Notes:

- `DATABASE_URL` is required by Prisma.
- `JWT_SECRET` is required for authentication and should be long and random.
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `BREVO_SENDER_NAME` are used for OTP email delivery.
- In development, OTP codes are logged to the console when Brevo is not configured.
- `NEXT_PUBLIC_SITE_URL` is used for the public site URL in robots and sitemap generation.
- `GROQ_API_KEY` and `GROQ_MODELS` are optional and enable AI enhancement flows. `GROQ_MODELS` is a comma-separated fallback pool; the app estimates request size and starts with a suitable model before falling back.
- Users default to the `user` role. Update `users.role` to `admin` directly in the database for admin access.

### Admin and Donation Settings

The `/donation` page is governed by database-controlled settings. By default, users are created with `role = 'user'`. To grant admin access:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Admin users can manage:

- Donation page visibility
- UPI ID and donation instructions
- QR-only donation display

### Public Resume Links

Resumes can be made public from the builder. Public sharing generates a link like:

```text
/share/9f1a2b3c4d5e6f70
```

If sharing is disabled, the slug remains reserved and visitors see a private/unavailable page.

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

Open the app at `http://localhost:3000` by default.

### Production Build

```bash
npm run build
npm run start
```

## Project Structure

```text
app/                 Next.js routes, pages, layouts, and API handlers
components/          Reusable UI and feature components
lib/                 Auth, email, Prisma, validation, and helper logic
prisma/              Database schema and migrations
templates/           Resume template rendering and preview code
types/               Shared TypeScript type declarations
utils/               Resume data transformation utilities
```

## Core Workflows

### Authentication

Users sign up, verify email with OTP, log in, reset passwords, and keep sessions with secure cookies.

### Resume Builder

Resume data is stored in modular sections, making it easy to update details, switch templates, and maintain a live preview.

### Templates and Export

Users can choose from resume templates, adjust presentation settings, and export a PDF from the browser.

## Deployment Notes

Deploy on any platform that supports Next.js and PostgreSQL, such as Vercel with a managed Postgres provider. Set the required environment variables and run Prisma migrations in the production database.

## Repository

GitHub: https://github.com/RohitChauhan13/DraftCareer

## License

This project is currently private/proprietary. Add a license file if you plan to distribute it publicly.
