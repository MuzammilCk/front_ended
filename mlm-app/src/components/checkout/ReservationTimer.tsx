import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

interface ReservationTimerProps {
  ttlSeconds?: number;
}

export function ReservationTimer({ ttlSeconds = 900 }: ReservationTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(ttlSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isExpiring = timeLeft < 120;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedSeconds = seconds.toString().padStart(2, '0');

  if (timeLeft === 0) {
    return (
      <div className="flex items-center justify-center p-2 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400">
        <Clock size={13} className="mr-1.5 shrink-0" />
        <span>Reservation expired — </span>
        <Link to="/cart" className="ml-1 underline underline-offset-2 hover:text-red-300 transition">
          return to cart
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`flex md:justify-center items-center p-2 rounded border text-xs transition-colors duration-500 ${
        isExpiring
          ? 'bg-red-500/10 border-red-500/20 text-red-400'
          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
      }`}
    >
      <Clock size={13} className="mr-1.5 shrink-0" />
      <span>
        Reserved for {minutes}:{formattedSeconds}
      </span>
    </div>
  );
}
