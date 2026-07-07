import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  ExternalLink,
} from "lucide-react";
import { BUSINESS_INFO } from "@/data/business";
import { GoogleReviewWidget } from "./google-review-widget";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: BUSINESS_INFO.social.facebook,
    icon: Facebook,
    hoverColor: "hover:text-[#1877F2]",
  },
  {
    name: "Google Business",
    href: BUSINESS_INFO.social.google,
    icon: GoogleIcon,
    hoverColor: "hover:text-[#4285F4]",
  },
];

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Data Use & Protection", href: "/data-use-policy" },
  { label: "Delete My Data", href: "/data-deletion" },
];

export function Footer() {
  return (
    <footer className="relative bg-stone-900 text-stone-300">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"
      />
      <div className="container py-12 sm:py-14">
        {/* ── Top row: Brand · Quick Links · Calculators · Business Hours ── */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand + social */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/muskingum-materials-logo-red.png"
                alt="Muskingum Materials"
                width={320}
                height={168}
                className="h-16 w-auto"
              />
            </Link>
            <p className="text-sm text-stone-400 mb-5">
              {BUSINESS_INFO.tagline}
            </p>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-stone-800 text-stone-400 ${social.hoverColor} transition-all hover:-translate-y-0.5 hover:bg-stone-700`}
                  aria-label={social.name}
                  title={social.name}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-amber-500 transition-colors">Products</Link></li>
              <li><Link href="/services" className="hover:text-amber-500 transition-colors">Services</Link></li>
              <li><Link href="/gallery" className="hover:text-amber-500 transition-colors">Gallery</Link></li>
              <li><Link href="/about" className="hover:text-amber-500 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-amber-500 transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-amber-500 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Calculators */}
          <div>
            <h3 className="text-white font-semibold mb-4">Calculators</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/calculators" className="hover:text-amber-500 transition-colors">All Calculators</Link></li>
              <li><Link href="/calculators/gravel-calculator" className="hover:text-amber-500 transition-colors">Gravel Calculator</Link></li>
              <li><Link href="/calculators/tons-to-yards" className="hover:text-amber-500 transition-colors">Tons ↔ Yards Converter</Link></li>
              <li><Link href="/calculators/coverage-chart" className="hover:text-amber-500 transition-colors">Coverage Chart</Link></li>
            </ul>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="text-white font-semibold mb-4">Business Hours</h3>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Mon - Fri</span>
              </li>
              <li className="pl-6">7:30 AM - 4:00 PM</li>
              <li className="pl-6 text-stone-500 mt-1">Sat - Sun: Closed</li>
            </ul>
            <div className="mt-5 pt-4 border-t border-stone-800">
              <p className="text-xs font-medium text-stone-400 mb-2">Find Us Online</p>
              <div className="space-y-1.5">
                <a
                  href={BUSINESS_INFO.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-stone-500 hover:text-[#1877F2] transition-colors"
                >
                  <Facebook className="h-3.5 w-3.5" />
                  Facebook
                  <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                </a>
                <a
                  href={BUSINESS_INFO.social.google}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-stone-500 hover:text-[#4285F4] transition-colors"
                >
                  <GoogleIcon className="h-3.5 w-3.5" />
                  Google Business Profile
                  <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom row: Reviews · Legal & Policies · Contact Info (landscape cards) ── */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Reviews */}
          <GoogleReviewWidget />

          {/* Legal & Policies — links flow horizontally to keep the card landscape */}
          <div className="rounded-xl border border-white/10 bg-stone-800/40 p-5">
            <h3 className="text-white font-semibold mb-4">Legal &amp; Policies</h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-amber-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info — items wrap horizontally to keep the card landscape */}
          <div className="rounded-xl border border-white/10 bg-stone-800/40 p-5">
            <h3 className="text-white font-semibold mb-4">Contact Info</h3>
            <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                <div>
                  <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`} className="hover:text-amber-500 transition-colors">
                    {BUSINESS_INFO.phone}
                  </a>
                  <br />
                  <a href={`tel:${BUSINESS_INFO.altPhone.replace(/\D/g, "")}`} className="hover:text-amber-500 transition-colors">
                    {BUSINESS_INFO.altPhone}
                  </a>
                </div>
              </div>
              <a
                href={`mailto:${BUSINESS_INFO.email}`}
                className="flex items-center gap-2 hover:text-amber-500 transition-colors"
              >
                <Mail className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="break-all">{BUSINESS_INFO.email}</span>
              </a>
              <a
                href={BUSINESS_INFO.social.google}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 hover:text-amber-500 transition-colors"
              >
                <MapPin className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                <span>
                  {BUSINESS_INFO.address}<br />
                  {BUSINESS_INFO.city}, {BUSINESS_INFO.state} {BUSINESS_INFO.zip}
                  <ExternalLink className="h-3 w-3 inline ml-1 opacity-50" />
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-10 pt-8 space-y-3 text-xs text-stone-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>&copy; {new Date().getFullYear()} Muskingum Materials. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <Link href="/privacy" className="hover:text-stone-300 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-stone-300 transition-colors">Terms</Link>
              <Link href="/data-use-policy" className="hover:text-stone-300 transition-colors">Data Use</Link>
              <Link href="/data-deletion" className="hover:text-stone-300 transition-colors">Delete My Data</Link>
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-stone-500 ${social.hoverColor} transition-colors`}
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <p className="text-center text-stone-600">
            Designed &amp; built by{" "}
            <Link href="/developer" className="hover:text-stone-400 transition-colors underline underline-offset-2">
              JLang Development
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
