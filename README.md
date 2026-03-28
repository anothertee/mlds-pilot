# mlds-pilot

Pilot phase web application for the Movement Language Discovery System. Demonstrates a community-governed video annotation pipeline: upload → auto-tag → human review → approved annotation.

This is a proof-of-concept for the governance architecture. It is not the production system. See [Architectural Decisions](#architectural-decisions) for details on deliberate trade-offs.

---

## Prerequisites

**Accounts required:**
- Google Cloud account with billing enabled
- Firebase project (Blaze plan)
- Vercel account
- Hugging Face account (optional — Google Video Intelligence API used by default)

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

# Create local environment file
touch .env.local
```

Add the following to `.env.local`:
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

# App Check debug token (local development only)
NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN=

# Google Cloud (private — server-side only)
GOOGLE_CLOUD_API_KEY=
```
```bash
# Run development server
npm run dev
```

Open `http://localhost:3000`.

---

## Project Structure
```
mlds-pilot/
├── src/
│   ├── app/
│   │   ├── page.js              # Public upload interface
│   │   ├── review/
│   │   │   └── page.js          # Reviewer interface (auth required)
│   │   └── api/
│   │       └── analyze/
│   │           └── route.js     # Server-side Video Intelligence API call
│   ├── components/
│   │   ├── UploadForm.js        # Video upload UI and logic
│   │   ├── TagDisplay.js        # Auto-tag and human tag comparison view
│   │   └── ReviewQueue.js       # Pending submissions list for reviewers
│   └── lib/
│       ├── firebase.js          # Firebase initialisation with App Check
│       └── uploadVideo.js       # Storage upload and Firestore write
├── .env.local                   # Local environment variables (gitignored)
├── .gitignore
└── README.md
```

---

## How It Works
```
User uploads video
→ Firebase Storage receives file
→ Firestore document created: { status: "submitted", autoTags: [], humanTags: [] }
→ Next.js API route calls Google Cloud Video Intelligence API (server-side)
→ Auto-tags written to Firestore document
→ User sees auto-tags + adds optional context
→ User consents and submits
→ status: "submitted" → visible in reviewer queue

Reviewer logs in at /review
→ Firebase Auth confirms reviewer role
→ Pending submissions displayed
→ Reviewer sees: video, auto-tags, contributor context
→ Reviewer decides: APPROVE / RESTRICT / REJECT
→ Firestore document status updated

On approval:
→ Annotation formatted as markdown
→ Written to The Repository knowledge base (via USB transfer or WiFi sync)
→ Re-ingestion triggered
→ ChromaDB indexes new document
→ RAG system can query approved annotation
```

---

## Pipeline Stages

| Stage | Status | Notes |
|-------|--------|-------|
| Video upload | complete | Firebase Storage, 100MB cap, video types only |
| Auto-tagging | in progress | Google Cloud Video Intelligence API |
| Tag display | in progress | Before/after comparison view |
| Reviewer interface | to build | Auth-gated, /review route |
| Status pipeline | to build | submitted → approved / restricted / rejected |
| Repository integration | to build | USB transfer for design show, WiFi sync for pilot |

---

## Roles

| Role | Access | Route |
|------|--------|-------|
| Anonymous visitor | Upload only | / |
| Contributor | Upload + view own submissions | / |
| Reviewer | Full queue access, approve/restrict/reject | /review |

---

## Integration with The Repository

This pilot connects to [The Repository](https://github.com/anothertee/cultural-analysis-engine) — the companion offline RAG system built in the Device Development component of this thesis.

**Data flow:**
```
mlds-pilot (cloud) → approved annotation → The Repository (local, Raspberry Pi)
```

**Transfer mechanism by phase:**

| Phase | Transfer method | Rationale |
|-------|----------------|-----------|
| Pilot | WiFi sync | Simplest, acceptable for self-recorded footage |
| Design show | USB drive (physical) | Pi stays fully offline, transfer is intentional act |
| Post-graduation | Local network sync | Community deployment, no public internet required |

The Repository does not require architectural changes to receive pilot data. Approved annotations are formatted as markdown documents and dropped into `knowledge_base/movements/`. The existing ingestion pipeline picks them up on next run.

---

## Architectural Decisions

**Firebase over local storage**
Local video storage is not feasible on edge hardware at pilot scale. Firebase Storage is used for the pilot with the explicit understanding that production deployment moves video processing on-device. Self-recorded footage only at this stage — no community-owned cultural material is processed through cloud services.

**Google Cloud Video Intelligence over MediaPipe**
Video Intelligence is used for the pilot to demonstrate the auto-tagging pipeline without requiring local ML infrastructure. MediaPipe replaces it in the production installation, running on-device with no data leaving the hardware.

**HTTP not HTTPS on The Repository**
The Repository (companion project) runs HTTP intentionally — it is never exposed to the public internet. This pilot uses HTTPS via Vercel.

**Rule-based matching over ML**
The Repository uses rule-based LMA archetype matching, not a trained model. No GPU available on development hardware. Rules are stored as JSON in SQLite and are replaceable with a trained model post-POC.

**Firebase Security Rules as the primary access control**
Firebase config values are intentionally client-side (NEXT_PUBLIC_ prefix). Security is enforced at the database rule level, not by obscuring credentials. This is Firebase's documented security model.

---

## Known Limitations

- Google Video Intelligence returns scene-level labels, not movement-level classification. Labels like `performing arts` or `dance` are expected. This is a documented feature of the pilot, not a gap — the contrast between these labels and community annotation is the demonstration.
- Auto-tagging latency depends on video length and Google Cloud cold start time. Expect 10–30 seconds for a 30-second clip.
- Firebase free tier limits apply to Storage egress. At pilot scale (single user, short clips) no charges are expected.
- App Check debug token must be registered in Firebase console for local development. See setup instructions above.

---

## Branch Structure
```
main      ← stable, production deploys from here
dev       ← integration branch
feature/* ← individual features, PR into dev
```

---

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js | 15 |
| UI | React + Tailwind CSS | 19 / 3 |
| Hosting | Vercel | — |
| Video storage | Firebase Storage | — |
| Database | Firestore | — |
| Auth | Firebase Authentication | — |
| App security | Firebase App Check + reCAPTCHA v3 | — |
| Auto-tagging | Google Cloud Video Intelligence API | v1 |
| Package manager | npm | 9+ |

---

## SYNTHETIC DEMONSTRATION DATA NOTICE

All video content used during development is self-recorded by the student researcher. No community-owned cultural material has been ingested into this system. Real cultural content requires community partnership, informed consent, and governance agreements that are outside the scope of this pilot phase.

The auto-tags produced by Google Video Intelligence are intentionally decontextualised. This is not a limitation to be corrected — it is the demonstration. The contrast between machine-generated labels and community annotation is the argument this system is built to make.

---

## References

- Kukutai, T. & Taylor, J. (Eds.) (2016). *Indigenous Data Sovereignty: Toward an Agenda.* ANU Press.
- Mohamed, S., Png, M.T., & Isaac, W. (2020). Decolonial AI: Decolonial theory as sociotechnical foresight in artificial intelligence. *Philosophy & Technology, 33*, 659–684.
- Christen, K. (2015). Tribal archives, traditional knowledge, and local contexts: Why the model matters. *Journal of Western Archives, 6*(1).
- Lewis, P. et al. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. *NeurIPS.*
- Laban, R. & Lawrence, F.C. (1947). *Effort.* MacDonald & Evans.
- Taylor, D. (2003). *The Archive and the Repertoire: Performing Cultural Memory in the Americas.* Duke University Press.
- Aristidou, A., Shamir, A., & Chrysanthou, Y. (2019). Digital dance ethnography: Organizing large dance collections. *ACM Journal on Computing and Cultural Heritage, 12*(4).