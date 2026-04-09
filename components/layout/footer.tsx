import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Mountain,
} from "lucide-react";
import { BUSINESS_INFO } from "@/data/business";

export function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Mountain className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-lg font-bold text-white">Muskingum</p>
                <p className="text-xs text-stone-400">Materials</p>
              </div>
            </div>
            <p className="text-sm text-stone-400 mb-4">
              {BUSINESS_INFO.tagline}
            </p>
            <div className="flex gap-3">
              {BUSINESS_INFO.social.facebook && (
                <a
                  href={BUSINESS_INFO.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-400 hover:text-amber-500 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-amber-500 transition-colors">Products & Pricing</Link></li>
              <li><Link href="/services" className="hover:text-amber-500 transition-colors">Services</Link></li>
              <li><Link href="/gallery" className="hover:text-amber-500 transition-colors">Gallery</Link></li>
              <li><Link href="/about" className="hover:text-amber-500 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-amber-500 transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
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
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-amber-500 shrink-0" />
                <a href={`mailto:${BUSINESS_INFO.email}`} className="hover:text-amber-500 transition-colors">
                  {BUSINESS_INFO.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                <span>
                  {BUSINESS_INFO.address}<br />
                  {BUSINESS_INFO.city}, {BUSINESS_INFO.state} {BUSINESS_INFO.zip}
                </span>
              </li>
            </ul>
          </div>

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
            <div className="mt-4 text-xs text-stone-500">
              <p>Accepted: Visa, Mastercard, Discover, Apple Pay</p>
              <p className="mt-1">Tax: 7.25% | Credit Processing: 4.5%</p>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-8 pt-8 text-center text-xs text-stone-500">
          <p>&copy; {new Date().getFullYear()} Muskingum Materials. All rights reserved.</p>
          <p className="mt-1">
            {BUSINESS_INFO.address}, {BUSINESS_INFO.city}, {BUSINESS_INFO.state} {BUSINESS_INFO.zip}
          </p>
        </div>
      </div>
    </footer>
  );
}
