import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Star,
  Code2,
  Monitor,
  Database,
  Cloud,
  Bot,
  Palette,
  Globe,
  Phone,
} from "lucide-react";

export const metadata = {
  title: "Built by JLang Development | Muskingum Materials",
  description:
    "This website was designed and developed by JLang Development — Jordan Lang, Web Developer & IT Specialist based in Zanesville, OH.",
  robots: { index: false },
};

const CORE_SKILLS = [
  "HTML / CSS",
  "JavaScript",
  "Full Stack Development",
  "Adobe Creative Suite",
  "Brand Identity",
  "Responsive Design",
  "User Experience",
  "WordPress",
  "Small-Business Marketing",
  "Digital Media (TV/Radio/Print)",
];

const EMERGING_SKILLS = [
  "AI / Machine Learning",
  "Cloud Computing",
  "DevOps",
  "Mobile Development",
  "Progressive Web Apps",
  "Open-Source Projects",
  "Self-Hosted Solutions",
];

const TECH_STACK = [
  { label: "Next.js / React", icon: Globe, color: "text-blue-500" },
  { label: "Node.js", icon: Code2, color: "text-green-500" },
  { label: "PostgreSQL / Prisma", icon: Database, color: "text-indigo-500" },
  { label: "Tailwind CSS", icon: Palette, color: "text-cyan-500" },
  { label: "Vercel / Cloud", icon: Cloud, color: "text-violet-500" },
  { label: "AI / Anthropic SDK", icon: Bot, color: "text-orange-500" },
  { label: "Stripe Payments", icon: Monitor, color: "text-emerald-500" },
];

const ACHIEVEMENTS = [
  { value: "12+", label: "Years Experience" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "50+", label: "Satisfied Tech Clients" },
  { value: "10+", label: "Websites Deployed" },
];

