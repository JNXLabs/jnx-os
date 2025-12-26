import Link from 'next/link';
import { Zap, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-jnx-dark">
      {/* Header */}
      <header className="border-b border-slate-800/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyan-500" />
            <span className="text-xl font-bold text-white">JNX-OS</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Terms of Service
        </h1>
        <p className="text-slate-400 mb-8">Last updated: December 26, 2025</p>

        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="leading-relaxed">
              By accessing and using JNX-OS, you accept and agree to be bound by
              the terms and provision of this agreement. If you do not agree to
              these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              2. Use of Service
            </h2>
            <p className="leading-relaxed mb-4">
              You agree to use JNX-OS only for lawful purposes and in accordance
              with these Terms. You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Use the service in any way that violates applicable laws or
                regulations
              </li>
              <li>
                Attempt to gain unauthorized access to any part of the service
              </li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>
                Use the service to transmit any harmful code or malicious
                software
              </li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              3. User Accounts
            </h2>
            <p className="leading-relaxed">
              When you create an account with us, you must provide accurate and
              complete information. You are responsible for maintaining the
              confidentiality of your account credentials and for all activities
              that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              4. Intellectual Property
            </h2>
            <p className="leading-relaxed">
              The service and its original content, features, and functionality
              are owned by JNX Labs and are protected by international copyright,
              trademark, patent, trade secret, and other intellectual property
              laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              5. Service Availability
            </h2>
            <p className="leading-relaxed">
              We strive to provide reliable service but do not guarantee that the
              service will be uninterrupted, timely, secure, or error-free. We
              reserve the right to modify, suspend, or discontinue the service at
              any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              6. Limitation of Liability
            </h2>
            <p className="leading-relaxed">
              To the maximum extent permitted by law, JNX Labs shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages resulting from your use of or inability to use the
              service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              7. Termination
            </h2>
            <p className="leading-relaxed">
              We may terminate or suspend your account and access to the service
              immediately, without prior notice or liability, for any reason,
              including if you breach these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              8. Changes to Terms
            </h2>
            <p className="leading-relaxed">
              We reserve the right to modify or replace these Terms at any time.
              If a revision is material, we will provide at least 30 days' notice
              prior to any new terms taking effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              9. Governing Law
            </h2>
            <p className="leading-relaxed">
              These Terms shall be governed by and construed in accordance with
              the laws of the jurisdiction in which JNX Labs operates, without
              regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              10. Contact Us
            </h2>
            <p className="leading-relaxed">
              If you have any questions about these Terms, please contact us at
              legal@jnxlabs.ai
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
