export default function CookiePolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
      <h1 className="text-3xl font-bold">Cookie Policy</h1>
      <p className="text-text-secondary text-sm">Last updated: March 2026</p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. What Are Cookies?</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          Cookies are small text files placed on your device when you visit a website. They help the site remember your preferences and actions over time, so you don't have to re-enter information each visit.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. How We Use Cookies</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          ClearFlow uses cookies and similar technologies solely to operate the platform and improve your experience. We do not use cookies for advertising or cross-site tracking.
        </p>
        <div className="space-y-4 mt-2">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Essential Cookies</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              These are required for the platform to function. They include your authentication session token, which keeps you logged in securely across page visits. Without these, the platform cannot work.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Preference Cookies</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              These remember your settings — such as your selected subscription plan view, billing period toggle, and display preferences — so they persist between sessions.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Performance & Analytics Cookies</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              We may use anonymised analytics (such as Google Analytics 4) to understand how users navigate ClearFlow, which pages are visited most, and where errors occur. This data helps us improve the platform. No personally identifiable information is collected through these cookies.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3. Third-Party Cookies</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          Some features of ClearFlow may load content from trusted third-party services (such as market data providers). These services may set their own cookies, subject to their own privacy policies. We do not control third-party cookies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4. Local Storage</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          In addition to cookies, ClearFlow uses your browser's local storage to persist application state — such as your authentication token and subscription tier — across sessions. This data stays on your device and is never transmitted to third parties.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">5. Managing Cookies</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          You can manage or delete cookies through your browser settings at any time. Please note that disabling essential cookies will prevent you from logging in and using the platform. Disabling preference cookies means your settings will not be saved between visits.
        </p>
        <p className="text-text-secondary text-sm leading-relaxed">
          Most browsers allow you to:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li className="text-text-secondary text-sm">View cookies stored on your device</li>
          <li className="text-text-secondary text-sm">Delete all or specific cookies</li>
          <li className="text-text-secondary text-sm">Block cookies from specific sites</li>
          <li className="text-text-secondary text-sm">Block third-party cookies</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">6. Changes to This Policy</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          We may update this Cookie Policy as we introduce new features or integrate new services. Significant changes will be communicated via the platform or by email.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">7. Contact</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          If you have questions about our use of cookies, contact us at privacy@clearflow.ng.
        </p>
      </section>

      <p className="text-xs text-text-muted pt-4">A subsidiary of Jbryanson Globals Limited</p>
    </div>
  );
}
