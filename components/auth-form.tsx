"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { emailSchema, passwordSchema, signupSchema } from "@/lib/validations";
import { WordLoader } from "@/components/page-loader";
import { ThemeToggle } from "@/components/theme-toggle";

type Mode = "login" | "signup";
type View = Mode | "forgot";
type Errors = Partial<Record<"name" | "email" | "password" | "otp", string>>;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [view, setView] = useState<View>(mode);
  const [loading, setLoading] = useState(false);
  const [needsOtp, setNeedsOtp] = useState(false);
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body =
      view === "signup"
        ? {
            name: String(form.get("name") ?? ""),
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? "")
          }
        : {
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? "")
          };

    const validation =
      view === "signup"
        ? signupSchema.safeParse(body)
        : z.object({ email: emailSchema, password: z.string().min(1, "Password is required.") }).safeParse(body);
    if (!validation.success) {
      setErrors(fromZod(validation.error));
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${view}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validation.data)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      if (view === "signup") {
        setEmail(validation.data.email);
        setNeedsOtp(true);
        toast.success("OTP sent");
      } else {
        router.replace("/dashboard");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Try again");
    } finally {
      setLoading(false);
    }
  }

  async function sendResetOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = emailSchema.safeParse(String(form.get("email") ?? ""));
    if (!parsed.success) {
      setErrors({ email: parsed.error.issues[0]?.message ?? "Enter a valid email." });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: parsed.data, purpose: "password_reset" })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setEmail(parsed.data);
      setNeedsOtp(true);
      toast.success("OTP sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "OTP failed");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(otp: string, password?: string) {
    const nextErrors: Errors = {};
    if (!/^\d{6}$/.test(otp)) nextErrors.otp = "Enter the 6-digit OTP.";
    if (view === "forgot") {
      const passwordResult = passwordSchema.safeParse(password ?? "");
      if (!passwordResult.success) nextErrors.password = passwordResult.error.issues[0]?.message;
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const response = await fetch(view === "forgot" ? "/api/auth/reset-password" : "/api/auth/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          purpose: view === "forgot" ? "password_reset" : "email_verification",
          ...(view === "forgot" ? { password } : {})
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success(view === "forgot" ? "Password reset" : "Verified");
      if (view === "forgot") {
        setView("login");
        setNeedsOtp(false);
      } else {
        router.replace("/dashboard");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  const title = needsOtp
    ? view === "forgot"
      ? "Reset password"
      : "Verify email"
    : view === "signup"
      ? "Create account"
      : view === "forgot"
        ? "Forgot password"
        : "Welcome back";

  return (
    <main className="min-h-screen bg-background text-foreground">
      {loading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <WordLoader
            label={
              needsOtp
                ? "Verifying"
                : view === "forgot"
                  ? "Sending"
                  : view === "signup"
                    ? "Creating"
                    : "Logging"
            }
            words={
              needsOtp
                ? ["OTP", "account", "session", "security", "access"]
                : view === "forgot"
                  ? ["OTP", "email", "security", "reset", "link"]
                  : view === "signup"
                    ? ["account", "email", "profile", "workspace", "access"]
                    : ["account", "session", "dashboard", "resumes", "workspace"]
            }
          />
        </div>
      )}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link className="text-xl font-black tracking-normal text-foreground" href="/">
          DraftCareer
        </Link>
        <ThemeToggle />
      </header>
      <section className="grid min-h-[calc(100vh-72px)] place-items-center px-4 pb-8 sm:px-6">
      <Card className="w-full max-w-md overflow-hidden">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
              {needsOtp ? <ShieldCheck size={21} /> : <Mail size={21} />}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold">{title}</h1>
              <p className="text-sm text-muted-foreground">
                {needsOtp ? "Enter the OTP sent to your inbox." : "Build and manage professional resumes."}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {needsOtp ? (
            <OtpStep
              errors={errors}
              loading={loading}
              mode={view}
              onBack={() => {
                setNeedsOtp(false);
                setErrors({});
              }}
              onVerify={verifyOtp}
              showPassword={showPassword}
              togglePassword={() => setShowPassword((value) => !value)}
            />
          ) : view === "forgot" ? (
            <form className="space-y-4" onSubmit={sendResetOtp} noValidate>
              <FieldError message={errors.email}>
                <Input name="email" type="email" placeholder="Email" autoComplete="email" required />
              </FieldError>
              <Button className="w-full" loading={loading} loadingText="Sending OTP">Send reset OTP</Button>
              <button className="w-full text-center text-sm font-medium text-primary" type="button" onClick={() => setView("login")}>
                Back to login
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={submit} noValidate>
              {view === "signup" && (
                <FieldError message={errors.name}>
                  <Input name="name" placeholder="Full name" autoComplete="name" required />
                </FieldError>
              )}
              <FieldError message={errors.email}>
                <Input name="email" type="email" placeholder="Email" autoComplete="email" required onChange={(event) => setEmail(event.target.value)} />
              </FieldError>
              <FieldError message={errors.password}>
                <PasswordInput show={showPassword} toggle={() => setShowPassword((value) => !value)} autoComplete={view === "signup" ? "new-password" : "current-password"} />
              </FieldError>
              {view === "login" && (
                <button className="text-sm font-medium text-primary" type="button" onClick={() => { setView("forgot"); setErrors({}); }}>
                  Forgot password?
                </button>
              )}
              <Button className="w-full" loading={loading} loadingText={view === "signup" ? "Creating account" : "Logging in"}>
                {view === "signup" ? "Create account" : "Log in"}
              </Button>
              <p className="text-center text-sm leading-6 text-muted-foreground">
                {view === "signup" ? "Already have an account? " : "New here? "}
                <Link className="font-medium text-primary" href={view === "signup" ? "/login" : "/signup"} replace>
                  {view === "signup" ? "Log in" : "Create account"}
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
      </section>
    </main>
  );
}

function OtpStep({
  errors,
  loading,
  mode,
  onBack,
  onVerify,
  showPassword,
  togglePassword
}: {
  errors: Errors;
  loading: boolean;
  mode: View;
  onBack: () => void;
  onVerify: (otp: string, password?: string) => void;
  showPassword: boolean;
  togglePassword: () => void;
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function updateDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < refs.current.length - 1) refs.current[index + 1]?.focus();
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onVerify(digits.join(""), password);
      }}
      noValidate
    >
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
        {digits.map((digit, index) => (
          <input
            aria-label={`OTP digit ${index + 1}`}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            className="h-11 min-w-0 rounded-md border border-border bg-surface text-center text-lg font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:h-12"
            inputMode="numeric"
            key={index}
            maxLength={1}
            name={`otp-${index}`}
            pattern="[0-9]"
            ref={(element) => {
              refs.current[index] = element;
            }}
            value={digit}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !digits[index] && index > 0) refs.current[index - 1]?.focus();
            }}
            onPaste={(event) => {
              event.preventDefault();
              const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
              if (!pasted) return;
              const next = ["", "", "", "", "", ""];
              pasted.split("").forEach((item, pastedIndex) => {
                next[pastedIndex] = item;
              });
              setDigits(next);
              refs.current[Math.min(pasted.length, 6) - 1]?.focus();
            }}
          />
        ))}
      </div>
      {errors.otp && <p className="text-sm text-destructive">{errors.otp}</p>}

      {mode === "forgot" && (
        <FieldError message={errors.password}>
          <div className="space-y-2">
            <PasswordInput
              autoComplete="new-password"
              show={showPassword}
              toggle={togglePassword}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Use 8+ characters with uppercase, lowercase, and a number.</p>
          </div>
        </FieldError>
      )}

      <Button className="w-full" loading={loading} loadingText={mode === "forgot" ? "Resetting password" : "Verifying OTP"}>
        {mode === "forgot" ? "Reset password" : "Verify and continue"}
      </Button>
      <button className="w-full text-center text-sm font-medium text-primary" type="button" onClick={onBack}>
        Back
      </button>
    </form>
  );
}

function PasswordInput({
  autoComplete,
  show,
  toggle,
  value,
  onChange
}: {
  autoComplete: string;
  show: boolean;
  toggle: () => void;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <div className="relative">
      <Input
        autoComplete={autoComplete}
        className="pr-11"
        name="password"
        onChange={onChange}
        placeholder="Password"
        required
        type={show ? "text" : "password"}
        value={value}
      />
      <button
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted"
        type="button"
        onClick={toggle}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function FieldError({ children, message }: { children: React.ReactNode; message?: string }) {
  return (
    <div>
      {children}
      {message && <p className="mt-1 text-sm text-destructive">{message}</p>}
    </div>
  );
}

function fromZod(error: z.ZodError): Errors {
  const fields = error.flatten().fieldErrors;
  return {
    name: fields.name?.[0],
    email: fields.email?.[0],
    password: fields.password?.[0],
    otp: fields.otp?.[0]
  };
}
