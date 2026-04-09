"use client";

import { useEffect, useRef, useState } from "react";

interface LazyVideoProps {
  src: string;
  title: string;
}

export function LazyVideo({ src, title }: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsLoaded(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px",
      }
    );

    observer.observe(videoElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        controls
        preload="none"
        className="w-full aspect-video object-cover"
        poster=""
        aria-label={title}
      >
        {isLoaded && <source src={src} type="video/mp4" />}
      </video>
      <p className="text-sm font-medium mt-2">{title}</p>
    </div>
  );
}
