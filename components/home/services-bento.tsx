"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Truck, Scale, Calculator, Loader, ArrowRight, Phone } from "lucide-react";
import { BUSINESS_INFO } from "@/data/business";

interface BentoService {
  _id: string;
  title: string;
  description: string;
  icon?: string;
  features: string[];
}

interface ServicesBentoProps {
  services: BentoService[];
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function useCountUp(target: number, active: boolean, duration = 1800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [active, target, duration]);

  return count;
}

function useParallax() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      const img = el.querySelector<HTMLElement>("[data-parallax]");
      if (img) {
        img.style.transform = `translate(${x * 14}px, ${y * 14}px) scale(1.08)`;
      }
    };
    const handleLeave = () => {
      const img = el.querySelector<HTMLElement>("[data-parallax]");
      if (img) img.style.transform = "translate(0,0) scale(1.05)";
    };
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => { el.removeEventListener("mousemove", handleMove); el.removeEventListener("mouseleave", handleLeave); };
  }, []);

  return ref;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  mountain: <Scale className="h-6 w-6" />,
  truck:    <Truck className="h-6 w-6" />,
  calculator: <Calculator className="h-6 w-6" />,
  loader:   <Loader className="h-6 w-6" />,
};

function getIcon(icon?: string) {
  return ICON_MAP[icon ?? ""] ?? <Scale className="h-6 w-6" />;
}

// Scattered dirt particles — pure CSS via inline SVG data-uri background
const DIRT_STYLE = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='60'%3E%3Ccircle cx='12' cy='8' r='2.5' fill='%23a16207' opacity='.35'/%3E%3Ccircle cx='34' cy='18' r='1.8' fill='%2392400e' opacity='.4'/%3E%3Ccircle cx='55' cy='6' r='3' fill='%23b45309' opacity='.3'/%3E%3Ccircle cx='78' cy='22' r='1.5' fill='%23a16207' opacity='.45'/%3E%3Ccircle cx='100' cy='10' r='2' fill='%2378350f' opacity='.5'/%3E%3Ccircle cx='130' cy='5' r='2.8' fill='%23d97706' opacity='.3'/%3E%3Ccircle cx='155' cy='28' r='1.6' fill='%2392400e' opacity='.4'/%3E%3Ccircle cx='180' cy='12' r='3.2' fill='%23a16207' opacity='.35'/%3E%3Ccircle cx='210' cy='8' r='1.9' fill='%2378350f' opacity='.5'/%3E%3Ccircle cx='235' cy='20' r='2.4' fill='%23b45309' opacity='.35'/%3E%3Ccircle cx='260' cy='6' r='2' fill='%23d97706' opacity='.28'/%3E%3Ccircle cx='290' cy='16' r='2.7' fill='%2392400e' opacity='.42'/%3E%3Ccircle cx='315' cy='9' r='1.7' fill='%23a16207' opacity='.38'/%3E%3Ccircle cx='340' cy='24' r='2.2' fill='%2378350f' opacity='.45'/%3E%3Ccircle cx='365' cy='12' r='3' fill='%23b45309' opacity='.32'/%3E%3Ccircle cx='388' cy='7' r='1.8' fill='%23d97706' opacity='.4'/%3E%3Cellipse cx='48' cy='30' rx='8' ry='3' fill='%23a16207' opacity='.15'/%3E%3Cellipse cx='200' cy='35' rx='12' ry='4' fill='%2392400e' opacity='.12'/%3E%3Cellipse cx='320' cy='28' rx='10' ry='3.5' fill='%2378350f' opacity='.15'/%3E%3C/svg%3E")`,
  backgroundRepeat: "repeat-x",
  backgroundSize: "400px 60px",
};

