import { useEffect } from "react";
import gsap from "gsap";

export function useGsapContext(
  callback: gsap.ContextFunc,
  scope?: React.RefObject<any> | Element | string | null,
  dependencies: React.DependencyList = []
) {
  useEffect(() => {
    const ctx = gsap.context(callback, scope ?? undefined);
    return () => {
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
