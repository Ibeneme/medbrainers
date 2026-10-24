"use client";

import Link from "next/link";
import { EMAILS } from "@/constants/mail"; // Make sure this points to your mail.tsx/ts file
import { productName } from "@/constants/site";

export default function TermsOfServiceContent() {
  return (
    <div className="space-y-12 text-white/80 font-light leading-relaxed max-w-4xl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          Terms of Service
        </h1>
        <p className="text-sm text-white/50">Last Updated: October 20, 2026</p>
      </div>

      {/* 1. Acceptance of Terms */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          1. Acceptance of Terms
        </h2>
        <p>
          Please read these Terms of Service (“Terms”) carefully before using
          the {productName} website, electronic medical records platform, API,
          or any related services (collectively, the “Services”).
        </p>
        <p>
          By accessing or using the Services you agree to be legally bound by
          these Terms. If you do not accept these Terms, do not use the
          Services.
        </p>
        <p>
          You represent that you are lawfully able to enter into contracts (you
          are not a minor). If you are entering into these Terms on behalf of a
          hospital, clinic, pharmacy, laboratory, or other organization, you
          represent that you have authority to bind that organization, and “you”
          includes both you personally and the organization you represent.
        </p>
      </section>

      {/* 2. Relationship to Master Agreement */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          2. Relationship to Subscription Agreement
        </h2>
        <p>
          These Terms primarily govern use of the public website and free, demo,
          or trial access. Paid use of the {productName} platform is
          additionally governed by our Master Subscription Agreement (or other
          written contract signed between you and {productName}). In the event
          of a conflict between these Terms and a signed Master Subscription
          Agreement, the signed agreement controls.
        </p>
      </section>

      {/* 3. Account Registration & Security */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          3. Account Registration and Security
        </h2>
        <p>
          To access certain features you must create an account and verify your
          email address. You agree to provide accurate, current, and complete
          information and to keep it updated. You are solely responsible for
          safeguarding your password and for all activity that occurs under your
          account.
        </p>
        <p>
          Accounts are personal to the individual who registers them. Where you
          are an organization, you are responsible for giving each staff member
          their own login, assigning access according to their role, and
          removing access promptly when someone leaves or changes role. Do not
          share credentials.
        </p>
        <p>
          You must notify us immediately of any unauthorized use of your
          account. We are not liable for any loss arising from unauthorized use
          of your credentials.
        </p>
      </section>

      {/* 4. Customer Data Ownership */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          4. Your Data: Ownership and License
        </h2>
        <p>
          You retain all right, title, and interest in and to the data, content,
          and information you upload or transmit through the Services (“Customer
          Data”), including patient records, billing and claims data, and
          laboratory and pharmacy records.
        </p>
        <p>
          You grant {productName} a limited, non-exclusive license to host,
          process, transmit, and display Customer Data solely as necessary to
          provide and improve the Services, in accordance with our Privacy
          Statement and any Data Processing Addendum. We process Patient data
          only on your instructions.
        </p>
        <p>
          As the healthcare provider, you are the data controller for Patient
          data. You are responsible for having a lawful basis to collect and use
          it, for giving patients any notices required by law, and for
          responding to patient requests about their records.
        </p>
      </section>

      {/* 5. Healthcare Responsibilities */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          5. Healthcare and Clinical Responsibilities
        </h2>
        <p>
          {productName} is a software tool for managing health records and
          healthcare operations. It does not provide medical advice, diagnosis,
          or treatment, and it is not a substitute for professional clinical
          judgment.
        </p>
        <ul className="list-disc pl-6 space-y-2 text-white/70">
          <li>
            All clinical decisions remain the responsibility of qualified,
            licensed healthcare professionals
          </li>
          <li>
            You are responsible for checking the accuracy of data entered into
            the platform, including prescriptions, doses, laboratory results,
            and billing amounts, before acting on them
          </li>
          <li>
            You are responsible for holding all licences, registrations, and
            approvals your facility needs to operate and for complying with laws
            and professional rules on patient confidentiality and record keeping
          </li>
          <li>
            Automated features, reports, and alerts are aids only and may
            contain errors
          </li>
          <li>
            Do not rely on the Services as your only system for emergency or
            life-critical situations, and keep appropriate backup procedures for
            downtime
          </li>
        </ul>
      </section>

      {/* 6. Acceptable Use */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          6. Acceptable Use and Restrictions
        </h2>
        <p>
          You agree to use the Services only for lawful purposes. You shall not:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-white/70">
          <li>
            Reverse engineer, decompile, disassemble, or attempt to extract the
            source code of the platform
          </li>
          <li>
            Access, view, or disclose patient information without a legitimate
            professional or operational reason
          </li>
          <li>
            Upload unlawful content, or enter data about people without a lawful
            basis to do so
          </li>
          <li>
            Use the Services to send unsolicited bulk messages (spam) or violate
            anti-spam laws
          </li>
          <li>
            Submit false claims to HMOs or insurers, or use the Services to
            commit fraud
          </li>
          <li>
            Attempt to bypass rate limits, security controls, or access accounts
            or records that do not belong to you
          </li>
          <li>
            Use the Services in any way that could damage, disable, or impair
            the platform or interfere with any other party’s use
          </li>
        </ul>
      </section>

      {/* 7. Third-Party Integrations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          7. Third-Party Services and Integrations
        </h2>
        <p>
          The Services may allow you to connect third-party tools such as
          payment gateways, messaging channels, HMO systems, and laboratory
          equipment. When you use a third-party integration you are interacting
          with that third party, not with {productName}. We are not responsible
          for the availability, accuracy, privacy practices, or content of any
          third-party service.
        </p>
        <p>
          Your use of third-party services is governed solely by their own terms
          and privacy policies. Payments made through a payment gateway are
          processed by that provider.
        </p>
      </section>

      {/* 8. Subscriptions & Billing */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          8. Subscriptions, Billing, and Cancellation
        </h2>
        <p>
          Paid plans are billed on a subscription basis (monthly or annually)
          according to the plan and number of users, facilities, or modules you
          select. Subscriptions automatically renew unless you cancel before the
          renewal date.
        </p>
        <p>
          Fees are non-refundable except where required by law. No refunds or
          credits are provided for partial billing periods, unused seats, or
          plan downgrades.
        </p>
      </section>

      {/* 9. Intellectual Property */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          9. Intellectual Property and Content
        </h2>
        <p>
          The Services, including all software, text, graphics, logos, and other
          content (“{productName} Content”), are owned by {productName} or its
          licensors and are protected by copyright, trademark, and other laws.
        </p>
        <p>
          We grant you a limited, revocable, non-sublicensable license to access
          and use the {productName} Content solely as necessary to use the
          Services. You may not copy, modify, distribute, sell, or create
          derivative works from the {productName} Content except as expressly
          permitted.
        </p>
      </section>

      {/* 10. Disclaimers */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          10. Disclaimers
        </h2>
        <p className="uppercase text-sm tracking-wide text-white/60">
          THE SERVICES AND ALL CONTENT ARE PROVIDED ON AN “AS IS” AND “AS
          AVAILABLE” BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS,
          IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING ANY IMPLIED WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
          NON-INFRINGEMENT, TO THE MAXIMUM EXTENT PERMITTED BY LAW.
        </p>
        <p>
          We do not warrant that the Services will be uninterrupted, error-free,
          or completely secure, and we do not provide medical advice or
          guarantee any clinical outcome.
        </p>
      </section>

      {/* 11. Limitation of Liability */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          11. Limitation of Liability
        </h2>
        <p className="uppercase text-sm tracking-wide text-white/60">
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW,{" "}
          {productName.toUpperCase()} AND ITS AFFILIATES SHALL NOT BE LIABLE FOR
          ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR
          EXEMPLARY DAMAGES, INCLUDING LOSS OF PROFITS, REVENUE, DATA, OR
          BUSINESS OPPORTUNITIES, ARISING OUT OF OR RELATING TO YOUR USE OF (OR
          INABILITY TO USE) THE SERVICES.
        </p>
        <p>
          Our total aggregate liability under these Terms shall not exceed the
          greater of (a) the amounts you paid us in the twelve (12) months
          preceding the claim, or (b) one hundred U.S. dollars ($100).
        </p>
        <p>
          Nothing in these Terms excludes or limits liability that cannot be
          excluded or limited under applicable law.
        </p>
      </section>

      {/* 12. Indemnification */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          12. Indemnification
        </h2>
        <p>
          You agree to defend, indemnify, and hold harmless {productName}, its
          affiliates, and their respective officers, directors, employees, and
          agents from and against any claims, damages, losses, liabilities, and
          expenses (including reasonable legal fees) arising out of or related
          to your use of the Services, your Customer Data, the care you provide
          to patients, your violation of these Terms, or your violation of any
          law or third-party rights.
        </p>
      </section>

      {/* 13. Termination */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          13. Termination and Data Export
        </h2>
        <p>
          We may suspend or terminate your access to the Services immediately if
          you breach these Terms or if we believe it is necessary to protect the
          security or integrity of the platform.
        </p>
        <p>
          Upon termination, your right to use the Services ceases. You may
          request an export of your Customer Data, including patient records,
          within thirty (30) days after termination. After that period we will
          permanently delete the data in accordance with our retention policy,
          except where we are required to retain it by law. You are responsible
          for meeting any record-keeping obligations that apply to your
          facility, so please export your records before your account closes.
        </p>
      </section>

      {/* 14. Governing Law */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          14. Governing Law and Dispute Resolution
        </h2>
        <p>
          These Terms shall be governed by and construed in accordance with the
          laws of the Federal Republic of Nigeria. The parties will first try to
          resolve any dispute through good-faith discussion. If that fails, any
          legal action arising under these Terms shall be brought in the courts
          of competent jurisdiction in Nigeria, and you consent to personal
          jurisdiction there.
        </p>
      </section>

      {/* 15. Changes to Terms */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          15. Changes to These Terms
        </h2>
        <p>
          We may modify these Terms at any time by posting a revised version on
          the website. Continued use of the Services after the effective date of
          any changes constitutes acceptance of the updated Terms.
        </p>
      </section>

      {/* 16. Contact */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          16. Contact Us
        </h2>
        <p>
          If you have any questions about these Terms, please contact us at:
        </p>
        <p>
          <Link
            href={`mailto:${EMAILS.support}`}
            className="text-primary-light underline hover:text-primary-light/90"
          >
            {EMAILS.support}
          </Link>
        </p>
      </section>
    </div>
  );
}
