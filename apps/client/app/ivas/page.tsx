"use client";

import { title, subtitle } from "@/components/primitives";
import VivaSession from "./components/VivaSession";

export default function IVASPage() {
  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className={title()}>IVAS</h1>
        <h2 className={subtitle({ class: "mt-4" })}>
          Intelligent Viva Voce Assessment System
        </h2>
        <p className="text-default-500 mt-2">
          Practice your programming viva with AI-powered voice interaction
        </p>
      </div>

      <VivaSession />
    </div>
  );
}
