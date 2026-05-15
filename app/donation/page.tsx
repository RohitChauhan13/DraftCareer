/* eslint-disable @next/next/no-img-element */
import { BadgeIndianRupee, HeartHandshake, QrCode, ShieldCheck, Sparkles } from "lucide-react";
import { DonationUnavailable } from "@/components/donation-unavailable";
import { MainNav } from "@/components/main-nav";
import { getCurrentUser } from "@/lib/auth";
import { createUpiUrl, getDonationSettings } from "@/lib/donation";

export const dynamic = "force-dynamic";

const presetAmounts = [49, 99, 199];

export default async function DonationPage() {
  const user = await getCurrentUser();
  const settings = await getDonationSettings();
  if (!settings.isPageVisible) return <DonationUnavailable />;

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <MainNav user={user ? { name: user.name, email: user.email } : null} showDonation={settings.isPageVisible} />

      <section className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
        <div className="mx-auto grid max-w-7xl items-start gap-8 px-4 py-10 sm:px-8 lg:min-h-[calc(100vh-82px)] lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-10 lg:py-16">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground shadow-sm sm:px-4 sm:text-sm">
              <HeartHandshake className="text-primary" size={17} />
              Donate to independent building
            </div>
            <h1 className="mt-5 text-4xl font-black leading-[1.06] tracking-normal sm:mt-6 sm:text-6xl lg:text-7xl">
              Help keep DraftCareer fast, focused, and useful.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">
              If DraftCareer helped you create a better resume, a small contribution helps us keep improving templates, exports, and the builder experience.
            </p>

            {settings.isQrVisible ? (
              <>
                <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
                  <a className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-black text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:h-14 sm:px-7 sm:text-base" href={settings.upiUrl}>
                    <BadgeIndianRupee size={20} /> Open UPI App
                  </a>
                  <div className="inline-flex h-12 min-w-0 items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-bold sm:h-14 sm:px-7 sm:text-base">
                    {settings.upiId}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-3">
                  {presetAmounts.map((amount) => (
                    <a
                      className="rounded-md border border-border bg-surface px-2 py-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:bg-muted sm:px-4 sm:py-4"
                      href={createUpiUrl(settings.upiId, amount)}
                      key={amount}
                    >
                      <span className="block text-xl font-black sm:text-2xl">Rs {amount}</span>
                      <span className="mt-1 block text-xs font-semibold text-muted-foreground">quick donation</span>
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-7 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:mt-8">
                <h2 className="text-xl font-black">Donations temporarily disabled</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  We are not accepting contributions right now. Please check back later.
                </p>
              </div>
            )}
          </div>

          <div className="relative z-10">
            <div className="absolute inset-0 hidden translate-x-4 translate-y-4 rounded-[2rem] border border-primary/25 sm:block" />
            <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-[0_26px_90px_rgba(15,23,42,0.16)] dark:shadow-[0_26px_90px_rgba(0,0,0,0.38)] sm:rounded-[2rem] sm:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-border pb-4 sm:pb-5">
                <div>
                  <p className="text-xs font-bold uppercase text-primary sm:text-sm">Donation QR</p>
                  <h2 className="mt-1 text-xl font-black sm:text-2xl">Scan and donate</h2>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-primary sm:h-12 sm:w-12">
                  <QrCode size={22} />
                </div>
              </div>

              <div className="grid place-items-center px-0 py-6 sm:px-4 sm:py-10">
                {settings.isQrVisible ? (
                  <div className="relative rounded-2xl border border-border bg-white p-3 shadow-inner sm:rounded-[1.5rem] sm:p-5">
                    <div className="absolute inset-0 rounded-[1.5rem] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.75),transparent)] opacity-60 [animation:donation-scan_3s_ease-in-out_infinite]" />
                    <img
                      alt={`UPI QR for ${settings.upiId}`}
                      className="relative h-56 w-56 rounded-lg sm:h-72 sm:w-72"
                      height={288}
                      src={settings.qrUrl}
                      width={288}
                    />
                  </div>
                ) : (
                  <div className="grid h-64 w-full max-w-sm place-items-center rounded-[1.5rem] border border-dashed border-border bg-muted p-6 text-center sm:h-80 sm:p-8">
                    <div>
                      <QrCode className="mx-auto text-muted-foreground" size={42} />
                      <h3 className="mt-4 text-lg font-black">Donations temporarily disabled</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">We are not accepting contributions right now. Please check back later.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2 sm:pt-5">
                <div className="flex items-center gap-3 rounded-md bg-muted p-3 sm:p-4">
                  <ShieldCheck className="text-emerald-600" size={22} />
                  <p className="text-sm font-semibold">Pay directly through your UPI app.</p>
                </div>
                <div className="flex items-center gap-3 rounded-md bg-muted p-3 sm:p-4">
                  <Sparkles className="text-accent" size={22} />
                  <p className="text-sm font-semibold">Every small donation helps the product improve.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
