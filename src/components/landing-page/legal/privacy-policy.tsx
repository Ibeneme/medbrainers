"use client";

import React from "react";
import Link from "next/link";
import { EMAILS } from "@/constants/mail"; // Make sure this points to your mail.tsx/ts file
import { productName } from "@/constants/site";

export default function PrivacyPolicyContent() {
  return (
    <div className="space-y-12 text-white/80 font-light leading-relaxed max-w-4xl">
      {/* Header / Effective Date */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          Product Privacy Statement
        </h1>
        <p className="text-sm text-white/50">
          Effective Date: October 20, 2026
        </p>
      </div>

      {/* 1. Introduction & Scope */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          1. Introduction & Scope
        </h2>
        <p>
          Welcome to <strong className="text-white">{productName}</strong>
          (`“{productName},” “we,” “us,” or “our”). We provide a cloud-based
          electronic medical records (EMR) and healthcare management platform
          that helps hospitals, clinics, pharmacies, laboratories, and other
          healthcare providers (“Client,” “you,” or “your”) manage patient
          records, billing, HMO and insurance claims, laboratory and pharmacy
          workflows, ward management, and related operations for their patients
          (“Patients”).
        </p>
        <p>
          This Product Privacy Statement explains how we collect, use, disclose,
          and otherwise process Personal Data on behalf of our Clients in
          connection with their use of our products and services (collectively,
          the “Services”).
        </p>
        <p>
          When we process Personal Data under the direction of our Clients, we
          act as a <strong className="text-white">data processor</strong> under
          the Nigeria Data Protection Act 2023 (“NDPA”) and, where applicable,
          the GDPR. Our Clients are the{" "}
          <strong className="text-white">data controllers</strong> and decide
          why and how Patient data is used. For the limited account and usage
          data we collect about Client Users ourselves, we act as a data
          controller. This Statement does <em>not</em> apply to data we collect
          on our own marketing website, which is covered by a separate Privacy
          Policy.
        </p>
        <p>
          Patients seeking access, correction, or deletion of their health
          records should contact the healthcare provider (the Client) that holds
          their records directly.
        </p>
      </section>

      {/* 2. Personal Data We Collect */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          2. Personal Data We Collect or Receive
        </h2>
        <p>
          We receive or collect Personal Data that is stored in or transmitted
          through the Services by or on behalf of our Clients. This may include:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-white/70">
          <li>
            <strong className="text-white">Patient Data</strong> — identity and
            contact details (name, date of birth, gender, phone, email, address,
            next of kin), medical and health records (visit notes, diagnoses,
            prescriptions, laboratory requests and results, ward and admission
            records), billing and payment records, and HMO, insurance, or family
            plan information. Much of this is{" "}
            <strong className="text-white">
              sensitive personal data (health data)
            </strong>{" "}
            under the NDPA.
          </li>
          <li>
            <strong className="text-white">Client User Data</strong> — name,
            email address, phone number, role and department, professional
            details (such as licence number where a Client provides it), account
            credentials, device information (browser, OS, IP address, device
            ID), and usage data (pages viewed, feature interactions, timestamps,
            audit logs).
          </li>
          <li>
            <strong className="text-white">Integration Data</strong> —
            information exchanged through payment gateways, messaging services,
            laboratory equipment, HMO systems, or other third-party integrations
            that a Client enables via APIs, webhooks, or workflows.
          </li>
        </ul>
        <p>
          We also collect limited technical and usage data automatically via
          cookies, log files, and similar technologies necessary for the
          operation and security of the Services.
        </p>
      </section>

      {/* 3. How We Use Personal Data */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          3. How We Use Personal Data
        </h2>
        <p>
          We process Personal Data only on the instructions of our Clients and
          in accordance with our agreements, for the following purposes:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-white/70">
          <li>Providing, operating, securing, and improving the Services</li>
          <li>
            Enabling authorized Client Users to access and use the platform,
            including billing, claims, laboratory, pharmacy, and ward tools
          </li>
          <li>Responding to support requests, inquiries, and complaints</li>
          <li>
            Maintaining security, keeping audit trails, preventing fraud, and
            complying with applicable law
          </li>
          <li>
            Generating aggregated or de-identified insights to improve the
            product (never in a way that identifies individuals)
          </li>
        </ul>
        <p>
          We do <strong className="text-white">not</strong> use identifiable
          Patient data for advertising or marketing, and we do not use it to
          train AI models unless a Client has expressly instructed us to in
          writing.
        </p>
      </section>

      {/* 4. How We Share Personal Data */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          4. How We Share Personal Data
        </h2>
        <p>
          We share Personal Data only in the following limited circumstances:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-white/70">
          <li>
            With the Client and its authorized Client Users (to the extent the
            data relates to their Patients or account)
          </li>
          <li>
            With carefully selected sub-processors that help us host, operate,
            secure, and improve the Services, such as cloud hosting and payment
            providers (a current list is available upon request)
          </li>
          <li>
            With HMOs, insurers, payment gateways, and other third parties that
            a Client chooses to connect to the Services
          </li>
          <li>
            When required by law, regulation, or court order, or when we believe
            disclosure is necessary to protect rights or safety or to
            investigate fraud or illegal activity
          </li>
        </ul>
        <p>
          We do <strong className="text-white">not sell</strong> Personal Data.
        </p>
      </section>

      {/* 5. Security */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          5. How We Secure Personal Data
        </h2>
        <p>
          We implement appropriate technical and organizational measures to
          protect health data, including encryption in transit, role-based
          access controls, audit logging, and ongoing monitoring. No system is
          completely secure, but we work to reduce risk and to improve our
          safeguards as the Services evolve.
        </p>
        <p>
          If we become aware of a personal data breach affecting data we process
          for a Client, we will notify that Client without undue delay so it can
          meet its own obligations, including any notification to the Nigeria
          Data Protection Commission (“NDPC”) and affected individuals.
        </p>
        <p>
          Clients remain responsible for protecting their own account
          credentials, for assigning access to staff on a need-to-know basis,
          and for securing any devices or third-party applications connected to
          the Services.
        </p>
      </section>

      {/* 6. Cross-Border Transfers */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          6. Cross-Border Data Transfers
        </h2>
        <p>
          Our hosting and infrastructure providers may store or process data in
          countries outside Nigeria. Where Personal Data is transferred outside
          Nigeria, we take steps to ensure it remains protected, in line with
          the NDPA and guidance from the NDPC, for example by using providers
          with adequate protections and appropriate contractual safeguards.
        </p>
      </section>

      {/* 7. Data Retention */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          7. Data Retention
        </h2>
        <p>
          We retain Personal Data processed on behalf of Clients for as long as
          our contractual relationship remains active. Healthcare providers are
          often required by law and professional rules to keep patient records
          for set periods, so Clients are responsible for deciding how long
          Patient records are kept. After termination, and following the export
          window described in our Terms of Service, we delete Patient data
          within <strong className="text-white">ninety (90) days</strong>,
          unless a longer period is required by law or requested by the Client
          in writing.
        </p>
        <p>
          Authorized Client Users can delete or archive records in the platform
          where the Client’s own legal obligations allow. Where we are asked to
          delete data, we will do so promptly and in any case within 90 days of
          the request.
        </p>
        <p>
          Limited account, billing, and log data may be retained longer where
          necessary for legal, accounting, audit, or security purposes, and will
          continue to be treated in accordance with this Statement.
        </p>
      </section>

      {/* 8. Data Subject Rights */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          8. Data Subject Rights
        </h2>
        <p>
          Under the NDPA, individuals have rights over their Personal Data,
          including rights of access, correction, deletion (where applicable),
          restriction, objection, and data portability. Clients are the data
          controllers and are responsible for responding to requests from their
          Patients. If we receive a request directly, we will direct the
          individual to the relevant Client and will assist the Client in
          fulfilling the request as required under our agreements and applicable
          law.
        </p>
        <p>
          Individuals who believe their data has been mishandled may also lodge
          a complaint with the NDPC.
        </p>
      </section>

      {/* 9. Children */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          9. Children’s Data
        </h2>
        <p>
          Healthcare providers routinely record data about children. That data
          is entered by the Client, usually with the consent of a parent or
          guardian, and is handled under the same protections as all other
          health data. Children do not create or manage {productName} accounts
          themselves.
        </p>
      </section>

      {/* 10. Do Not Track */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          10. Do Not Track
        </h2>
        <p>
          Because certain tracking of Client User activity is necessary for the
          proper functioning, audit, and security of the Services, we currently
          do not respond to “Do Not Track” browser signals.
        </p>
      </section>

      {/* 11. Changes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          11. Changes to This Statement
        </h2>
        <p>
          If we make material changes, we will notify Clients in a manner we
          reasonably believe will reach them (email, in-app notice, or
          announcement on this page).
        </p>
      </section>

      {/* 12. Contact */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          12. Contact Us
        </h2>
        <p>
          If you are a Client and have questions about this Product Privacy
          Statement, please contact us at:
        </p>
        <p>
          <Link
            href={`mailto:${EMAILS.support}`}
            className="text-primary-light underline hover:text-primary-light/90"
          >
            {EMAILS.support}
          </Link>
        </p>
        <p className="text-sm text-white/50 pt-2">
          For alternative formats or accessibility needs, reach out to the same
          address.
        </p>
      </section>
    </div>
  );
}
