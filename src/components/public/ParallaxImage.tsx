'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  speed?: number; // Controla la intensidad del efecto (0-1, default 0.5)
}

export default function ParallaxImage({ 
  src, 
  alt, 
  className = '',
  speed = 0.3 
}: ParallaxImageProps) {
  const [offset, setOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset;
        const containerTop = rect.top + scrollTop;
        const scrolled = scrollTop - containerTop;
        setOffset(scrolled * speed);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div ref={containerRef} className={`relative h-96 rounded-lg overflow-hidden shadow-xl ${className}`}>
      <div 
        className="absolute inset-0 transition-transform duration-100 ease-out"
        style={{ transform: `translateY(${offset}px)` }}
      >
        <Image 
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
      </div>
      {/* Overlay mantenido igual */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-secondary/60"></div>
    </div>
  );
}
