export default function RiskDisclosurePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
      <h1 className="text-3xl font-bold">Risk Disclosure</h1>
      <p className="text-text-secondary text-sm">Last updated: March 2026</p>

      <div className="p-4 border border-accent-warning/40 bg-accent-warning/5 rounded-xl">
        <p className="text-sm text-accent-warning font-medium leading-relaxed">
          Important: ClearFlow is an investment intelligence and analytics platform. We are not a licensed investment adviser, stockbroker, or asset manager. Nothing on this platform constitutes financial advice, a solicitation, or a recommendation to buy or sell any security.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Nature of the Service</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          ClearFlow provides data-driven investment intelligence tools — including AI-generated analysis, market screeners, portfolio analytics, and educational content — for informational and research purposes only. All outputs from the platform, including AI recommendations, risk scores, and valuation models, are tools to support your own thinking, not directives to act.
        </p>
        <p className="text-text-secondary text-sm leading-relaxed">
          You are solely responsible for all investment decisions you make. ClearFlow does not execute trades, hold funds, manage portfolios, or act on your behalf in any financial market.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. Investment Risk</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          All investments involve risk. The value of securities can go down as well as up. You may lose some or all of the money you invest. Past performance of any security, market, or analytical model does not guarantee future results.
        </p>
        <p className="text-text-secondary text-sm leading-relaxed">
          Specific risks include but are not limited to:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li className="text-text-secondary text-sm">Market risk — prices may move against your position</li>
          <li className="text-text-secondary text-sm">Liquidity risk — you may be unable to sell an asset at a fair price</li>
          <li className="text-text-secondary text-sm">Currency risk — where assets are denominated in foreign currencies</li>
          <li className="text-text-secondary text-sm">Concentration risk — investing in too few assets or sectors</li>
          <li className="text-text-secondary text-sm">Regulatory risk — changes in Nigerian or international financial regulations</li>
          <li className="text-text-secondary text-sm">Volatility risk — particularly for emerging market securities including NGX-listed equities</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3. AI-Generated Content</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          ClearFlow uses artificial intelligence (powered by Groq) to generate analysis, recommendations, and insights. AI outputs are probabilistic and may contain errors, omissions, or outdated information. They do not reflect current market conditions in real time and should not be treated as definitive or infallible.
        </p>
        <p className="text-text-secondary text-sm leading-relaxed">
          You should independently verify any AI-generated information before acting on it.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4. No Guarantee of Accuracy</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          While we strive to provide accurate and up-to-date data, ClearFlow makes no warranty — express or implied — that information on the platform is complete, accurate, or timely. Market data may be delayed. Valuation models depend on assumptions that may not hold.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">5. Regulatory Status</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          Jbryanson Globals Limited is not registered with the Securities and Exchange Commission (SEC) of Nigeria as an investment adviser, portfolio manager, or stockbroker. ClearFlow is a software subscription service. Users are responsible for ensuring their own compliance with applicable laws and regulations when making investment decisions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">6. Seek Professional Advice</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          Before making any significant investment decision, we strongly encourage you to consult with a qualified financial advisor, tax professional, or legal counsel who understands your personal financial circumstances, risk tolerance, and investment objectives.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">7. Limitation of Liability</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          To the maximum extent permitted by law, Jbryanson Globals Limited, its directors, employees, and affiliates shall not be liable for any losses, damages, or costs arising from your use of or reliance on information provided by ClearFlow. Your use of the platform is at your own risk.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">8. Contact</h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          For questions regarding this disclosure, contact us at legal@clearflow.ng.
        </p>
      </section>

      <p className="text-xs text-text-muted pt-4">A subsidiary of Jbryanson Globals Limited</p>
    </div>
  );
}
