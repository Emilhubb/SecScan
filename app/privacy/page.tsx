import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn what information SecScan collects and how it is used.",
};

const sectionClass = "flex flex-col gap-2";
const headingClass = "text-lg font-semibold text-white sm:text-xl";
const textClass = "text-sm leading-7 text-slate-300 sm:text-base";

export default function PrivacyPage() {
  return (
    <article className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-7 px-4 py-8 text-white sm:px-6 sm:py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">Privacy Policy</h1>
        <p className="text-sm text-slate-400 sm:text-base">
          Effective November 6, 2026
        </p>
        <p className={textClass}>
          This policy explains how SecScan handles information when you use the
          website security scanner, account, scan history, or report features.
        </p>
      </header>

      <section className={sectionClass}>
        <h2 className={headingClass}>Information SecScan processes</h2>
        <p className={textClass}>
          When you run a scan, SecScan processes the domain you submit and
          information returned during the scan, such as response headers,
          redirect details, TLS connection and certificate details, findings,
          score, and scan time. Scan records are stored in the service database.
          If you are signed in, they are associated with your account and shown
          in synced history; scans run while signed out are stored without an
          account association.
        </p>
        <p className={textClass}>
          If you create an account, the authentication service processes the
          details needed to authenticate you, such as your name and email
          address for email sign-up, and account information from Google if you
          choose Google sign-in. SecScan does not receive or store your Google
          password. Your browser also stores up to 25 recent scans in local
          storage for local history.
        </p>
        <p className={textClass}>
          If you save a PDF report, the PDF is uploaded to the app&apos;s file
          storage and linked to the scan in your account. Do not include
          information in submitted domains or uploaded files that you do not
          want processed by the service.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>How information is used</h2>
        <p className={textClass}>
          SecScan uses this information to perform scans, display results,
          provide local and synced history, authenticate accounts, save reports,
          and operate and protect the service. The scanner sends requests to
          the public domains you submit to read their security configuration.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Service providers and sharing</h2>
        <p className={textClass}>
          SecScan uses service providers to host the website, database,
          authentication, and file storage. These providers process information
          to deliver those services. Google is involved if you choose Google
          sign-in. Scan results and account information are not sold. SecScan
          does not publish your scan history.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Storage, cookies, and retention</h2>
        <p className={textClass}>
          Local scan history is kept in your browser until you clear it or
          remove the stored site data. Account-related cookies are used to
          maintain sign-in and protect account sessions. Scan records and saved
          reports are retained in the service database and file storage while
          needed to provide the service; contact us to request deletion. The
          website may also create technical logs as part of hosting and
          security operations.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Your choices and requests</h2>
        <p className={textClass}>
          You can clear local history from the History page, sign out, and
          contact us to request access to, correction of, or deletion of
          account-related information. We may need to verify your request and
          retain information where required for legitimate operational or legal
          reasons.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Children and policy changes</h2>
        <p className={textClass}>
          SecScan is not designed for children under 13, and we do not
          knowingly seek to collect their personal information. This policy may
          be updated as the service changes. The effective date above indicates
          when it was most recently revised.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Contact</h2>
        <p className={textClass}>
          For privacy questions or requests, email{" "}
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
