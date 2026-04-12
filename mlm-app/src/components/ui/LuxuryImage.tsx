import { useState, useRef, useEffect } from "react";
import gsap from "gsap";

export interface LuxuryImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  priority?: boolean;
}

export default function LuxuryImage({
  src,
  alt,
  className = "",
  priority = false,
  ...props
}: LuxuryImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isLoaded && imgRef.current) {
      gsap.fromTo(
        imgRef.current,
        { opacity: 0, scale: 1.05 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }
      );
    }
  }, [isLoaded]);

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r from-[#1a1410] via-[#2a1f15] to-[#1a1410] bg-[length:200%_100%] animate-[shimmer_2s_infinite] ${className}`}>
      {/* Background provides the shimmer while the image loads */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        onLoad={(e) => {
          setIsLoaded(true);
          props.onLoad?.(e);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        {...props}
      />
    </div>
  );
}
