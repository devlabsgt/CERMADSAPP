"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TypingAnimationProps {
  children: string;
  className?: string;
  duration?: number;
  showCursor?: boolean;
}

export function TypingAnimation({
  children,
  className,
  duration = 40,
  showCursor = true,
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");

    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setDisplayedText(children.slice(0, index));

      if (index >= children.length) {
        window.clearInterval(interval);
      }
    }, duration);

    return () => window.clearInterval(interval);
  }, [children, duration]);

  return (
    <span className={cn("inline", className)}>
      {displayedText}
      {showCursor && (
        <span
          className="ml-0.5 inline-block w-0.5 animate-pulse align-middle bg-current"
          style={{ height: "1em" }}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
