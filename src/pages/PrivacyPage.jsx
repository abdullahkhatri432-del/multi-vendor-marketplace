export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="card p-8 sm:p-12">
        <h1 className="text-3xl font-display font-bold text-surface-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-surface-500 mb-8">Last updated: August 8, 2026</p>

        <div className="prose prose-surface max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">1. Information We Collect</h2>
            <p className="text-sm text-surface-600 leading-relaxed mb-3">We collect the following types of information:</p>
            <ul className="list-disc list-inside text-sm text-surface-600 space-y-2 leading-relaxed">
              <li><strong>Account Information:</strong> Name, email address, password (encrypted), and profile photo when you register.</li>
              <li><strong>Transaction Information:</strong> Purchase history, order details, payment method (tokenized), and shipping address.</li>
              <li><strong>Device & Usage Information:</strong> IP address, browser type, pages visited, and interactions with the platform.</li>
              <li><strong>Communication Information:</strong> Customer support messages, reviews, and feedback you provide.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-sm text-surface-600 space-y-2 leading-relaxed">
              <li>To provide, maintain, and improve our services.</li>
              <li>To process transactions and send order confirmations.</li>
              <li>To communicate with you about your account, orders, and platform updates.</li>
              <li>To personalize your experience and show relevant product recommendations.</li>
              <li>To detect, prevent, and address fraud, abuse, or security issues.</li>
              <li>To comply with legal obligations and enforce our terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">3. Information Sharing</h2>
            <p className="text-sm text-surface-600 leading-relaxed mb-3">We do not sell your personal information. We may share information with:</p>
            <ul className="list-disc list-inside text-sm text-surface-600 space-y-2 leading-relaxed">
              <li><strong>Vendors:</strong> Order details and shipping information necessary to fulfill your purchase.</li>
              <li><strong>Service Providers:</strong> Payment processors, hosting providers, and analytics services that help us operate the platform.</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government investigation.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">4. Cookies & Tracking</h2>
            <p className="text-sm text-surface-600 leading-relaxed">
              We use cookies and similar technologies to remember your preferences, keep you signed in, understand how you use our platform, and improve our services. You can control cookie settings through your browser, but disabling cookies may affect functionality.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">5. Data Security</h2>
            <p className="text-sm text-surface-600 leading-relaxed">
              We implement industry-standard security measures including encryption, secure socket layer (SSL) technology, and regular security assessments. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">6. Your Rights</h2>
            <ul className="list-disc list-inside text-sm text-surface-600 space-y-2 leading-relaxed">
              <li><strong>Access:</strong> Request a copy of your personal data.</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information.</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data.</li>
              <li><strong>Portability:</strong> Export your data in a machine-readable format.</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">7. Children's Privacy</h2>
            <p className="text-sm text-surface-600 leading-relaxed">
              Our platform is not intended for children under 13. We do not knowingly collect information from children. If we become aware that a child under 13 has provided us with personal information, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">8. Third-Party Links</h2>
            <p className="text-sm text-surface-600 leading-relaxed">
              Our platform may contain links to third-party websites. We are not responsible for the privacy practices or content of those sites. We encourage you to read their privacy policies before providing any information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">9. Changes to This Policy</h2>
            <p className="text-sm text-surface-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the "Last updated" date. Continued use after changes constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">10. Contact Us</h2>
            <p className="text-sm text-surface-600 leading-relaxed">
              If you have questions about this Privacy Policy or your data, contact us at:
              <br />Email: privacy@nexusmart.com
              <br />Platform: NexusMart Support Center
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
