# NeuroPath

NeuroPath is a digital career counseling (Bimbingan Konseling / BK) platform for Indonesian high-school students and school counselors. It replaces the traditional multiple-choice career test with a real-time AI voice interview that profiles cognitive dimensions, then turns the result into a personalized, actionable action plan instead of an abstract recommendation.

## Introduction

Students finishing high school are expected to choose a career path with almost no guidance. Standard career tests rely on rigid questionnaires and deliver generic results. NeuroPath conducts a natural conversation with the student, analyzes their interests, aptitude, and communication patterns across six cognitive dimensions, identifies their dominant archetype, and generates:

- a personalized career roadmap with granular, trackable milestones;
- an AI live feed with ongoing analysis of their trajectory;
- targeted outputs such as portfolio, cover letters, and learning resources;
- an on-chain completion certificate (ERC-721) that can be verified publicly.

The platform is bilingual (Indonesian and English) and ships with both light and dark themes.

## Features

- **AI Career Interview** — voice/text session with speech synthesis and hands-free speech recognition; profiles 6 cognitive dimensions and an archetype.
- **Personalized Roadmap** — expandable action plan with granular milestones and learning resources.
- **Live AI Agent** — dashboard feed with tailored analysis of the user's progress.
- **Counseling Journal** — notes tracking for counselors (guru BK) supporting each student.
- **Unified Search** — a single query across journals, roadmap milestones, and live job listings.
- **On-Demand Generation** — resume/portfolio, cover letters, and learning-material generation.
- **Blockchain Credential** — completion certificate minted as an ERC-721 token, verifiable at `/verify`.
- **Bilingual UI** — full Indonesian and English support with a language toggle.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Backend**: Next.js API routes, Firebase (Auth + Firestore)
- **AI**: Google Generative AI and Groq via a router, streaming responses
- **Blockchain**: Hardhat, OpenZeppelin, ERC-721, Sepolia testnet
- **3D / Animation**: Three.js, react-three-fiber, framer-motion

## Installation

Prerequisites: Node.js 20 or later, npm, and a Firebase project.

```bash
# 1. Clone the repository
git clone https://github.com/GlorysID/NeuroPath.git
cd NeuroPath

# 2. Install dependencies
npm install

# 3. Create the environment file and fill in your credentials
cp .env.local.example .env.local
```

Required environment variables:

| Variable          | Description                                        |
| ----------------- | -------------------------------------------------- |
| `GROQ_API_KEY`    | Groq API key for the AI agent routes               |
| `AI_ROUTER_URL`   | AI router base URL                                 |
| `AI_ROUTER_KEY`   | AI router authentication key                       |
| `AI_ROUTER_MODEL` | Model name used by the router                      |
| `JSEARCH_API_KEY` | JSearch API key for live job listings              |
| `SEPOLIA_RPC_URL` | Sepolia RPC endpoint for contract interactions     |
| `PRIVATE_KEY`     | Wallet private key for the credential minter       |

Firebase web configuration lives in `src/lib/firebase.js`; create a web app in your Firebase console and paste the credentials there.

## Usage

```bash
npm run dev
```

Open http://localhost:3000.

The core flow:

1. **Register / Login** — create an account with email and password.
2. **Neural Mapping Interview** (`/interview`) — complete the AI interview in voice or text mode. The AI profiles your six cognitive dimensions and assigns an archetype.
3. **Dashboard** (`/dashboard`) — review the cognitive map (radar chart), the live AI agent feed, and the recommended quick actions.
4. **Career Roadmap** (`/dashboard/roadmap`) — explore milestones generated for your archetype; expand a milestone to load learning resources.
5. **Credential** — on completing the roadmap, mint your NeuroPath certificate as an NFT and share the verification link (`/verify`) with anyone.

Other actions available from the dashboard: generate a portfolio, find AI-matched jobs with cover letters, and use the unified search across journals and listings.

## Scripts

| Script                                    | Purpose                                     |
| ----------------------------------------- | ------------------------------------------- |
| `npm run dev`                             | Start the development server                |
| `npm run build`                           | Production build (do not run while the dev server is up) |
| `npm run lint`                            | Run ESLint                                  |
| `npx hardhat test`                        | Run the credential contract tests           |
| `npx hardhat run scripts/deploy.js`       | Deploy the credential contract              |
| `node scripts/upgrade_db.js`              | One-off Firestore migration helper          |

## Project Structure

```
contracts/          Solidity credential contract (ERC-721)
scripts/            Hardhat deploy + migration scripts
src/app/            Next.js app router (pages, layouts)
src/app/api/        Server routes: agent, interview, search, portfolio, mint, verify, ...
src/app/components/ UI components (toggles, charts, widgets, 3D)
src/app/context/    Language and theme providers
src/lib/            AI, Firebase, and job-service bindings
public/             Static assets (images, 3D models)
```

## Credits

- Maintained by [GlorysID](https://github.com/GlorysID).
- Built on Next.js, Firebase, Groq, Google Generative AI, Hardhat, and Three.js.

## Documentation

- `PRODUCT.md` — product spec, target users, and design principles.

## Deploy on Vercel

Push the repository to GitHub and import it in the Vercel dashboard, or use the CLI from the project root:

```bash
npx vercel --prod
```

Add the environment variables listed in the Installation section to the Vercel project settings before deploying. The project includes `vercel.json` with the required build settings.
