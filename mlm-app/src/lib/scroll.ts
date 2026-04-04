import { gsap } from "gsap";
import Lenis from "lenis";
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { initScrollTrigger } from "./scrollUtils";

const ScrollContext = createContext<Lenis | null>(null);

const luxuryEasing = (t: number) =>
  Math.min(1, 1.001 - Math.pow(2, -10 * t));

export function ScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const instance = new Lenis({
      duration: 1.4,
      easing: luxuryEasing,
      orientation: "vertical",
      smoothWheel: true,
    });

    setLenis(instance);

    const onGsapTick = (time: number) => {
      instance.raf(time * 1000);
    };

    gsap.ticker.add(onGsapTick);
    gsap.ticker.lagSmoothing(0);

    const teardownScrollTrigger = initScrollTrigger(instance);

    return () => {
      teardownScrollTrigger();
      gsap.ticker.remove(onGsapTick);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return createElement(ScrollContext.Provider, { value: lenis }, children);
}

export function useScrollContext(): Lenis | null {
  return useContext(ScrollContext);
}
