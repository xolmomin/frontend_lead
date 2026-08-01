"use client";

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useMounted } from "@/lib/use-mounted";

type Position = "top" | "bottom" | "left" | "right";

const GAP = 8;
const EDGE = 8;
const HIDDEN = { top: -9999, left: -9999 };

const TRANSFORMS: Record<Position, string> = {
  top: "translate(-50%, -100%)",
  bottom: "translate(-50%, 0)",
  left: "translate(-100%, -50%)",
  right: "translate(0, -50%)",
};

const ARROWS: Record<Position, string> = {
  top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900 dark:border-t-gray-700",
  bottom:
    "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900 dark:border-b-gray-700",
  left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900 dark:border-l-gray-700",
  right:
    "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900 dark:border-r-gray-700",
};

export interface YbTooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: Position;
  delay?: number;
  disabled?: boolean;
}

export function YbTooltip({
  children,
  content,
  position = "top",
  delay = 200,
  disabled = false,
}: YbTooltipProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState(HIDDEN);
  const [shift, setShift] = useState(0);
  const mounted = useMounted();
  const anchorRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const computeCoords = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return HIDDEN;
    const rect = el.getBoundingClientRect();
    switch (position) {
      case "top":
        return { top: rect.top - GAP, left: rect.left + rect.width / 2 };
      case "bottom":
        return { top: rect.bottom + GAP, left: rect.left + rect.width / 2 };
      case "left":
        return { top: rect.top + rect.height / 2, left: rect.left - GAP };
      case "right":
        return { top: rect.top + rect.height / 2, left: rect.right + GAP };
    }
  }, [position]);

  const show = useCallback(() => {
    if (disabled) return;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      setCoords(computeCoords());
      setShift(0);
      setVisible(true);
    }, delay);
  }, [disabled, delay, clearTimer, computeCoords]);

  const hide = useCallback(() => {
    clearTimer();
    setVisible(false);
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, hide]);

  useEffect(() => {
    if (!visible) return;
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [visible, hide]);

  useLayoutEffect(() => {
    if (!visible) return;
    const el = tooltipRef.current;
    if (!el) return;
    const anchor = anchorRef.current?.getBoundingClientRect();
    if (!anchor) return;
    const horizontal = position === "top" || position === "bottom";
    let next = 0;
    if (horizontal) {
      const width = el.offsetWidth;
      const center = anchor.left + anchor.width / 2;
      const left = center - width / 2;
      const right = center + width / 2;
      if (right > window.innerWidth - EDGE) next = window.innerWidth - EDGE - right;
      else if (left < EDGE) next = EDGE - left;
    } else {
      const height = el.offsetHeight;
      const center = anchor.top + anchor.height / 2;
      const top = center - height / 2;
      const bottom = center + height / 2;
      if (bottom > window.innerHeight - EDGE)
        next = window.innerHeight - EDGE - bottom;
      else if (top < EDGE) next = EDGE - top;
    }
    setShift((prev) => (prev === next ? prev : next));
  }, [visible, position, coords]);

  const child =
    isValidElement(children) && visible && !disabled
      ? cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, {
          "aria-describedby": id,
        })
      : children;

  const horizontal = position === "top" || position === "bottom";
  const shiftTransform = horizontal
    ? `translateX(${shift}px)`
    : `translateY(${shift}px)`;
  const arrowStyle = horizontal ? { marginLeft: -shift } : { marginTop: -shift };

  const portal =
    mounted && typeof document !== "undefined"
      ? createPortal(
          visible && !disabled ? (
            <div
              ref={tooltipRef}
              id={id}
              role="tooltip"
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                transform: `${TRANSFORMS[position]} ${shiftTransform}`,
              }}
              className="z-[100] pointer-events-none animate-in fade-in duration-100"
            >
              <div className="relative px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap">
                {content}
                <div
                  className={`absolute ${ARROWS[position]} border-4`}
                  style={arrowStyle}
                  aria-hidden="true"
                />
              </div>
            </div>
          ) : null,
          document.body,
        )
      : null;

  return (
    <>
      <div
        ref={anchorRef}
        className="relative inline-block"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {child}
      </div>
      {portal}
    </>
  );
}