export default function DeveloperPage() {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
      {/* Facebook-style cover + profile header */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 h-40 md:h-56 w-full relative">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* Profile row */}
      <div className="max-w-[1100px] mx-auto px-4">
        <div className="relative -mt-12 flex flex-col sm:flex-row items-start sm:items-end gap-4 pb-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-b-xl px-6 pt-0 shadow-sm">
          <div className="relative shrink-0 -mt-4">
            <div className="h-24 w-24 rounded-xl border-4 border-white dark:border-stone-900 overflow-hidden bg-white shadow-md">
              <Image
                src="/images/photos/Jlang-dev.png"
                alt="JLang Development logo"
                width={96}
                height={96}
                className="object-contain h-full w-full"
              />
            </div>
          </div>
          <div className="flex-1 pb-2">
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
              JLang Development
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              Jordan Lang · Web Developer &amp; IT Specialist
            </p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Zanesville, OH — Remote Nationwide
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Available for Hire
              </span>
            </div>
          </div>
          <div className="flex gap-2 pb-2">
            <a
              href="mailto:jordolang@gmail.com"
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Contact
            </a>
            <a
              href="https://jlang.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-sm font-medium px-4 py-2 transition-colors"
            >
              <Globe className="h-4 w-4" />
              Portfolio
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </div>
        </div>
      </div>

      {/* Tri-column layout */}
      <div className="max-w-[1100px] mx-auto px-4 py-4">
        <div className="flex gap-4 items-start">

          {/* ── LEFT SIDEBAR ── */}
          <aside className="hidden lg:block w-[260px] shrink-0 space-y-3">
            {/* Stats */}
            <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm p-4 space-y-3">
              <h2 className="font-semibold text-stone-800 dark:text-stone-200 text-sm">
                By the Numbers
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {ACHIEVEMENTS.map((a) => (
                  <div
                    key={a.label}
                    className="text-center rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3"
                  >
                    <p className="text-xl font-bold text-blue-600">{a.value}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {a.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm p-4 space-y-2">
              <h2 className="font-semibold text-stone-800 dark:text-stone-200 text-sm mb-3">
                Quick Links
              </h2>
              {[
                { label: "Portfolio", href: "https://jlang.dev" },
                { label: "Email Jordan", href: "mailto:jordolang@gmail.com" },
              ].map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    l.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="flex items-center justify-between text-sm text-blue-600 hover:underline"
                >
                  {l.label}
                  {l.href.startsWith("http") && (
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  )}
                </a>
              ))}
            </div>

            {/* Core skills */}
            <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm p-4">
              <h2 className="font-semibold text-stone-800 dark:text-stone-200 text-sm mb-3">
                Core Skills (10+ yrs)
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {CORE_SKILLS.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs px-2.5 py-1"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          {/* ── CENTER CONTENT ── */}
          <main className="flex-1 min-w-0 space-y-4">
            {/* Hero ad card */}
            <div className="bg-gradient-to-br from-blue-700 to-blue-500 rounded-xl shadow-sm p-6 text-white">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-lg bg-white/10 border border-white/20 overflow-hidden shrink-0">
                  <Image
                    src="/images/photos/Jlang-dev.png"
                    alt="JLang Development"
                    width={56}
                    height={56}
                    className="object-contain h-full w-full"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-widest text-blue-200 mb-1">
                    Powered by
                  </p>
                  <h2 className="text-2xl font-bold leading-tight mb-1">
                    JLang Development
                  </h2>
                  <p className="text-blue-100 text-sm">
                    Full-stack web applications · E-commerce platforms ·
                    Business automation · AI integration
                  </p>
                </div>
              </div>
              <p className="mt-4 text-blue-50 text-sm leading-relaxed">
                The site you&apos;re using right now — from the satellite map at
                checkout to the AI chat assistant to the admin dashboard — was
                designed and built by Jordan Lang of JLang Development.
                Zanesville-based, remote-capable, and ready for your next
                project.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://jlang.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-white text-blue-700 font-semibold text-sm px-4 py-2 hover:bg-blue-50 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  See Full Portfolio
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
                <a
                  href="mailto:jordolang@gmail.com"
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 border border-blue-400 text-white font-semibold text-sm px-4 py-2 hover:bg-blue-700 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Start a Project
                </a>
              </div>
            </div>

            {/* About */}
            <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-stone-800 dark:text-stone-200 text-base mb-3 flex items-center gap-2">
                <span className="text-blue-500">👋</span> About Jordan Lang
              </h2>
              <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed mb-3">
                Jordan is a passionate web designer and full-stack developer
                with <strong className="text-stone-800 dark:text-stone-200">12+ years of experience</strong> crafting
                beautiful, functional digital experiences. Based in Zanesville,
                OH — available on-site locally and remotely nationwide.
              </p>
              <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed mb-3">
                He specializes in helping small businesses establish a strong
                online presence through custom websites, e-commerce platforms,
                and integrated business tools — combining modern design,
                performance engineering, and strategic marketing consulting.
              </p>
              <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
                Beyond web development, Jordan provides domain configuration,
                local server setup, on-site IT support, and budget-minded
                technology solutions for businesses who value independence from
                expensive vendor lock-in.
              </p>
            </div>

            {/* Services */}
            <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-stone-800 dark:text-stone-200 text-base mb-4">
                What JLang Development Builds
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    title: "Custom Websites",
                    desc: "Branded, responsive websites built for performance and real business results.",
                    icon: Monitor,
                  },
                  {
                    title: "E-Commerce Platforms",
                    desc: "Full-stack storefronts with payments, inventory, email, and admin dashboards.",
                    icon: Globe,
                  },
                  {
                    title: "AI Integration",
                    desc: "Chat assistants, automation pipelines, and AI-powered tooling for your workflow.",
                    icon: Bot,
                  },
                  {
                    title: "IT Consulting",
                    desc: "On-site Zanesville support, domain/server config, and small-business tech strategy.",
                    icon: Code2,
                  },
                ].map((s) => (
                  <div
                    key={s.title}
                    className="flex gap-3 rounded-lg border border-stone-100 dark:border-stone-800 p-3"
                  >
                    <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                      <s.icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800 dark:text-stone-200 text-sm">
                        {s.title}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech stack */}
            <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-stone-800 dark:text-stone-200 text-base mb-4">
                Technology Stack Used on This Site
              </h2>
              <div className="flex flex-wrap gap-2">
                {TECH_STACK.map((t) => (
                  <div
                    key={t.label}
                    className="flex items-center gap-2 rounded-full border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300"
                  >
                    <t.icon className={`h-3.5 w-3.5 ${t.color}`} />
                    {t.label}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-stone-400">
                Next.js App Router · Prisma/Neon Postgres · Sanity CMS · Clerk
                Auth · Stripe Checkout · Postmark · Upstash · Vercel deployment
              </p>
            </div>

            {/* CTA */}
            <div className="bg-stone-800 dark:bg-stone-950 rounded-xl shadow-sm p-6 text-center">
              <div className="flex justify-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 text-amber-400 fill-amber-400"
                  />
                ))}
              </div>
              <p className="text-white font-bold text-lg mb-1">
                Ready to build something like this?
              </p>
              <p className="text-stone-400 text-sm mb-4">
                Whether you need a simple business website or a full e-commerce
                platform, Jordan delivers on time and on budget.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <a
                  href="mailto:jordolang@gmail.com"
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  jordolang@gmail.com
                </a>
                <a
                  href="https://jlang.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-stone-700 hover:bg-stone-600 text-stone-100 font-semibold text-sm px-5 py-2.5 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  jlang.dev
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </div>
            </div>
          </main>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="hidden xl:block w-[240px] shrink-0 space-y-3">
            {/* Hire card */}
            <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  Open to New Projects
                </span>
              </div>
              <ul className="text-xs text-stone-500 dark:text-stone-400 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  On-site — Zanesville, OH
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  Remote — Nationwide
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  Freelance &amp; Contract
                </li>
              </ul>
              <a
                href="mailto:jordolang@gmail.com"
                className="flex items-center justify-center gap-2 w-full rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                Get in Touch
              </a>
            </div>

            {/* Contact */}
            <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm p-4 space-y-2">
              <h3 className="font-semibold text-stone-800 dark:text-stone-200 text-sm">
                Contact
              </h3>
              <a
                href="mailto:jordolang@gmail.com"
                className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 hover:text-blue-600 transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                jordolang@gmail.com
              </a>
              <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
                <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                Zanesville, OH 43701
              </div>
              <a
                href="https://jlang.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 hover:text-blue-600 transition-colors"
              >
                <Globe className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                jlang.dev
                <ExternalLink className="h-3 w-3 opacity-40" />
              </a>
            </div>

            {/* Emerging skills */}
            <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-stone-800 dark:text-stone-200 text-sm mb-3">
                Emerging Focus Areas
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {EMERGING_SKILLS.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 text-xs px-2.5 py-1"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-[11px] text-stone-400 dark:text-stone-600 px-1 leading-relaxed">
              This page is maintained by JLang Development. The Muskingum
              Materials site was built and is maintained by Jordan Lang.{" "}
              <Link href="/" className="hover:underline">
                Back to Muskingum Materials →
              </Link>
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
