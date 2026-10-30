# SecScan | Website Security Scanner

SecScan is a lightweight website security scanner. Enter a public domain and it reviews the HTTPS response, then gives you a clear security score with practical explanations and suggested fixes. It is read-only, so it never changes anything on the scanned site.

**Live demo:** [secscan-app.vercel.app](https://secscan-app.vercel.app)

<img width="1858" height="990" alt="image" src="https://github.com/user-attachments/assets/c7c5314d-7437-441c-a21f-9a39a3265e87" />

---


## What it checks

Each scan covers 14 areas:

| Category | Checks |
| --- | --- |
| Security headers (6) | Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), clickjacking protection, MIME sniffing protection, Referrer Policy, Permissions Policy |
| Cookies (3) | `Secure`, `HttpOnly` and `SameSite` attributes (marked not applicable when the response sets no cookies) |
| Information disclosure (2) | Server version disclosure, `X-Powered-By` header |
| TLS and transport (3) | TLS protocol version, certificate expiry, HTTP-to-HTTPS redirection |

## Features

- **Domain scan** with a single input field
- **Security score** with a breakdown of every check
- **Practical recommendations** explaining what each issue means and how to fix it
- **Score history** page with a chart of previous scans
- **PDF report export** powered by jsPDF
- **About page** explaining what is checked and how reliable the results are
- **Responsive dark UI** built with Tailwind CSS


## How it works

SecScan makes a live HTTPS request to the domain's root page, follows HTTPS redirects and checks the final response. It also tests the HTTP redirect path and reads TLS details from the connection. The scanning logic runs on the server side of the Next.js app.

### Limitations

Results describe what the scanner could observe at that moment, from its own network location. Websites can return different headers by page, region, browser or request type, and settings change over time. SecScan does not crawl a site, test application behavior or perform a penetration test. Treat the score as a helpful configuration snapshot, not a guarantee of security or a compliance certification.

> **Only scan domains you own or have permission to assess.**

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [jsPDF](https://github.com/parallax/jsPDF) for PDF reports
- ESLint for code quality
- Deployed on [Vercel](https://vercel.com/)

## Project Structure

```
.
├── app/            # Routes and pages (scan, history, about)
├── components/     # Reusable UI components
├── lib/            # Scanning logic and helpers
├── types/          # Shared TypeScript types
├── public/         # Static assets
├── proxy.ts        # Next.js proxy (formerly middleware)
└── ...
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Emilhubb/SecScan.git

# 2. Go into the project folder
cd SecScan

# 3. Install dependencies
npm install
```

### Run locally

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Other scripts

```bash
npm run build   # Create a production build
npm run start   # Start the production server
npm run lint    # Run ESLint
```

## Roadmap

<!-- Edit this list to match your real plans, or delete the section -->

- [ ] More checks (for example, additional cross-origin headers)
- [ ] Compare two scans of the same domain
- [ ] Shareable report links

## Author

- Portfolio: [emilkazimovdev.vercel.app](https://emilkazimovdev.vercel.app)
- LinkedIn: [emil-kazimov](https://www.linkedin.com/in/emil-kazimov-b3b50926a/)
- GitHub: [@Emilhubb](https://github.com/Emilhubb)