export function ServicesBento({ services }: ServicesBentoProps) {
  const { ref: sectionRef, visible } = useScrollReveal();
  const deliveryRef = useParallax();
  const scalesRef = useParallax();
  const statsVisible = visible;
  const pileCount = useCountUp(15000, statsVisible, 1600);
  const yearsCount = useCountUp(20, statsVisible, 1200);
  const milesCount = useCountUp(50, statsVisible, 1400);

  const deliverySvc = services.find(s => s.icon === "truck") ?? services[0];
  const scalesSvc   = services.find(s => s.icon === "mountain") ?? services[1];
  const calcSvc     = services.find(s => s.icon === "calculator") ?? services[2];
  const loaderSvc   = services.find(s => s.icon === "loader") ?? services[3];

  return (
    <section className="py-20 bg-stone-950 relative overflow-hidden" ref={sectionRef}>
      {/* Ambient grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      <div className="container relative z-10">
        {/* Section header */}
        <div
          className="mb-12 transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-amber-500" />
            <span className="text-amber-500 text-xs font-bold tracking-[0.25em] uppercase">What We Offer</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-none tracking-tight">
            Built for the<br />
            <span className="text-amber-400">Job Site.</span>
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-12 grid-rows-[auto_auto_auto] gap-3 md:gap-4">

          {/* === CELL 1: Big delivery hero (spans 7 cols, 2 rows) === */}
          <div
            ref={deliveryRef}
            className="col-span-12 md:col-span-7 row-span-2 relative rounded-2xl overflow-hidden min-h-[340px] md:min-h-[480px] group cursor-pointer"
            style={{
              transition: "opacity 0.7s 0.05s, transform 0.7s 0.05s",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0) scale(1)" : "translateY(32px) scale(0.97)",
            }}
          >
            {/* Background image with parallax */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <Image
                data-parallax
                src="/images/photos/equipment.jpg"
                alt="Delivery equipment"
                fill
                className="object-cover transition-transform duration-300 ease-out scale-[1.05]"
                style={{ willChange: "transform" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-stone-950/20" />
            </div>

            {/* Dirt scatter at top */}
            <div className="absolute top-0 left-0 right-0 h-[60px] pointer-events-none" style={DIRT_STYLE} />

            {/* Amber accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 p-7 flex flex-col justify-end">
              <div className="mb-auto pt-6">
                <span className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Truck className="h-3.5 w-3.5" />
                  {deliverySvc?.title ?? "Bulk Delivery"}
                </span>
              </div>
              <div>
                <p className="text-white/70 text-sm leading-relaxed mb-5 max-w-xs">
                  {deliverySvc?.description ?? "Full-load delivery across Southeast Ohio."}
                </p>
                <ul className="space-y-2 mb-6">
                  {(deliverySvc?.features ?? []).slice(0, 3).map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 text-amber-400 text-sm font-bold hover:text-amber-300 transition-colors group/link"
                >
                  View pricing
                  <ArrowRight className="h-4 w-4 translate-x-0 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Hover glow border */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/5 group-hover:ring-amber-500/30 transition-all duration-500" />
          </div>

          {/* === CELL 2: Stats cluster (spans 5 cols, 1 row) === */}
          <div
            className="col-span-12 md:col-span-5 relative rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 p-6"
            style={{
              transition: "opacity 0.7s 0.15s, transform 0.7s 0.15s",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(32px)",
            }}
          >
            {/* Dirt scatter */}
            <div className="absolute top-0 left-0 right-0 h-[50px] pointer-events-none opacity-70" style={DIRT_STYLE} />
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-600/50 via-amber-400/80 to-amber-600/50" />

            <div className="grid grid-cols-3 gap-4 h-full items-center pt-4">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-amber-400 tabular-nums">
                  {pileCount.toLocaleString()}
                  <span className="text-lg">+</span>
                </div>
                <div className="text-white/50 text-xs mt-1 uppercase tracking-wider">Tons Delivered</div>
              </div>
              <div className="text-center border-x border-stone-700/60">
                <div className="text-3xl md:text-4xl font-black text-amber-400 tabular-nums">
                  {yearsCount}+
                </div>
                <div className="text-white/50 text-xs mt-1 uppercase tracking-wider">Years Serving SE Ohio</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-amber-400 tabular-nums">
                  {milesCount}mi
                </div>
                <div className="text-white/50 text-xs mt-1 uppercase tracking-wider">Delivery Radius</div>
              </div>
            </div>
          </div>

          {/* === CELL 3: Certified Scales (spans 5 cols, 1 row) === */}
          <div
            ref={scalesRef}
            className="col-span-12 md:col-span-5 relative rounded-2xl overflow-hidden min-h-[220px] group cursor-pointer"
            style={{
              transition: "opacity 0.7s 0.25s, transform 0.7s 0.25s",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(32px)",
            }}
          >
            <Image
              data-parallax
              src="/images/photos/piles-close-up.jpg"
              alt="Certified scales"
              fill
              className="object-cover transition-transform duration-300 ease-out scale-[1.05]"
              style={{ willChange: "transform" }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-stone-950/95 via-stone-950/70 to-stone-950/40" />

            {/* Dirt scatter */}
            <div className="absolute top-0 left-0 right-0 h-[50px] pointer-events-none" style={DIRT_STYLE} />
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              <span className="inline-flex items-center gap-2 text-amber-300 text-xs font-bold tracking-widest uppercase">
                <Scale className="h-3.5 w-3.5" />
                {scalesSvc?.title ?? "Certified Scales"}
              </span>
              <div>
                <p className="text-white/65 text-sm leading-relaxed mb-3 max-w-xs">
                  {scalesSvc?.description ?? "State-approved scales ensure accurate billing on every load."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(scalesSvc?.features ?? []).slice(0, 2).map((f) => (
                    <span key={f} className="text-xs bg-stone-800/80 border border-stone-700/60 text-white/60 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/5 group-hover:ring-amber-500/25 transition-all duration-500" />
          </div>

          {/* === CELL 4: Material Selector (spans 4 cols, 1 row) === */}
          <div
            className="col-span-12 sm:col-span-6 md:col-span-4 relative rounded-2xl overflow-hidden bg-amber-950/40 border border-amber-900/30 p-6 min-h-[200px] group"
            style={{
              transition: "opacity 0.7s 0.35s, transform 0.7s 0.35s",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(32px)",
            }}
          >
            {/* Dirt scatter */}
            <div className="absolute top-0 left-0 right-0 h-[50px] pointer-events-none opacity-80" style={DIRT_STYLE} />
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-700/40 via-amber-500/60 to-amber-700/40" />

            {/* Animated material texture blobs */}
            <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-amber-700/20 blur-2xl group-hover:bg-amber-600/30 transition-colors duration-700" />

            <div className="relative z-10 h-full flex flex-col justify-between pt-3">
              <div className="flex items-center gap-2 text-amber-400 mb-3">
                {getIcon(calcSvc?.icon)}
                <span className="text-xs font-bold tracking-widest uppercase text-amber-400/80">
                  {calcSvc?.title ?? "Material Planning"}
                </span>
              </div>
              <div>
                <p className="text-white/60 text-sm leading-relaxed mb-4">
                  {calcSvc?.description ?? "Let us help you choose the right material and estimate how much you need."}
                </p>
                <Link
                  href="/recommendations"
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                >
                  Find Your Material
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* === CELL 5: On-Site Loading (spans 4 cols, 1 row) === */}
          <div
            className="col-span-12 sm:col-span-6 md:col-span-4 relative rounded-2xl overflow-hidden group cursor-pointer min-h-[200px]"
            style={{
              transition: "opacity 0.7s 0.45s, transform 0.7s 0.45s",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(32px)",
            }}
          >
            <Image
              src="/images/photos/feeding-equipment.jpg"
              alt="On-site loading"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-stone-950/90 via-stone-950/60 to-stone-950/30" />
            {/* Dirt scatter */}
            <div className="absolute top-0 left-0 right-0 h-[50px] pointer-events-none" style={DIRT_STYLE} />
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-stone-500/40 to-transparent" />

            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              <span className="inline-flex items-center gap-2 text-white/60 text-xs font-bold tracking-widest uppercase">
                {getIcon(loaderSvc?.icon)}
                {loaderSvc?.title ?? "Customer Pickup"}
              </span>
              <ul className="space-y-1.5">
                {(loaderSvc?.features ?? []).slice(0, 3).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-white/60">
                    <div className="h-1 w-1 rounded-full bg-amber-400/70 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/5 group-hover:ring-amber-500/20 transition-all duration-500" />
          </div>

          {/* === CELL 6: CTA (spans 4 cols, 1 row) === */}
          <div
            className="col-span-12 sm:col-span-12 md:col-span-4 relative rounded-2xl overflow-hidden bg-stone-900 border border-stone-700/60 p-6 min-h-[200px] flex flex-col justify-between group"
            style={{
              transition: "opacity 0.7s 0.55s, transform 0.7s 0.55s",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(32px)",
            }}
          >
            {/* Dirt scatter */}
            <div className="absolute top-0 left-0 right-0 h-[50px] pointer-events-none opacity-60" style={DIRT_STYLE} />
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

            {/* Glow blob */}
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-amber-600/15 blur-2xl group-hover:bg-amber-500/25 transition-colors duration-700" />

            <div className="relative z-10">
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mb-4">
                <Phone className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-white font-black text-xl leading-tight mb-2">
                Ready to order?
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Call us Monday–Friday and we&apos;ll get your load scheduled same week.
              </p>
            </div>

            <div className="relative z-10 space-y-2.5 mt-4">
              <a
                href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}
                className="flex items-center justify-center gap-2 w-full bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold py-3 rounded-xl transition-colors"
              >
                <Phone className="h-4 w-4" />
                {BUSINESS_INFO.phone}
              </a>
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 w-full border border-stone-600 hover:border-amber-500/40 text-white/70 hover:text-white text-sm font-medium py-2.5 rounded-xl transition-all"
              >
                Get a Quote
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes dust-float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          33% { transform: translateY(-4px) translateX(2px); opacity: 0.5; }
          66% { transform: translateY(-2px) translateX(-3px); opacity: 0.35; }
        }
      `}</style>
    </section>
  );
}
