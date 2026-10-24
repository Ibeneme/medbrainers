"use client";



import Link from "@/i18n/link";
import { Home, ArrowRight } from "lucide-react";
import { T } from "@/i18n/provider";

export default function NotFound() {
  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black font-lufga px-4 sm:px-6 py-28 text-white">


      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 shadow-lg backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/90">
            <T>Error 404</T>
          </span>
        </div>

        <h1 className="mb-4 text-7xl font-extrabold tracking-tight text-white sm:text-9xl">
          4<span style={{ color: "#fff" }}>0</span>4
        </h1>

        <h2 className="mb-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          <T>Page not found</T>
        </h2>

        <p className="mb-10 max-w-md text-sm leading-relaxed text-white/60 sm:text-base">
          <T>
            The page you are looking for might have been moved, renamed, or is
            temporarily unavailable.
          </T>
        </p>

        <div className="flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-95 sm:w-auto"
          >
            <Home className="h-4 w-4 pointer-events-none" strokeWidth={2.2} />
            <span>
              <T>Back to Home</T>
            </span>
          </Link>

          <Link
            href="/get-started"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 text-sm font-semibold text-white/90 transition-all hover:bg-white/10 sm:w-auto"
          >
            <span>
              <T>Get Started</T>
            </span>
            <ArrowRight
              className="h-4 w-4 pointer-events-none text-white/70"
              strokeWidth={2.2}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
