import { gsap } from "gsap";
import type Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Connects Lenis to GSAP ScrollTrigger via scrollerProxy and scroll sync.
 * @returns Teardown for the Lenis scroll listener.
 */
export function initScrollTrigger(lenis: Lenis): () => void {
  ScrollTrigger.scrollerProxy(document.body, {
    scrollTop(value) {
      if (arguments.length) {
        lenis.scrollTo(value as number, { immediate: true });
      }
      return lenis.animatedScroll;
    },
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    },
  });

  const onLenisScroll = () => {
    ScrollTrigger.update();
  };
  lenis.on("scroll", onLenisScroll);

  return () => {
    lenis.off("scroll", onLenisScroll);
  };
}
