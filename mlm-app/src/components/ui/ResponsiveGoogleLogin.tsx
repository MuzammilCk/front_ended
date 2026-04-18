import { useState, useEffect, useRef } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

interface ResponsiveGoogleLoginProps {
  onSuccess: (credentialResponse: CredentialResponse) => void;
  onError: () => void;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
}

export default function ResponsiveGoogleLogin({
  onSuccess,
  onError,
  text = "continue_with",
}: ResponsiveGoogleLoginProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        // Google Identity Services max width is 400px
        setWidth(containerWidth > 400 ? 400 : Math.floor(containerWidth));
      }
    });

    observer.observe(containerRef.current);

    // Set initial width
    const initialWidth = containerRef.current.getBoundingClientRect().width;
    setWidth(initialWidth > 400 ? 400 : Math.floor(initialWidth));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      {width ? (
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          theme="filled_black"
          shape="rectangular"
          width={width.toString()}
          text={text}
        />
      ) : (
        // Placeholder skeleton to prevent layout shift while calculating width
        <div style={{ height: "40px", width: "100%", maxWidth: "400px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
      )}
    </div>
  );
}
