"use client";

import React from "react";
import Link from "next/link";
import { EMAILS } from "@/constants/mail"; // Make sure this points to your mail.tsx/ts file
import { productName } from "@/constants/site";

export default function CookiePolicyContent() {
  return (
    <div className="space-y-10 text-white/80 font-light leading-relaxed">
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          1. What Are Cookies?
        </h2>
        <p>
          Cookies are small data files placed on your computer or mobile device
          when you visit a website. We use cookies and similar technologies
          (like local storage and pixels) to keep the {productName} platform
          secure, to understand how our software is used so we can improve it,
          and to remember your preferences.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          2. Categories of Cookies We Use
        </h2>
        <ul className="list-disc pl-6 space-y-4 text-white/70">
          <li>
            <strong className="text-white">Strictly Necessary Cookies:</strong>{" "}
            These are required for the platform to work. They keep you signed
            in, authenticate sessions, protect against cross-site request
            forgery (CSRF), and help us keep access to patient records secure.
            The platform cannot function without these.
          </li>
          <li>
            <strong className="text-white">
              Performance &amp; Analytics Cookies:
            </strong>{" "}
            These help us count visits and understand how features are used so
            we can improve performance and usability. They are used on our
            website and for product usage statistics only. We do not put patient
            records or health information into analytics tools.
          </li>
          <li>
            <strong className="text-white">Functional Cookies:</strong> These
            remember choices such as your language, timezone, or dashboard
            layout so the platform works the way you prefer.
          </li>
          <li>
            <strong className="text-white">Targeting/Marketing Cookies:</strong>{" "}
            These may be set on our public marketing pages by advertising
            partners to show you relevant adverts on other sites. We do not use
            targeting or advertising cookies inside the {productName}{" "}
            application, and we never use patient data for advertising.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          3. Third-Party Cookies
        </h2>
        <p>
          In addition to our own cookies, we may use third-party cookies to
          report usage statistics and to process payments (for example, security
          tokens from payment gateways). These providers have their own privacy
          and cookie policies.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          4. Managing Your Cookie Preferences
        </h2>
        <p>
          You can decide whether to accept or reject non-essential cookies by
          using our Cookie Consent Manager prompt and by changing your web
          browser settings. If you block strictly necessary cookies, you may
          still browse our public website, but you will not be able to sign in
          to the {productName} platform.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          5. Contact Us
        </h2>
        <p>
          If you have any questions about our use of cookies or similar
          technologies, please contact us at{" "}
          <Link
            href={`mailto:${EMAILS.support}`}
            className="text-primary-light underline"
          >
            {EMAILS.support}
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
