# mlds-pilot

Pilot web application for the Movement Language Discovery System (MLDS). Demonstrates a community-governed video annotation pipeline: upload → auto-tag → human review → approved annotation.

This is a proof-of-concept for the governance architecture, not the production system. See [Architectural Decisions](#architectural-decisions) for deliberate trade-offs.

Live: [mlds-pilot.vercel.app](https://mlds-pilot.vercel.app)

---

## Prerequisites

**Accounts required:**
- Google Cloud account with billing enabled
- Firebase project (Blaze plan)
- Vercel account

**Software:**
- Node.js 18+
- npm 9+
- Git

**Hardware:**
- Any device with a camera and a modern browser

---

## Setup
```bash
# Clone the repository
git clone https://github.com/anothertee/mlds-pilot.git
cd mlds-pilot

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env.local
```

Fill in all values in `.env.local`. See [Environment Variables](#environment-variables) for details.
```bash
# Run development server
npm run dev
```

Open `http://localhost:3000`.

---

## Environment Variables
```bash
# Firebase (public — client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# reCAPTCHA v3 (public — client-side)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=

# App Check debug token (local development only — never set in production)
NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN=

# Google Cloud service account (private — server-side only)
GOOGLE_APPLICATION_CREDENTIALS_BASE64=

# Access control
FACILITATOR_PASSWORD=
REVIEWER_PASSWORD=

# Base URL (local development only)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

`GOOGLE_APPLICATION_CREDENTIALS_BASE64` is the service account JSON file encoded as base64:
```bash
base64 -i path/to/service-account.json
```

---

## Project Structure
```
mlds-pilot/
├── src/
│   ├── app/
│   │   ├── page.js                      # Welcome page (public)
│   │   ├── upload/
│   │   │   └── page.js                  # Upload interface (facilitator password required)
│   │   ├── review/
│   │   │   └── page.js                  # Reviewer dashboard (reviewer password required)
│   │   ├── submission/
│   │   │   └── [id]/
│   │   │       └── page.js              # Submission detail page (public)
│   │   └── api/
│   │       ├── upload/route.js          # GCS upload + Firestore document creation
│   │       ├── analyze/route.js         # Starts Video Intelligence job
│   │       ├── analyze/status/route.js  # Polls operation, writes auto-tags to Firestore
│   │       ├── review/route.js          # Approve / restrict / reject + human tags
│   │       ├── submissions/route.js     # Fetches submissions by status
│   │       ├── download/route.js        # Generates signed GCS URL
│   │       └── facilitator-auth/route.js # Validates facilitator password
│   ├── components/
│   │   ├── UploadForm.js                # Upload and recording UI
│   │   ├── VideoRecorder.js             # Webcam capture via MediaRecorder API
│   │   ├── TagDisplay.js                # Machine tags vs community tags comparison
│   │   ├── ReviewQueue.js               # Submission cards with annotation input
│   │   ├── InfoOverlay.js               # Full-screen project information panel
│   │   ├── ReviewerLink.js              # Fixed reviewer access button
│   │   └── QRCode.js                    # QR code for submission URL
│   └── lib/
│       ├── firebase.js                  # Firebase client initialisation with App Check
│       ├── firebaseAdmin.js             # Firebase Admin SDK for server-side Firestore
│       ├── uploadVideo.js               # Legacy — superseded by /api/upload
│       └── logger.js                    # Structured console logger (suppressed in production)
├── .env.example                         # Environment variable template
├── .env.local                           # Local values (gitignored)
├── .gitignore
└── README.md
```
---

## How It Works
```
Visitor arrives at mlds-pilot.vercel.app
→ Welcome page explains the project
→ Facilitator enters password to unlock /upload
→ Visitor uploads a video file or records via webcam
Upload pipeline (server-side)
→ Video sent to Next.js API route
→ Uploaded to Google Cloud Storage
→ Firestore document created: { status: "submitted" }
→ Google Video Intelligence analyses the video (async)
→ Labels written to Firestore: { status: "auto_tagged", autoTags: [...] }
→ Visitor sees submission page with auto-tags and QR code
→ Visitor scans QR code to save submission link to their phone
Reviewer logs in at /review
→ Dashboard shows counts: submitted / pending / approved / restricted / rejected
→ Pending tab shows submissions awaiting review
→ Reviewer reads contributor note and auto-tags
→ Reviewer adds up to 5 cultural annotations (label + meaning)
→ Reviewer decides: Approve / Restrict / Reject
→ Firestore document updated with decision and human tags
On approval
→ Submission page community says column populates
→ Annotation can be exported and ingested into The Repository
```

---

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Welcome page |
| `/upload` | Facilitator password | Video upload and recording interface |
| `/submission/[id]` | Public | Submission detail with tags and QR code |
| `/review` | Reviewer password | Reviewer dashboard |

---

## Roles

| Role | Access |
|------|--------|
| Visitor | Scans QR code to view their submission |
| Facilitator | Unlocks /upload for installation use |
| Reviewer | Full dashboard access, approves and annotates submissions |

---

## Pipeline Stages

| Stage | Status | Notes |
|-------|--------|-------|
| Video upload | complete | Google Cloud Storage, server-side |
| Webcam recording | complete | MediaRecorder API, same upload pipeline |
| Auto-tagging | complete | Google Video Intelligence, async polling |
| Tag display | complete | Machine says vs community says comparison |
| Reviewer dashboard | complete | Summary counts, tabs, read-only history |
| Human tag input | complete | Up to 5 annotations per submission |
| Facilitator auth | complete | sessionStorage, clears on tab close |
| QR code | complete | Encodes submission URL for mobile access |
| Repository integration | pending | Export script in development |

---

## Integration with The Repository

This pilot connects to [The Repository](https://github.com/anothertee/cultural-analysis-engine) — the companion offline RAG system built in the Device Development component of this thesis.

**Data flow:**
mlds-pilot (cloud) → approved annotation → The Repository (local, Raspberry Pi)

**Transfer mechanism by phase:**

| Phase | Method | Rationale |
|-------|--------|-----------|
| Pilot | WiFi sync | Simplest, acceptable for self-recorded footage |
| Design show | USB drive | Pi stays fully offline, transfer is an intentional act |
| Post-graduation | Local network sync | Community deployment, no public internet required |

Approved annotations are formatted as markdown and written to `knowledge_base/movements/`. The existing ingestion pipeline picks them up on the next run. No architectural changes to The Repository are required.

---

## Architectural Decisions

**Google Cloud Storage instead of Firebase Storage**
Firebase Storage URLs use HTTPS which Google Video Intelligence cannot accept as input. Video Intelligence requires `gs://` URIs which are native to Google Cloud Storage. Both services share the same Google Cloud infrastructure — switching removes the Firebase wrapper and enables direct Video Intelligence integration.

**Service account authentication instead of API keys**
Google Video Intelligence requires OAuth 2.0 authentication. API keys are rejected by this API regardless of how they are scoped. The service account credentials are base64-encoded and stored as a server-side environment variable — never exposed to the browser.

**Firebase Admin SDK for server-side Firestore writes**
Next.js API routes run on the server and have no browser session. The Firebase client SDK requires browser-based authentication. The Admin SDK authenticates via the service account directly and bypasses client-side auth requirements.

**Facilitator password with sessionStorage**
The upload interface is gated behind a facilitator password stored in sessionStorage. This persists across page refreshes within the same tab but clears when the tab is closed — appropriate for an installation where a facilitator opens the session at the start and it automatically resets when the browser closes.

**Rule-based matching over ML in The Repository**
The Repository uses rule-based LMA archetype matching, not a trained model. No GPU is available on the target hardware (Raspberry Pi 5). Rules are stored as JSON in SQLite and can be replaced with a trained model post-POC.

**Firebase config intentionally client-side**
Firebase config values use the `NEXT_PUBLIC_` prefix and are visible in the browser. This is Firebase's documented security model — security is enforced at the Firestore rules level, not by obscuring credentials.

**Auto-tags are intentionally decontextualised**
The contrast between machine-generated labels and community annotation is the argument this system is built to make. Labels like `physical exercise` or `standing` for a Caribbean harvest dance are not a failure of the system — they are the demonstration.

---

## Known Limitations

- Video Intelligence returns scene-level labels, not movement-level classification. Short clips return fewer labels. Confidence thresholds are set to 0.3 to surface more results.
- Auto-tagging latency is 15–45 seconds depending on video length and Google Cloud cold start time.
- The facilitator password is a simple shared secret, not per-user authentication. Appropriate for a controlled installation, not for public deployment.
- No automated export pipeline from Firestore to The Repository exists yet. Export is currently manual.

---

## Branch Structure
main      ← production, deploys to mlds-pilot.vercel.app
dev       ← integration branch, deploys to preview URL
feature/* ← individual features, PR into dev then dev into main

---

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js | 15 |
| UI | React + Tailwind CSS | 19 / 4 |
| Hosting | Vercel | — |
| Video storage | Google Cloud Storage | — |
| Database | Firestore (Firebase) | — |
| Auth | Firebase App Check + reCAPTCHA v3 | — |
| Server auth | Firebase Admin SDK | — |
| Auto-tagging | Google Cloud Video Intelligence API | v1 |
| QR code | qrcode.react | — |
| Package manager | npm | 9+ |

---

## SYNTHETIC DEMONSTRATION DATA NOTICE

All video content used during development is self-recorded by the student researcher. No community-owned cultural material has been ingested into this system. Real cultural content requires community partnership, informed consent, and governance agreements that are outside the scope of this pilot phase.

---

## References

- Kukutai, T. & Taylor, J. (Eds.) (2016). *Indigenous Data Sovereignty: Toward an Agenda.* ANU Press.
- Mohamed, S., Png, M.T., & Isaac, W. (2020). Decolonial AI: Decolonial theory as sociotechnical foresight in artificial intelligence. *Philosophy & Technology, 33*, 659–684.
- Christen, K. (2015). Tribal archives, traditional knowledge, and local contexts: Why the model matters. *Journal of Western Archives, 6*(1).
- Lewis, P. et al. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. *NeurIPS.*
- Laban, R. & Lawrence, F.C. (1947). *Effort.* MacDonald & Evans.
- Taylor, D. (2003). *The Archive and the Repertoire: Performing Cultural Memory in the Americas.* Duke University Press.
- Aristidou, A., Shamir, A., & Chrysanthou, Y. (2019). Digital dance ethnography: Organizing large dance collections. *ACM Journal on Computing and Cultural Heritage, 12*(4).