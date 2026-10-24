"use client";

import { useEffect, useState } from "react";

// Starts with a fixed year so the server render never reads the clock,
// then updates to the real year in the browser.
const FALLBACK_YEAR = 2026;

export default function CurrentYear() {
  const [year, setYear] = useState(FALLBACK_YEAR);
  useEffect(() => setYear(new Date().getFullYear()), []);
  return <>{year}</>;
}
