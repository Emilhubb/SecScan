import type { Metadata } from "next";

export const metadata: Metadata = { title: "About | SecScan" };

const scannedAreas = [
  "Content Security Policy (CSP)",
  "HTTP Strict Transport Security (HSTS)",
  "Clickjacking protection",
  "MIME sniffing protection",
  "Referrer Policy",
  "Permissions Policy",
  "Secure cookie attribute, when cookies are set",
  "HttpOnly cookie attribute, when cookies are set",
  "SameSite cookie attribute, when cookies are set",
  "Server version disclosure",
  "X-Powered-By information disclosure",
  "TLS protocol version",
  "TLS certificate expiry",
  "HTTP-to-HTTPS redirection",
];

export default function AboutPage() {
  return (
    <article className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-4 py-8 text-white sm:px-6 sm:py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">About SecScan</h1>
        <p className="text-sm leading-7 text-slate-300 sm:text-base">
          SecScan is a lightweight website security scanner that reviews the
          HTTPS response from a public domain and highlights common
          configuration issues. It is read-only and provides practical
          explanations and suggested fixes to help site owners improve their
          security settings.
        </p>
      </header>

      <section aria-labelledby="what-we-check" className="flex flex-col gap-3">
        <h2 id="what-we-check" className="text-lg font-semibold sm:text-xl">
          What SecScan checks
        </h2>
        <p className="text-sm leading-7 text-slate-400 sm:text-base">
          Each scan checks 14 areas: six security headers, three cookie
          attributes, two information-disclosure headers, TLS version,
          certificate expiry, and HTTP-to-HTTPS redirection. Cookie checks are
          marked not applicable when the response does not set cookies.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {scannedAreas.map((area) => (
            <li
              key={area}
              className="min-w-0 rounded-lg border border-violet-400/15 bg-slate-900/50 px-3 py-2 text-sm leading-6 text-slate-300"
            >
              {area}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="reliability" className="flex flex-col gap-3">
        <h2 id="reliability" className="text-lg font-semibold sm:text-xl">
          How reliable are the results?
        </h2>
        <p className="text-sm leading-7 text-slate-300 sm:text-base">
          SecScan makes a live HTTPS request to the domain’s root page, follows
          HTTPS redirects, and checks the final response. It also checks the
          HTTP redirect path and reads TLS details from the connection. Results
          describe what the scanner could observe at that time, from its own
          network location.
        </p>
        <p className="text-sm leading-7 text-slate-400 sm:text-base">
          Websites can return different headers by page, region, browser, or
          request type, and settings can change over time. SecScan does not
          crawl a site, test application behavior, or perform a penetration
          test. Treat the score as a helpful configuration snapshot, not a
          guarantee of security or a compliance certification. A network or
          certificate-reading issue may also prevent some checks from
          completing.
        </p>
        <p className="text-sm leading-7 text-slate-400 sm:text-base">
          Only scan domains you own or have permission to assess.
        </p>
      </section>

      <footer className="border-t border-slate-800 pt-4">
        <p className="text-sm text-slate-400">
          You can find more about my work:{"  "}
          <a
            className="font-medium text-violet-300 underline decoration-violet-500/50 underline-offset-4 hover:text-violet-200"
            href="https://github.com/Emilhubb"
            target="_blank"
            rel="noreferrer"
          >
            Github
          </a>
        </p>
        <p className="text-sm text-slate-400">
          Contact me:{" "}
          <a
            className="font-medium text-violet-300 underline decoration-violet-500/50 underline-offset-4 hover:text-violet-200"
            href="https://www.linkedin.com/in/emil-kazimov-b3b50926a/"
            target="_blank"
            rel="noreferrer"
          >
            Linkedin{" "}
          </a>
          or
          <a
            className="font-medium text-violet-300 underline decoration-violet-500/50 underline-offset-4 hover:text-violet-200"
            href="mailto:emil.kazimli93@gmail.com"
            target="_blank"
            rel="noreferrer"
          >
            {""} Email
          </a>
        </p>
      </footer>
    </article>
  );
}
