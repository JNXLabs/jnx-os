import Link from 'next/link';
import { Zap, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
        <p className="text-slate-400 mb-8">Last updated: December 26, 2025</p>

        <div className="space-y-8 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              1. Introduction
            </h2>
            <p className="leading-relaxed">
              Welcome to JNX-OS. We are committed to protecting your personal
              information and your right to privacy. This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when
              you use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              2. Information We Collect
            </h2>
            <p className="leading-relaxed mb-4">
              We collect information that you provide directly to us when you:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Create an account</li>
              <li>Use our services</li>
              <li>Contact us for support</li>
              <li>Subscribe to our newsletter</li>
            </ul>
            <p className="leading-relaxed mt-4">
              This may include your name, email address, and any other information
              you choose to provide.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              3. How We Use Your Information
            </h2>
            <p className="leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your transactions</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Protect against fraudulent or illegal activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              4. Data Minimization
            </h2>
            <p className="leading-relaxed">
              We practice data minimization and only collect information that is
              necessary for the purposes outlined in this policy. We do not
              collect or store unnecessary personal data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              5. GDPR Compliance
            </h2>
            <p className="leading-relaxed mb-4">
              If you are located in the European Economic Area (EEA), you have
              certain data protection rights under GDPR, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The right to access your personal data</li>
              <li>The right to rectification</li>
              <li>The right to erasure</li>
              <li>The right to restrict processing</li>
              <li>The right to data portability</li>
              <li>The right to object</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              6. Data Security
            </h2>
            <p className="leading-relaxed">
              We implement appropriate technical and organizational security
              measures to protect your personal information. However, no method of
              transmission over the Internet or electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              7. Third-Party Services
            </h2>
            <p className="leading-relaxed">
              We use third-party services (such as Supabase for authentication and
              database) that may collect information used to identify you. These
              services have their own privacy policies addressing how they use
              such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              8. Changes to This Privacy Policy
            </h2>
            <p className="leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              9. Contact Us
            </h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy, please contact
              us at privacy@jnxlabs.ai
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
