/* eslint-disable react-refresh/only-export-components */
import { Fragment, createElement, forwardRef, type ComponentType, type ReactNode } from "react";

export type Transition = Record<string, unknown>;

type MotionComponent = ComponentType<Record<string, unknown>>;

type MotionValue = {
  get: () => number;
  set: (value: number) => void;
};

const cache = new Map<string, MotionComponent>();

const MOTION_PROPS = [
  "initial", "animate", "exit", "transition", "variants",
  "whileHover", "whileTap", "whileFocus", "whileDrag", "whileInView",
  "layout", "layoutId", "layoutScroll", "layoutRoot",
  "drag", "dragConstraints", "dragElastic", "dragMomentum",
  "onDrag", "onDragStart", "onDragEnd", "onDirectionLock",
  "onViewportEnter", "onViewportLeave", "onAnimationStart", "onAnimationComplete",
  "onHoverStart", "onHoverEnd", "onTap", "onTapStart", "onTapCancel"
];

function createMotionComponent(tag: string): MotionComponent {
  if (cache.has(tag)) {
    return cache.get(tag)!;
  }

  const Comp = forwardRef<HTMLElement, Record<string, unknown>>((props, ref) => {
    const domProps = { ...props };
    for (const p of MOTION_PROPS) {
      delete domProps[p];
    }
    return createElement(tag, { ...domProps, ref }, props.children as ReactNode);
  });
  Comp.displayName = `Motion(${tag})`;
  cache.set(tag, Comp as MotionComponent);
  return Comp as MotionComponent;
}

export const motion = new Proxy(
  {},
  {
    get: (_target, tag) => createMotionComponent(String(tag)),
  },
) as Record<string, MotionComponent>;

export function useMotionValue(initial: number): MotionValue {
  let value = initial;
  return {
    get: () => value,
    set: (next: number) => {
      value = next;
    },
  };
}

export function useSpring(value: MotionValue, _config?: Record<string, unknown>): MotionValue {
  return value;
}

export function AnimatePresence({ children }: { children?: ReactNode; mode?: string }) {
  return createElement(Fragment, null, children);
}
