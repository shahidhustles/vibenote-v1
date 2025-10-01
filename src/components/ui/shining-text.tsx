"use client";

import React, { useEffect, useRef } from "react";

type ShiningTextProps = {
  duration?: string;
  textColor?: string;
  className?: string;
  children: React.ReactNode;
};

export default function ShiningText({
  duration = "2s",
  textColor = "rgba(255, 0, 0, 0.9)",
  className = "",
  children,
}: ShiningTextProps) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Calculate the width of the text element
    const textWidth = textRef.current ? textRef.current.offsetWidth : 200;

    // Create unique ID for this instance
    const uniqueId = `shine-${Math.random().toString(36).substr(2, 9)}`;

    // Update keyframes dynamically based on text width
    const keyframes = `
      @keyframes ${uniqueId} {
        0% {
          background-position: -${textWidth}px;
        }
        50% {
          background-position: ${textWidth / 1.5}px;
        }
        100% {
          background-position: ${textWidth * 2}px;
        }
      }
    `;

    // Append keyframes to the document head
    const style = document.createElement("style");
    style.innerHTML = keyframes;
    document.head.appendChild(style);

    // Set the animation name after keyframes are added
    if (textRef.current) {
      textRef.current.style.animationName = uniqueId;
    }

    return () => {
      document.head.removeChild(style);
    };
  }, [children]);

  // Inline styles for the shining text
  const inlineStyles: React.CSSProperties = {
    background: `#222 linear-gradient(to right, #222, #fff, #222) 0 0 no-repeat`,
    backgroundSize: `${textRef.current ? textRef.current.offsetWidth : 200}px`,
    color: textColor,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    animationDuration: duration,
    animationIterationCount: "infinite",
    textShadow: "0 0px 0px rgba(255, 255, 255, 0.5)",
  };

  return (
    <div ref={textRef} className={className} style={inlineStyles}>
      {children}
    </div>
  );
}
