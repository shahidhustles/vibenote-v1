"use client";

import React from "react";

export default function ChatHeader() {
  return (
    <div className="relative z-10 pt-10 pb-4 max-w-6xl mx-auto px-8 flex flex-col items-center">
      {/* Main Title with Mixed Typography, forced to two lines */}
      <h1 className="text-[2.8rem] lg:text-[3.5rem] font-light text-slate-800 leading-[1.1] text-center break-words max-w-5xl drop-shadow-sm">
        <span className="font-normal">VibeNote </span>
        <span className="font-bold underline decoration-2 underline-offset-4">
          V1
        </span>
        <span className="font-light"> — the </span>
        <span className="font-bold italic text-purple-800">
          &nbsp;future&nbsp;
        </span>
        <br />
        <span className="font-light">of </span>
        <span className="font-medium">educational </span>
        <span className="font-bold italic text-purple-800 underline decoration-2 underline-offset-4">
          AI chatbots&nbsp;
        </span>
        <span className="font-light"> is here.</span>
      </h1>

      {/* Subtitle */}
      <p className="text-lg text-slate-700 mt-6 max-w-2xl font-light text-center drop-shadow-sm">
        AI-powered conversational interface for educational knowledge management
      </p>
    </div>
  );
}
