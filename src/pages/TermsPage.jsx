export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="card p-8 sm:p-12">
        <h1 className="text-3xl font-display font-bold text-surface-900 mb-2">Terms & Conditions</h1>
        <p className="text-sm text-surface-500 mb-8">Last updated: August 8, 2026</p>

        <div className="prose prose-surface max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm text-surface-600 leading-relaxed">
              By accessing and using NexusMart ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services. These terms apply to all users, including customers, vendors, and administrators.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">2. Platform Description</h2>
            <p className="text-sm text-surface-600 leading-relaxed">
              NexusMart is a multi-vendor marketplace that connects buyers with independent sellers. We provide the technology platform for vendors to list products and for customers to purchase them. NexusMart is not the seller of products listed by third-party vendors unless otherwise stated.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">3. User Accounts</h2>
            <ul className="list-disc list-inside text-sm text-surface-600 space-y-2 leading-relaxed">
              <li>You must be at least 18 years old to create an account.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must provide accurate and complete information during registration.</li>
              <li>One person or entity may maintain only one account.</li>
              <li>You are responsible for all activities that occur under your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">4. Vendor Terms</h2>
            <ul className="list-disc list-inside text-sm text-surface-600 space-y-2 leading-relaxed">
              <li>Vendors are responsible for the accuracy of product listings, descriptions, and pricing.</li>
              <li>Vendors must fulfill orders in a timely manner and handle returns according to platform policies.</li>
              <li>Vendors are responsible for their own tax obligations and business licenses.</li>
              <li>NexusMart reserves the right to remove listings that violate our policies.</li>
              <li>Vendors agree to pay applicable commission fees on completed sales.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">5. Purchases & Payments</h2>
            <p className="text-sm text-surface-600 leading-relaxed">
              All prices are listed in the currency shown at checkout. Payment is processed securely through our payment partners. NexusMart is not responsible for any additional fees charged by your financial institution. We reserve the right to refuse or cancel any order for any reason.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">6. Shipping & Returns</h2>
            <p className="text-sm text-surface-600 leading-relaxed">
              Shipping policies vary by vendor and are listed on each product page. Returns are subject to the individual vendor's return policy. NexusMart mediates disputes between buyers and vendors when necessary but is not liable for shipping delays or product quality issues caused by vendors.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">7. Prohibited Activities</h2>
            <p className="text-sm text-surface-600 leading-relaxed">
              Users may not: use the platform for fraudulent purposes; list counterfeit or stolen goods; harass or abuse other users; attempt to bypass security measures; scrape or collect user data without consent; or engage in any activity that violates applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">8. Intellectual Property</h2>
            <p className="text-sm text-surface-600 leading-relaxed">
              All content on the Platform, including logos, text, graphics, and software, is the property of NexusMart or its licensors and is protected by intellectual property laws. Vendors retain rights to their product images and descriptions but grant NexusMart a license to display them on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">9. Limitation of Liability</h2>
            <p className="text-sm text-surface-600 leading-relaxed">
              NexusMart provides the platform "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability is limited to the amount you paid to us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">10. Contact</h2>
            <p className="text-sm text-surface-600 leading-relaxed">
              For questions about these Terms & Conditions, please contact us at support@nexusmart.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
