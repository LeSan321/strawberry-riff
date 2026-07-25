import { Link } from "wouter";

function Placeholder({ text }: { text: string }) {
  return (
    <span className="inline-block bg-amber-950/40 border border-amber-700/50 text-amber-400 text-xs px-2 py-0.5 rounded font-mono">
      ⚠ {text}
    </span>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10">
      <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-white/10">{title}</h2>
      <div className="space-y-4 text-gray-300 leading-relaxed">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2 ml-4">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-rose-400 mt-1 shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-white font-semibold mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#1a0a1e] text-gray-300">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#1a0a1e]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-rose-400 hover:text-rose-300 text-sm transition-colors">
            ← Back to Strawberry Riff
          </Link>
          <span className="text-xs text-gray-500">Working Draft v0.1 — June 2026</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-10">
          <p className="text-rose-400 text-sm font-medium tracking-wide uppercase mb-2">Strawberry Riff Ecosystem</p>
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>

          {/* "Please read this" note */}
          <div className="bg-rose-950/30 border border-rose-800/40 rounded-lg p-5 mb-6">
            <p className="text-rose-200 font-medium mb-2">We actually wrote this for you to read.</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Most privacy policies are written to disclose as little as possible in as many words as possible. This
              one is written to tell you exactly what we do with your data, why, and what we never do — in language
              you can actually read. We've organized it around what data we collect rather than around legal
              categories, because that's more useful to you. Your creative data — especially your Frequency — belongs
              to your creative life, not to our data economy. We think that's worth saying clearly.
            </p>
          </div>

          {/* Draft notice */}
          <div className="bg-amber-950/30 border border-amber-700/40 rounded-lg p-4 text-sm text-amber-300">
            <strong>Working draft — not yet legally effective.</strong> This document is pending legal review.
            Sections marked with ⚠ require finalization before this document becomes effective. Questions?{" "}
            <Placeholder text="privacy contact email — coming soon" />
          </div>
        </div>

        {/* Intro */}
        <div className="mb-10 text-gray-400 leading-relaxed italic border-l-2 border-rose-800/40 pl-4">
          The short version: we collect what we need to run the Platform, we use it only for that purpose, we never
          sell it or use it to build advertising profiles, and we never use it to train AI.
        </div>

        {/* Section 1 */}
        <Section id="who-we-are" title="1. Who we are">
          <p>
            This Privacy Policy applies to the Strawberry Riff ecosystem: Strawberry Riff, Strawberry Studios,
            Blooming Frontier Radio, and Blooming Frontier. Collectively these are operated by:{" "}
            <Placeholder text="Legal entity name, registered address, Washington State" />
          </p>
          <p>
            We are the data controller for personal data collected through the Platform. Where we use third-party
            services that process data on our behalf, they are listed in Section 4.
          </p>
        </Section>

        {/* Section 2 */}
        <Section id="what-we-collect" title="2. What data we collect and why">
          <SubSection title="Account and identity data">
            <p>When you create an account, we receive from Clerk (our authentication provider):</p>
            <BulletList items={[
              "Your email address",
              "Your name or display name if provided",
              "An authentication token that identifies your session",
            ]} />
            <p>
              We do not receive or store your password. Clerk handles all credential management. Your password never
              touches our servers.
            </p>
            <p className="text-gray-500 text-sm italic">
              Why we collect this: to create and maintain your account, to identify you across sessions, and to
              contact you about your account when necessary.
            </p>
          </SubSection>

          <SubSection title="Profile data">
            <p>After signing in for the first time, you may choose to complete a profile including:</p>
            <BulletList items={[
              "A display name — shown on your tracks, profile, and in community spaces",
              "A bio — a short description you write yourself",
              "An avatar image — uploaded by you, stored in AWS S3",
            ]} />
            <p>
              All profile data is voluntary and editable at any time. Your display name and avatar are visible to
              other users when you publish content publicly.
            </p>
          </SubSection>

          <SubSection title="Content you upload">
            <p>
              Audio files, images, and other creative content you upload to the Platform are stored in AWS S3 in US
              regions. We store references to your files in our database alongside the metadata you provide — track
              titles, descriptions, vibe tags, visibility settings.
            </p>
            <p>
              We do not process your audio files beyond what's needed to serve them to you and your chosen audience.
              We do not analyze them for advertising, behavioral profiling, or training data.
            </p>
          </SubSection>

          <SubSection title="Content generated through our tools">
            <p>
              When you use Studio, the Lyrics Generator, the cover art system, or other generation features, the
              outputs are stored in AWS S3 and associated with your account. The prompts and parameters you use to
              generate content are logged temporarily for system reliability and error recovery, and are not retained
              beyond <Placeholder text="data retention period for generation logs — recommend 30 days" />
            </p>
          </SubSection>

          <SubSection title="The Frequency — your creative and emotional data">
            <p>
              The Frequency questionnaire is the most personal data we collect. It asks about your emotional
              relationship to music, your aesthetic instincts, and your creative identity. The answers are synthesized
              into your Visual Universe — a personal vocabulary that powers your cover art, your Studios campaigns,
              and your discovery experience on Blooming Frontier.
            </p>
            <p>We treat Frequency data with particular care because of what it is:</p>
            <BulletList items={[
              "It is used only to generate and personalize your creative outputs across the Platform",
              "It is never used for advertising or behavioral profiling",
              "It is never sold or shared with third parties",
              "It is never used to train AI models — ours or anyone else's",
              "It is stored securely and associated only with your account",
              "You can delete it at any time. See Section 5 for how.",
            ]} />
            <div className="bg-rose-950/20 border border-rose-800/30 rounded-lg p-4 mt-4">
              <p className="text-rose-200 text-sm leading-relaxed">
                When your Frequency powers the Blooming Frontier personal discovery algorithm, it does so on your
                behalf and for your benefit — to surface music that genuinely resonates with your creative identity.
                Standard platforms use your data to optimize for their engagement metrics.{" "}
                <strong>Blooming Frontier uses your Frequency to optimize for your experience. The algorithm serves you.</strong>{" "}
                We are saying this out loud because you deserve to know.
              </p>
            </div>
          </SubSection>

          <SubSection title="Subscription and billing data">
            <p>
              Payments are processed by Stripe. We do not store your payment card details — Stripe handles all
              payment data under their own PCI-compliant systems. We receive from Stripe:
            </p>
            <BulletList items={[
              "Your subscription status and tier",
              "Your billing history (amounts, dates)",
              "A Stripe customer ID that links your account to your Stripe record",
            ]} />
            <p>This data is used only to manage your subscription and resolve billing questions.</p>
          </SubSection>

          <SubSection title="Technical and usage data">
            <p>To keep the Platform running and diagnose problems, we collect basic technical data:</p>
            <BulletList items={[
              "Log data: IP addresses, browser type, pages visited, time and date of requests, error events",
              "Session data: authentication state managed through Clerk",
            ]} />
            <p>
              We do not currently run third-party behavioral analytics tools such as Google Analytics.{" "}
              <Placeholder text="Update when analytics approach is decided" />
            </p>
            <p>
              We do not build behavioral profiles from usage data. We do not sell usage data. We do not use usage
              data for advertising.
            </p>
          </SubSection>

          <SubSection title="Communications data">
            <p>
              If you contact us directly — by email or through any support channel — we retain that correspondence to
              resolve your issue and improve the Platform.
            </p>
            <p>Regarding marketing communications — what we commit to now:</p>
            <BulletList items={[
              "We will never send you marketing communications without your clear, affirmative opt-in",
              "Every marketing email will have a working unsubscribe link",
              "Unsubscribing will be immediate and permanent unless you opt back in",
              "We will not share your email address with third parties for marketing purposes",
            ]} />
            <p><Placeholder text="Update when email marketing approach is finalized" /></p>
          </SubSection>
        </Section>

        {/* Section 3 */}
        <Section id="what-we-never-do" title="3. What we never do with your data">
          <p>
            We want to be as clear about what we don't do as about what we do. These are not just good intentions —
            they're commitments we're making in writing:
          </p>
          <BulletList items={[
            "We never sell your personal data to anyone",
            "We never use your data to build advertising profiles or target you with behavioral advertising",
            "We never use your uploaded or generated content to train AI models without your explicit, informed, opt-in consent",
            "We never share your Frequency data with third parties",
            "We never use your creative or emotional data for any purpose beyond personalizing your experience on the Platform",
            "We never retain your payment card details — that data never reaches our servers",
            "We never obscure what we're doing with your data in language designed to hide it",
          ]} />
        </Section>

        {/* Section 4 */}
        <Section id="who-we-share-with" title="4. Who we share data with">
          <p>
            We share data with a small number of service providers who help us operate the Platform. These providers
            process data on our behalf and are contractually bound to use it only for the services they provide to us.
          </p>

          <div className="space-y-4 mt-4">
            {[
              {
                name: "Clerk",
                desc: "Authentication and identity management. Manages account creation, login, and session tokens.",
                data: "Email address, authentication credentials.",
                note: <Placeholder text="Clerk privacy policy URL" />,
              },
              {
                name: "AWS (Amazon Web Services)",
                desc: "File storage. All audio files, images, generated video, and cover art are stored in AWS S3 in US regions.",
                data: "File content and associated storage metadata.",
              },
              {
                name: "Stripe",
                desc: "Payment processing and creator payouts via Stripe Connect.",
                data: "Subscription status, transaction amounts, Stripe customer IDs. We do not share your name, email, or creative data with Stripe beyond what their systems require to process payments.",
              },
              {
                name: "Anthropic (Claude API)",
                desc: "Language-based AI features including the Riff Assistant and Lyrics Generator.",
                data: "Your prompts and conversational inputs when using these features.",
                note: <Placeholder text="Anthropic API data use policy URL — confirm training data terms" />,
              },
              {
                name: "Flux Pro 1.1",
                desc: "Visual generation features including cover art and Studios video shots.",
                data: "Your generation prompts and parameters.",
                note: <Placeholder text="Flux Pro / Black Forest Labs data processing terms URL" />,
              },
            ].map((provider) => (
              <div key={provider.name} className="bg-white/5 rounded-lg p-4">
                <p className="text-white font-medium mb-1">{provider.name}</p>
                <p className="text-sm text-gray-400 mb-1">{provider.desc}</p>
                <p className="text-sm text-gray-500">Data shared: {provider.data}</p>
                {provider.note && <p className="text-sm mt-2">{provider.note}</p>}
              </div>
            ))}
          </div>

          <SubSection title="Law enforcement and legal requirements">
            <p>
              We may disclose data if required by law, court order, or valid legal process. We will notify you of
              such requests where legally permitted to do so. We will not voluntarily disclose data to law enforcement
              beyond what is legally required.
            </p>
          </SubSection>
        </Section>

        {/* Section 5 */}
        <Section id="your-rights" title="5. Your rights over your data">
          <p>You have real control over your data. Here is what you can do and how:</p>

          <SubSection title="Access">
            <p>
              You can request a copy of the personal data we hold about you. We will provide it within 30 days of a
              verified request. Contact us at: <Placeholder text="data access request email" />
            </p>
          </SubSection>

          <SubSection title="Correction">
            <p>
              If your data is inaccurate, you can update most of it directly in your account settings. For data you
              can't update yourself, contact us and we'll correct it.
            </p>
          </SubSection>

          <SubSection title="Deletion">
            <p>
              You can delete your account at any time from your account settings. Deletion removes your personal data
              from our active systems within 30 days. Some data may be retained longer where legally required — for
              example, billing records for tax and legal compliance purposes.
            </p>
            <p>
              You can delete your Frequency data independently of your account from your Frequency settings. This
              removes your Visual Universe and resets your Blooming Frontier discovery experience to platform defaults.
            </p>
            <p>
              Backup retention for deleted content:{" "}
              <Placeholder text="Backup retention period — confirm with technical team" />
            </p>
          </SubSection>

          <SubSection title="Portability">
            <p>
              You can download your uploaded audio files at any time from your account. We are working on a broader
              data export feature that will include your generated content and profile data.{" "}
              <Placeholder text="Data export feature timeline — flag for development roadmap" />
            </p>
          </SubSection>

          <SubSection title="Objection and restriction">
            <p>
              If you believe we are processing your data in a way you haven't consented to or that is inconsistent
              with these commitments, contact us. We will investigate and respond within 30 days.
            </p>
          </SubSection>
        </Section>

        {/* Section 6 */}
        <Section id="cookies" title="6. Cookies and local storage">
          <p>
            We use a session cookie issued by Clerk to maintain your authenticated state across visits. This cookie
            is necessary for the Platform to function — without it you would need to log in on every page load. It
            does not track you across other websites.
          </p>
          <p>
            We do not currently use third-party advertising cookies or tracking pixels.{" "}
            <Placeholder text="Update if analytics or marketing tools are added" />
          </p>
        </Section>

        {/* Section 7 */}
        <Section id="data-location" title="7. Where your data is stored">
          <p>
            All user data — files, database records, generated content — is stored in the United States on AWS
            infrastructure in US regions.
          </p>
          <p>
            If you are accessing the Platform from outside the United States, your data will be transferred to and
            processed in the US. By using the Platform, you consent to this transfer.
          </p>
          <p>
            We do not currently operate under EU-US data transfer frameworks, as our primary user base is US-based.
            If this changes as the Platform grows internationally, we will update this policy and implement
            appropriate transfer mechanisms.
          </p>
        </Section>

        {/* Section 8 */}
        <Section id="retention" title="8. How long we keep your data">
          <div className="bg-white/5 rounded-lg p-4">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-white/10">
                {[
                  ["Account data", "Retained while active; deleted 30 days after closure"],
                  ["Uploaded content", "Until you delete it or close your account"],
                  ["Generated content", "Until you delete it or close your account"],
                  ["Frequency data", "Until you delete it or close your account"],
                  ["Billing records", "7 years (legal and tax compliance)"],
                  ["Server logs", <Placeholder key="sl" text="Recommend 90 days — confirm with technical team" />],
                  ["Generation prompt logs", <Placeholder key="gpl" text="Recommend 30 days — confirm with technical team" />],
                ].map(([type, period], i) => (
                  <tr key={i}>
                    <td className="py-2 pr-4 text-white font-medium w-1/2">{type}</td>
                    <td className="py-2 text-gray-400">{period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Section 9 */}
        <Section id="security" title="9. Security">
          <p>We take reasonable technical and organizational measures to protect your data:</p>
          <BulletList items={[
            "Authentication is managed by Clerk, which uses industry-standard security practices",
            "Files are stored in AWS S3 with access controls that prevent unauthorized access",
            "Payment data never reaches our servers — it is handled entirely by Stripe",
            "Data in transit is encrypted via HTTPS",
          ]} />
          <p>
            No system is perfectly secure. If we become aware of a breach that affects your personal data, we will
            notify you within 72 hours of becoming aware of it, consistent with applicable law.{" "}
            <Placeholder text="Confirm breach notification process with technical team and legal counsel" />
          </p>
        </Section>

        {/* Section 10 */}
        <Section id="minors" title="10. Users under 16">
          <p>
            The Platform is not intended for users under 16 years old. We do not knowingly collect personal data from
            anyone under 16. If we become aware that we have done so, we will delete the data and close the account
            promptly.
          </p>
          <p>
            If you believe a user under 16 has created an account, please contact us at:{" "}
            <Placeholder text="child safety contact email" />
          </p>
        </Section>

        {/* Section 11 */}
        <Section id="ai-providers" title="11. A note on AI providers and your data">
          <p>
            Several Platform features are powered by third-party AI providers: Anthropic's Claude for language
            features, Flux Pro 1.1 for visual generation. When you use these features, your prompts and inputs are
            processed by these providers.
          </p>
          <p>
            We select providers whose data practices are consistent with our values — specifically, we require that
            providers do not use API inputs to train their models without explicit consent. However, their data
            practices are ultimately governed by their own terms and policies, which we link to in Section 4.
          </p>
          <p>
            We recommend reviewing those policies if you are sharing sensitive personal content through generation
            features.
          </p>
          <p><Placeholder text="Confirm with Anthropic and Flux Pro that API inputs are not used for training" /></p>
        </Section>

        {/* Section 12 */}
        <Section id="changes" title="12. Changes to this policy">
          <p>
            When we make material changes to this Privacy Policy — especially changes to what data we collect, how we
            use it, or who we share it with — we will notify you by email at least 30 days before the changes take
            effect. We will also post the updated policy with a clear note of what changed and when.
          </p>
          <p>
            We will not retroactively change how we use data we've already collected without asking for your consent
            again.
          </p>
        </Section>

        {/* Section 13 */}
        <Section id="contact" title="13. Contact and complaints">
          <p>
            For any privacy question, data request, or concern:{" "}
            <Placeholder text="Privacy contact email and response time commitment" />
          </p>
          <p>
            If you believe we've handled your data incorrectly and we haven't resolved it to your satisfaction, you
            have the right to file a complaint with the relevant data protection authority. In Washington State, the
            Attorney General's office handles consumer privacy complaints under the Washington Privacy Act.
          </p>
        </Section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10 text-sm text-gray-500 space-y-2">
          <p>Working Draft v0.1 — June 2026. Prepared for legal review. Not yet legally effective.</p>
          <p>
            See also:{" "}
            <Link href="/terms" className="text-rose-400 hover:text-rose-300 transition-colors">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
