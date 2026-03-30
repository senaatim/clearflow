export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-text-secondary text-sm">Last updated: March 2026</p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Information We Collect</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          We collect information you provide during registration (name, email, NIN), usage data, and device information to operate and improve the platform.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. How We Use Your Information</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          Your data is used to verify your identity, process transactions, personalise your experience, and comply with regulatory obligations under Nigerian law.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3. Identity Verification (KYC)</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          Your NIN is hashed using a one-way cryptographic function before storage. We never store your raw NIN. This data is used solely for identity verification and fraud prevention.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4. Data Sharing</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          We do not sell your personal data. We may share data with regulatory authorities as required by law, or with trusted service providers who assist in platform operations under strict confidentiality agreements.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">5. Data Security</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          We use industry-standard encryption and security practices to protect your data. Access is restricted to authorised personnel only.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">6. Your Rights</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          You may request access to, correction of, or deletion of your personal data by contacting us. Note that some data may be retained for regulatory compliance.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">7. Contact</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          For privacy concerns, contact our Data Protection Officer at privacy@clearflow.ng.
        </p>
      </section>

      <p className="text-xs text-text-muted pt-4">A subsidiary of Jbryanson Globals Limited</p>
    </div>
  );
}
