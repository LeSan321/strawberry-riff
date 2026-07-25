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

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#1a0a1e] text-gray-300">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#1a0a1e]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-rose-400 hover:text-rose-300 text-sm transition-colors">
            ← Back to Strawberry Riff
          </Link>
          <span className="text-xs text-gray-500">Working Draft v0.2 — June 2026</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-10">
          <p className="text-rose-400 text-sm font-medium tracking-wide uppercase mb-2">Strawberry Riff Ecosystem</p>
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>

          {/* "Please read this" note */}
          <div className="bg-rose-950/30 border border-rose-800/40 rounded-lg p-5 mb-6">
            <p className="text-rose-200 font-medium mb-2">We actually wrote this for you to read.</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Most Terms of Service are written to protect platforms from their users — dense legal language designed to
              obscure what's actually happening. This one is different. We've written it in plain language because we
              believe you deserve to know exactly what you're agreeing to. We've explained what the legal constructions
              mean, been honest about what we don't yet know, and made our commitments to you as clear as we can. It's
              longer than most because it's actually saying something. We think that's worth a few minutes of your time.
            </p>
          </div>

          {/* Draft notice */}
          <div className="bg-amber-950/30 border border-amber-700/40 rounded-lg p-4 text-sm text-amber-300">
            <strong>Working draft — not yet legally effective.</strong> This document is pending legal review.
            Sections marked with ⚠ require finalization before this document becomes effective. Questions?{" "}
            <Placeholder text="legal contact email — coming soon" />
          </div>
        </div>

        {/* Intro */}
        <div className="mb-10 text-gray-400 leading-relaxed italic border-l-2 border-rose-800/40 pl-4">
          Strawberry Riff exists because we believe authentic creative expression — however unpolished, however
          AI-assisted — deserves a stage, an audience, and real ownership. Everything in this agreement is built from
          that belief.
        </div>

        {/* Section 1 */}
        <Section id="agreement" title="1. The agreement">
          <p>
            These Terms of Service govern your use of the Strawberry Riff ecosystem, which includes:
          </p>
          <BulletList items={[
            <><strong className="text-white">Strawberry Riff</strong> — the community platform where creators share music, build audiences, and find their tribe</>,
            <><strong className="text-white">Strawberry Studios</strong> — the AI-powered production environment where music gets visualized and packaged</>,
            <><strong className="text-white">Blooming Frontier Radio</strong> — the broadcast platform for AI-generated music</>,
            <><strong className="text-white">Blooming Frontier</strong> — the personal discovery platform powered by your Frequency</>,
            <><strong className="text-white">The Venues</strong> — 3D concert spaces where creators perform and communities gather (in development; separate addendum will apply when live)</>,
          ]} />
          <p>
            Collectively we refer to these as "the Platform" or "the Ecosystem." By creating an account or using any
            part of the Platform, you agree to these Terms. If you don't agree, please don't use the Platform.
          </p>
          <p>
            The Platform is operated by: <Placeholder text="Legal entity name, registered address, Washington State" />
          </p>
        </Section>

        {/* Section 2 */}
        <Section id="eligibility" title="2. Age and eligibility">
          <p>
            You must be at least <strong className="text-white">16 years old</strong> to use the Platform. By creating
            an account, you confirm that you are 16 or older.
          </p>
          <p>
            We chose 16 as our minimum deliberately. The Frequency system collects personal creative and emotional data
            to build your visual identity. That's not the right environment for younger users, and 16 is the standard
            recognized by European data protection law for consent to personal data processing. If we discover an
            account belongs to someone under 16, we will close it and delete their data.
          </p>
          <p>
            If you are using the Platform on behalf of an organization, you confirm that you have authority to bind
            that organization to these Terms.
          </p>
        </Section>

        {/* Section 3 */}
        <Section id="account" title="3. Your account">
          <p>
            Accounts are created via Clerk (our authentication provider). We do not store your password — credential
            management is handled entirely by Clerk. You are responsible for maintaining access to your authentication
            method and for all activity that occurs under your account.
          </p>
          <p>
            If you believe your account has been compromised, contact us immediately at:{" "}
            <Placeholder text="security contact email" />
          </p>
          <p>
            We reserve the right to suspend or close accounts that violate these Terms, with notice wherever possible.
          </p>
        </Section>

        {/* Section 4 */}
        <Section id="ownership" title="4. Ownership — the most important section">
          <div className="bg-rose-950/20 border border-rose-800/30 rounded-lg p-4 mb-4">
            <p className="text-rose-200 text-sm font-medium">
              This is the section we want you to read most carefully, because it's where we make our clearest
              commitments to you.
            </p>
          </div>

          <h3 className="text-white font-semibold mt-6 mb-3">What you own</h3>
          <p>
            Everything you upload to the Platform is yours. Every audio file, every lyric, every image, every piece of
            content you bring to Strawberry Riff belongs to you permanently and completely. We do not claim any
            ownership over content you upload. We never will.
          </p>
          <p>
            Everything you create using our tools — tracks generated in Studio, cover art generated through your
            Frequency, Director's Packages produced by the Expert Council, video shots produced via our generation
            pipeline — belongs to you. You can use it commercially, share it, build on it, brief human production
            teams with it, or do anything else you choose. The Platform makes no claim on what you make here.
          </p>

          <h3 className="text-white font-semibold mt-6 mb-3">The honest reality about AI-generated content and copyright</h3>
          <p>
            We want to be straight with you about something the rest of the industry often obscures: the legal status
            of AI-generated content is unsettled.
          </p>
          <p>
            The US Copyright Office's current position is that works generated entirely by AI without meaningful human
            authorship may not be eligible for copyright protection. This means a track generated from a brief
            one-line prompt may not be legally copyrightable by anyone — not you, and not us.
          </p>
          <p>
            Where your creative choices are meaningful and substantial — real lyrics you wrote, specific emotional
            direction, curation decisions, the personal vocabulary built through your Frequency — there is a reasonable
            argument that those human-authored elements carry some protectable expression. But this is actively evolving
            law, and we won't overstate certainty that doesn't yet exist.
          </p>
          <p>
            What we can promise you clearly: we will never claim ownership of your AI-generated outputs. We will never
            use the legal uncertainty around AI copyright as a justification to extract rights from you. Whatever the
            law ultimately says about AI-generated works, our position is the same: what you make here is yours.
          </p>
          <p className="text-gray-500 text-sm italic">
            We recommend consulting an intellectual property attorney if copyright protection of specific works matters
            to you commercially.
          </p>

          <h3 className="text-white font-semibold mt-6 mb-3">What we own</h3>
          <p>
            The Platform itself — the Frequency system, the Genre Grammar Bibles, the Cinématique intelligence layer,
            the Expert Council, the Visual Universe framework, the Venue worlds, the design, the code, the creative
            architecture — is our intellectual property. Using the Platform gives you access to these tools; it does
            not transfer ownership of them to you.
          </p>

          <h3 className="text-white font-semibold mt-6 mb-3">The limited license we need to operate</h3>
          <p>
            Even though your content belongs to you, we need a narrow technical license to do things like display your
            tracks to listeners, generate your cover art, store your files, and serve your music video campaigns.
            Without this we literally couldn't show your music to anyone.
          </p>
          <p>
            Here is exactly what we're asking for: a non-exclusive, royalty-free, worldwide license to host, store,
            display, distribute, and perform your content solely for the purpose of operating the Platform and
            providing the services you've asked for. That's it. We don't sell it, license it to others, or use it to
            train AI models. The license ends when you delete your content or close your account.
          </p>

          <h3 className="text-white font-semibold mt-6 mb-3">Training data — a clear promise</h3>
          <p>
            We will never use your uploaded or generated content to train, fine-tune, or improve AI models — ours or
            anyone else's — without your explicit, informed, opt-in consent. This is a non-negotiable platform
            principle. If that ever changes, we will ask you clearly and give you the choice to say no.
          </p>
        </Section>

        {/* Section 5 */}
        <Section id="conduct" title="5. What you can and can't do">
          <p>The Platform is a creative space for music. Almost everything in service of that is welcome. A few things aren't.</p>

          <h3 className="text-white font-semibold mt-4 mb-3">You can</h3>
          <BulletList items={[
            "Upload music you own the rights to or that you have permission to upload",
            "Generate AI music, lyrics, cover art, and video campaigns using our tools",
            "Share your work publicly, privately, or with a selected inner circle",
            "Use your generated Director's Packages to brief human production teams for commercial projects",
            "Collaborate with other creators",
            "Support other creators financially through the tip system",
          ]} />

          <h3 className="text-white font-semibold mt-6 mb-3">You can't</h3>
          <BulletList items={[
            "Upload content that belongs to someone else without permission",
            "Use the Platform to harass, threaten, or harm other users",
            "Attempt to reverse-engineer, scrape, or extract our creative systems, grammar bibles, or AI infrastructure",
            "Create accounts to circumvent suspensions or bans",
            "Use the Platform for any purpose that violates applicable law",
            "Misrepresent the origin of content — claiming AI-generated work is human-made in contexts where that distinction matters",
          ]} />

          <h3 className="text-white font-semibold mt-6 mb-3">Content you're responsible for</h3>
          <p>
            You are responsible for the content you upload and generate. By uploading content, you confirm that you
            have the right to do so and that it doesn't infringe on anyone else's rights. If we receive a valid
            copyright claim regarding your content, we will notify you and follow applicable law.
          </p>
        </Section>

        {/* Section 6 */}
        <Section id="ai-generation" title="6. AI generation and third-party providers">
          <p>
            The Platform's generation features — music, video, cover art — are powered by a combination of our own
            creative intelligence layer and third-party AI providers, currently including Flux Pro 1.1 for image and
            video generation and Anthropic's Claude for language-based features.
          </p>
          <p>These providers have their own content policies that govern what can be generated through their systems. We operate within those policies. This means:</p>
          <BulletList items={[
            "Some generation requests may be declined by the underlying provider even if they don't violate our own content rules. When this happens we'll tell you as clearly as we can.",
            "We are not liable for content that a third-party provider generates, declines to generate, or flags under their own policies.",
            "Provider policies can change. We will update these Terms when material changes affect your experience.",
          ]} />
          <p>
            Our creative intelligence layer — the Genre Grammar Bibles, the Cinématique system, the Frequency
            framework, the Expert Council — is ours and guides generation toward cinematically literate, personally
            resonant output. But the underlying generation is a shared system and we want you to understand that.
          </p>
        </Section>

        {/* Section 7 */}
        <Section id="subscriptions" title="7. Subscriptions and billing">
          <p>The Platform operates on a tiered access model.</p>
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-white font-medium">Free tier</p>
              <p className="text-sm">Up to 8 published songs, basic music tools, AI generation with monthly limits, and automatic cover art on first publish.</p>
            </div>
            <div>
              <p className="text-white font-medium">Premium tier</p>
              <p className="text-sm">Unlimited songs, full Studio access including Frequency, Style Library, Riff Mode, Voice Reference, Style Reference, and the full cover art pipeline.</p>
            </div>
            <div>
              <p className="text-white font-medium">Venue tier</p>
              <p className="text-sm text-gray-500"><Placeholder text="Description coming when Venues launch" /></p>
            </div>
          </div>
          <p>
            Subscriptions are processed via Stripe. By subscribing you agree to Stripe's terms in addition to ours.
            Payments are charged at the start of each billing period and recur automatically until cancelled.
          </p>

          <h3 className="text-white font-semibold mt-6 mb-3">Cancellation</h3>
          <p>
            You can cancel your subscription at any time through the Stripe Customer Portal accessible from your
            account settings. Cancellation takes effect at the end of your current billing period. You retain access
            to Premium features until that date.
          </p>

          <h3 className="text-white font-semibold mt-6 mb-3">What happens to your content if you downgrade</h3>
          <p>
            Your content is yours and stays yours regardless of tier. If you downgrade from Premium to Free, you won't
            lose access to content you've already created. Features that generated that content may no longer be
            available to you, but the outputs remain in your account.
          </p>
          <p>
            If your published track count exceeds the Free tier limit at the time of downgrade, existing tracks remain
            published. The limit applies to new publishing only.
          </p>

          <h3 className="text-white font-semibold mt-6 mb-3">Refunds</h3>
          <p><Placeholder text="Refund policy — pending legal review. Likely 7-day cooling off period for new subscriptions." /></p>
        </Section>

        {/* Section 8 */}
        <Section id="tips" title="8. Creator support and tips">
          <p>The Platform enables listeners to support creators directly through a tip system powered by Stripe Connect. When you support a creator:</p>
          <BulletList items={[
            "Your payment goes directly to the creator's connected Stripe account",
            <>The Platform retains a small processing fee to cover infrastructure costs. <Placeholder text="Fee percentage to be confirmed" /> This fee is visible at the point of transaction — we don't hide it.</>,
          ]} />
          <p>
            Creators who want to receive tips must connect a Stripe account. This is subject to Stripe's identity
            verification requirements, which are Stripe's responsibility, not ours.
          </p>
          <p>
            Tips are not refundable except in cases of documented fraud. They are voluntary expressions of support,
            not purchases of goods or services.
          </p>
        </Section>

        {/* Section 9 */}
        <Section id="frequency" title="9. The Frequency — your personal creative data">
          <p>
            The Frequency system collects personal creative and emotional information through a structured
            questionnaire. This data is used to synthesize your Visual Universe — a personal vocabulary of visual
            language that powers your cover art, your Studios campaigns, and your personal discovery experience on
            Blooming Frontier.
          </p>
          <p>This data is personal and we treat it accordingly:</p>
          <BulletList items={[
            "Your Frequency data is used only to generate and personalize your creative outputs across the Platform",
            "It is never sold, shared with third parties, or used for advertising",
            "It is never used to train AI models",
            "It is stored securely and associated only with your account",
            "You can delete your Frequency data at any time from your account settings. Deletion removes it from our systems within 30 days.",
          ]} />
          <p>
            The Blooming Frontier personal discovery algorithm uses your Frequency to surface music that resonates
            with your creative identity. This is the inversion of the standard algorithmic model: the algorithm serves
            you, not the platform's engagement metrics. We are transparent about this because we think you deserve to
            know what's happening with your data and why.
          </p>
        </Section>

        {/* Section 10 */}
        <Section id="radio" title="10. Blooming Frontier Radio">
          <p>
            Blooming Frontier Radio is a broadcast platform for AI-generated music created by Platform users. It
            operates outside the traditional performance licensing framework — ASCAP, BMI, SESAC, and SoundExchange —
            because the music broadcast through it is AI-generated content that does not carry the composition rights
            or sound recording rights that those frameworks exist to administer.
          </p>
          <p>
            No PRO licensing fees are collected or owed under current US copyright law for AI-generated works
            broadcast through Blooming Frontier Radio, as interpreted in good faith by the Platform.{" "}
            <span className="text-gray-500 text-sm italic">Counsel has been asked to review this position.</span>
          </p>
          <p>
            Where a track broadcast through Blooming Frontier Radio contains human-authored elements — such as original
            lyrics — the rights status of those specific elements may differ from the AI-generated components. Creators
            are responsible for understanding the rights status of all elements in tracks they submit for broadcast.
          </p>
          <p>
            Broadcasting a creator's track on Blooming Frontier Radio requires the creator's explicit consent. This
            consent is managed through the Platform's publishing settings: creators may enable or disable Blooming
            Frontier Radio broadcast for each track independently. By enabling broadcast for a track, a creator grants
            the Platform a non-exclusive license to stream that track through Blooming Frontier Radio for as long as
            the broadcast setting remains enabled. This license can be revoked at any time by disabling the broadcast
            setting, which will remove the track from the Radio rotation within 48 hours.
          </p>
          <p>
            If your track contains samples, interpolations, or elements drawn from human-authored copyrighted works,
            clearance is your responsibility before enabling broadcast.
          </p>
          <p>
            The legal landscape governing AI-generated music is actively developing. We are operating transparently
            within current law and will update our practices, and notify users of material changes, as the law evolves.
          </p>
        </Section>

        {/* Section 11 */}
        <Section id="venues" title="11. The Venues (in development)">
          <p>
            The Venues are 3D concert worlds where creators perform, audiences gather, and communities form. This
            feature is in active development. A separate addendum to these Terms will govern Venue-specific activity
            when they launch, including:
          </p>
          <BulletList items={[
            "Concert ticket terms — access, artifact status, and any collectible or printable rights",
            "Mini-story templates — what creators can build, what the Platform provides, and clear ownership lines between the two",
            "Avatar guest terms — consent requirements when another person's likeness enters a creator's story",
            "Venue world IP — the Venue worlds themselves are Platform property; content created within them by creators belongs to creators within the limits of the template",
          ]} />
          <p className="text-gray-500 text-sm italic">
            Nothing in this section creates legal commitments about Venue features that are not yet live. When the
            Venue addendum is published, it will be incorporated into these Terms and you will be notified.
          </p>
        </Section>

        {/* Section 12 */}
        <Section id="liability" title="12. Liability and warranties">
          <p>
            The Platform is provided as-is. We work hard to keep it running well, but we can't guarantee it will be
            available at all times or that AI-generated outputs will meet every expectation.
          </p>
          <h3 className="text-white font-semibold mt-4 mb-3">What we don't warrant</h3>
          <BulletList items={[
            "That the Platform will be uninterrupted or error-free",
            "That AI-generated content — music, video, cover art, lyrics — will be free from resemblance to existing copyrighted material. The generation systems are trained on existing creative works and we cannot audit every output.",
            "That generated content will be eligible for copyright protection under current or future law",
            "That third-party provider availability (Flux Pro, Anthropic, Stripe, Clerk) will be continuous",
          ]} />
          <h3 className="text-white font-semibold mt-6 mb-3">Limitation of liability</h3>
          <p>
            To the fullest extent permitted by Washington State law, Strawberry Riff's liability to you for any claim
            arising from your use of the Platform is limited to the amount you paid us in the 12 months preceding the
            claim. We are not liable for indirect, incidental, or consequential damages.
          </p>
        </Section>

        {/* Section 13 */}
        <Section id="dmca" title="13. Copyright and DMCA">
          <p>
            We respect intellectual property rights and expect users to do the same. If you believe content on the
            Platform infringes your copyright, please send a DMCA notice to:{" "}
            <Placeholder text="DMCA agent name and contact — required for safe harbor protection" />
          </p>
          <p>A valid DMCA notice must include:</p>
          <BulletList items={[
            "Identification of the copyrighted work",
            "Identification of the infringing material and its location on the Platform",
            "Your contact information",
            "A good-faith statement that the use is not authorized",
            "A statement of accuracy under penalty of perjury",
          ]} />
          <p>We will respond to valid notices promptly and notify the account holder where required by law.</p>
        </Section>

        {/* Section 14 */}
        <Section id="changes" title="14. Changes, suspension, and termination">
          <h3 className="text-white font-semibold mb-3">Changes to these Terms</h3>
          <p>
            We'll update these Terms when the Platform changes in ways that affect your rights or obligations. When we
            make material changes, we'll notify you by email and give you at least 30 days before the new Terms take
            effect. Continued use after that date means you accept the updated Terms.
          </p>
          <h3 className="text-white font-semibold mt-6 mb-3">Account suspension and termination</h3>
          <p>
            We can suspend or terminate accounts that violate these Terms. Where possible we'll give notice and an
            opportunity to respond before termination. Serious violations — illegal content, fraud, deliberate harm to
            other users — may result in immediate suspension.
          </p>
          <h3 className="text-white font-semibold mt-6 mb-3">What survives termination</h3>
          <p>
            When your account closes, your ownership of your content doesn't disappear. You can request a download of
            your uploaded files before closure. After 30 days following account closure we will delete your data from
            our systems, except where we're legally required to retain it.
          </p>
          <p>Sections 4 (Ownership), 12 (Liability), and 13 (DMCA) survive termination of these Terms.</p>
        </Section>

        {/* Section 15 */}
        <Section id="disputes" title="15. Governing law and disputes">
          <p>
            These Terms are governed by the laws of Washington State, United States, without regard to conflict of law
            principles.
          </p>
          <p>
            We'd rather resolve disputes by talking to you directly than through litigation. If you have a concern,
            contact us first at: <Placeholder text="dispute contact email" />
          </p>
          <p>
            If we can't resolve it directly, disputes will be resolved through binding arbitration in Washington State
            under the rules of the American Arbitration Association, except that either party may seek injunctive
            relief in court for intellectual property matters.
          </p>
        </Section>

        {/* Section 16 */}
        <Section id="general" title="16. General provisions">
          <BulletList items={[
            "If any part of these Terms is unenforceable, the rest remains in effect.",
            "Our failure to enforce any provision doesn't waive our right to enforce it later.",
            "These Terms are the complete agreement between you and Strawberry Riff regarding the Platform.",
            "You can't transfer your account or rights under these Terms to anyone else.",
          ]} />
        </Section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10 text-sm text-gray-500 space-y-2">
          <p>Working Draft v0.2 — June 2026. Prepared for legal review. Not yet legally effective.</p>
          <p>
            See also:{" "}
            <Link href="/privacy" className="text-rose-400 hover:text-rose-300 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
