"use client";

import { useEffect, useState } from "react";
import { productName } from "@/constants/site";
import { T } from "@/i18n/provider";

export default function ProductDescriptionHome() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 60);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-2 lg:px-8">
      <div
        className={`max-w-[48rem] transition-opacity delay-[1100ms] duration-[1400ms] ease-in-out ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="m-0 max-w-[48rem] px-4 text-[28px] font-normal leading-normal text-white">
          {productName},{" "}
          <T>
            Designed for excellence across every clinical tier, bringing all
            patient records, histories, lab results, tests and prescriptions
            together in one place. Empowering healthcare providers and patients
            with reliable, connected infrastructure.
          </T>
        </p>
      </div>
    </div>
  );
}

