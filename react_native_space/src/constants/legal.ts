// In-app copies of the legal documents so the policies are always accessible
// inside the app (required by the App/Play stores for UGC apps). The canonical,
// hostable Markdown versions live in the project's output/legal/ folder — keep
// these in sync when you update them, and host them at a public URL for the
// store listings.

export const LEGAL_EFFECTIVE_DATE = '7 July 2026';

export const PRIVACY_POLICY = `SipHappens — Privacy Policy
Effective date: ${LEGAL_EFFECTIVE_DATE}

SipHappens is a social spirits-journaling app operated by AJ Web Design ("we",
"us", "our"). This policy explains what we collect, how we use it, and your
choices. Contact: aj.hartman47@gmail.com.

1. Who can use SipHappens
Only users of legal drinking age in their country or region. We do not knowingly
collect information from anyone under the legal drinking age.

2. Information we collect
- Account info: email, password (stored only as a secure hash), display name,
  optional profile photo and bio.
- Age confirmation and its timestamp.
- Content you create: pours, notes, ratings, flavor tags, photos, shelf/radar
  lists, follows and cheers.
- Bottle scan images, which are sent to our AI provider (Google Gemini) to
  identify the spirit.
- Technical data: push-notification token (if enabled) and error logs.

3. How we use your information
To operate the app, identify bottles, send transactional emails (e.g. password
reset), send push notifications you enable, keep the service safe (moderation),
and diagnose problems.

4. How your information is shared
- With other users: your name, photo, bio, and content you choose to share.
  Private pours are not shown in the feed.
- With service providers who run the app: Supabase (database + image storage),
  Render (backend hosting), Google Gemini (AI identification), Resend
  (transactional email), Sentry (error reporting).
- For legal reasons where required.
We do not sell your personal information.

5. Data retention
We keep your information while your account is active. Deleting your account
removes your account and associated content, including uploaded images.

6. Security
Passwords are hashed and access is authenticated. No system is perfectly secure,
but we take reasonable measures to protect your data.

7. Your choices and rights
- Edit your profile in the app.
- Permanently delete your account and data from Profile > Edit > Delete Account.
- Disable push notifications in device settings.
- You may have additional rights depending on where you live; contact us to
  exercise them.

8. Changes
We may update this policy; material changes update the effective date.

9. Contact
AJ Web Design — SipHappens, aj.hartman47@gmail.com`;

export const TERMS_OF_SERVICE = `SipHappens — Terms of Service
Effective date: ${LEGAL_EFFECTIVE_DATE}

By creating an account or using SipHappens (operated by AJ Web Design) you agree
to these Terms. If you do not agree, do not use the app.

1. Eligibility — legal drinking age
You must be of legal drinking age in your country or region. By using the app you
confirm you meet this requirement. Please enjoy spirits responsibly.

2. Your account
You are responsible for your credentials and activity under your account. Keep
your information accurate. You may delete your account at any time.

3. User content
You own the content you create. By posting, you grant us a non-exclusive licence
to host and display it to operate the app (including showing shared content to
other users). You are responsible for content you post.

4. Acceptable use
Do not post illegal, hateful, harassing, obscene, or objectionable content;
impersonate others; promote irresponsible or unlawful alcohol use or target
anyone under the legal drinking age; harass other users; or attempt to breach
security or misuse the service.

5. Moderation, reporting, and enforcement
You can report content or users and block other users. We may remove content and
suspend or delete accounts that violate these Terms, and we aim to act on valid
reports of objectionable content promptly.

6. AI bottle identification
AI identification may be inaccurate and is provided for informational and
entertainment purposes only.

7. Service availability
The app is provided "as is" and "as available"; we do not guarantee
uninterrupted or error-free operation.

8. Disclaimers and liability
To the maximum extent permitted by law, we disclaim warranties and are not liable
for indirect or consequential damages arising from your use of the app.

9. Termination
We may suspend or terminate access for violations. You may stop using the app and
delete your account at any time.

10. Changes
We may update these Terms; continued use means you accept the updates.

11. Contact
AJ Web Design — SipHappens, aj.hartman47@gmail.com`;
