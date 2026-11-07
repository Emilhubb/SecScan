import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using SecScan.",
};

const sectionClass = "flex flex-col gap-2";
const headingClass = "text-lg font-semibold text-white sm:text-xl";
const textClass = "text-sm leading-7 text-slate-300 sm:text-base";

export default function TermsPage() {
  return (
    <article className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-7 px-4 py-8 text-white sm:px-6 sm:py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">Terms of Service</h1>
        <p className="text-sm text-slate-400 sm:text-base">
          Effective November 7, 2026
        </p>
        <p className={textClass}>
          These Terms of Service explain the rules for using SecScan. By
          accessing or using SecScan, you agree to these terms. If you do not
          agree, do not use the service.
        </p>
      </header>

      <section className={sectionClass}>
        <h2 className={headingClass}>The service</h2>
        <p className={textClass}>
          SecScan is a website security configuration scanner. It checks
          information observable from a public domain, including HTTPS
          responses, security headers, cookie attributes, TLS details, and
          redirects. It provides scores, findings, and suggested improvements.
          Scans are read-only and do not change the site being scanned.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Acceptable use and authorization</h2>
        <p className={textClass}>
          Only scan websites that you own or have permission to assess. You are
          responsible for the domains you submit and for complying with
          applicable laws, regulations, and third-party terms. Do not use
          SecScan to disrupt a service, bypass access controls, violate
          another person’s rights, or submit requests in a way that interferes
          with a website or its users. Do not attempt to compromise SecScan or
          misuse its accounts, reports, or infrastructure.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Accounts and reports</h2>
        <p className={textClass}>
          You may run scans without an account. An account can provide synced
          scan history and saved PDF reports. Keep your sign-in credentials
          secure and tell us if you believe your account has been accessed
          without your permission. You are responsible for activity carried
          out through your account.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Results and limitations</h2>
        <p className={textClass}>
          Scan results are a point-in-time view from SecScan’s network
          location. Website responses and configurations can vary by page,
          region, or request, and may change after a scan. SecScan does not
          crawl a site, test application behavior, or perform a penetration
          test. Results are informational only, may be incomplete, and are not
          a guarantee of security or a compliance certification. You are
          responsible for evaluating results and deciding what action to take.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Privacy</h2>
        <p className={textClass}>
          SecScan’s collection and use of information is described in the{" "}
          <a
            className="font-medium text-violet-300 underline decoration-violet-500/50 underline-offset-4 hover:text-violet-200"
            href="/privacy"
          >
            Privacy Policy
          </a>
          . By using the service, you acknowledge that information is handled
          as described there.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Availability and changes</h2>
        <p className={textClass}>
          SecScan may change, suspend, or discontinue features as the service
          develops. We may restrict access when reasonably needed to protect
          the service or address misuse. We may update these terms by
          publishing a revised version on this page; the effective date above
          shows when they were last updated. Continued use after an update
          means you accept the revised terms.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Disclaimer and liability</h2>
        <p className={textClass}>
          To the extent permitted by applicable law, SecScan is provided “as
          is” and “as available,” without warranties that it will be
          uninterrupted, error-free, or suitable for a particular purpose. To
          the extent permitted by applicable law, SecScan and its operator are
          not liable for indirect, incidental, special, consequential, or
          punitive loss arising from your use of, or inability to use, the
          service. Nothing in these terms limits liability that cannot
          lawfully be limited.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Contact</h2>
        <p className={textClass}>
          Questions about these terms? Email{" "}
          <a
            className="font-medium text-violet-300 underline decoration-violet-500/50 underline-offset-4 hover:text-violet-200"
            href="mailto:emil.kazimli93@gmail.com"
          >
            emil.kazimli93@gmail.com
          </a>
          .
        </p>
      </section>
    </article>
  );
}
