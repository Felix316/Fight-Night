# Fight Night

A web app for keeping your UFC 6 rivalry on the record. Two players can create profiles, invite one another to a fight night, record each match, and compare their results over time.

[Open the app](https://octagon-fight-night.sunset-bream-1225.chatgpt.site)

## Features

- **Player accounts:** display name, unique case-insensitive username, linked email, and a permanent user ID.
- **Fight-night invitations:** invite a registered player by username or user ID; the other player accepts or declines inside the app.
- **Fighter selection:** each player enters their fighter and weight class. Both players must choose the same weight class before the fight starts.
- **Match recording:** select the winner, TKO / Submission / Decision, winning round, and elapsed round time.
- **Rematches:** save a result, then start another fight or end the night.
- **Post-night summary:** head-to-head score, finish breakdown, and congratulations for the winner. Tied nights receive a tie message.
- **Lifetime statistics:** fights, wins, losses, win rate, finish rate, completed nights, and wins by method.
- **Shared records:** data persists in a server-side database; the interface refreshes every five seconds.

## How to use it

1. Choose **Create account** on the homepage.
2. Enter your display name, email, and username on the registration page.
3. Complete ChatGPT sign-in, then finish creating your profile. The email entered must match the signed-in account.
4. Once both players have profiles and access to the Site, create a fight night using the other player's username or ID.
5. The invited player accepts, and both players lock in their fighters.
6. After playing the match in UFC 6, record its result.
7. Choose **Next fight** or **End fight night** to see the night's summary.

For decisions, record the final scheduled round at **5:00**. Matches can be configured as three or five rounds. This app tracks manually entered outcomes; it does not connect to the game itself.

## Technology

- React 19 and TypeScript
- Vinext with Next.js App Router conventions
- Vite
- Cloudflare Workers for server execution
- Cloudflare D1 (SQLite) for durable records
- Drizzle ORM schema and SQL migrations
- Lucide icons and responsive CSS
- OpenAI Sites hosting and dispatch-owned ChatGPT authentication

## Local development

Use Node.js **22.13 or newer** and npm.

```sh
npm run install:ci
npm run build
```

The build creates `dist/server/wrangler.json`, used by the local database and Worker preview. Before starting the app, apply the migrations in order to a new local database:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_condemned_madame_hydra.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_gigantic_pet_avengers.sql
npm run dev -- --host 127.0.0.1
```

Open the URL printed by the development server, normally `http://127.0.0.1:5173`. Do not replay migrations already applied to an existing local database.

The portable development setup provides a **local-only mock sign-in** through `/signin-with-chatgpt?return_to=/`. Its test identity is `local_seedy`, with email `seedy@sites.test`. Use that email when testing registration. Mock authentication is excluded from production; hosted authentication is supplied by Sites.

To preview the built Worker locally, use `npm start`. This preview shares the local database but does not simulate sign-in.

## Project structure

```text
app/
  page.tsx                 Dashboard, invitations, fight flow, and stats
  create-account/page.tsx  Registration page
  api/game/route.ts        Authorized reads and game actions
  chatgpt-auth.ts          Sites authentication helpers
  globals.css              Responsive arena-themed interface
  layout.tsx               App layout and metadata
db/
  schema.ts                Players and fight-night schema
  index.ts                 D1 / Drizzle database helper
drizzle/                   Versioned SQL migrations
build/                     Sites build integration
scripts/                   Development and build helpers
.openai/hosting.json        Site identity and D1 binding declaration
```

## Data and validation

The `players` table stores identity, username, display name, and linked email. The `nights` table stores the participants, lifecycle status, creation time, and fight data.

Server-side checks authorize every write, enforce unique usernames, require matching weight classes, validate rounds and time, and reject stale updates. Each update compares the previously read night state to prevent simultaneous players from overwriting one another or recording the same result twice. Player lookup responses omit email addresses.

## Checks and schema changes

```sh
npx tsc --noEmit
npm run build
```

After changing `db/schema.ts`, generate an additional migration:

```sh
npm run db:generate
```

Inspect and commit the new SQL and metadata. Apply only pending migrations to the local preview. Hosted migrations are applied by the Sites deployment workflow. Do not modify previously applied migrations.

## Deployment and access

The existing Site is private. Deployments preserve its audience; in-app invitations do not grant hosting access. Both players need access to the Site before registering or using invitations.

`.openai/hosting.json` declares the Site project and the `DB` D1 binding. Publish through the Sites source/build/deployment workflow; `npm run build` alone does not deploy. A separate deployment needs its own Site identity and provisioned database. Standalone hosting must supply trusted authentication rather than accepting identity headers directly from visitors.

Do not commit repository credentials, runtime secrets, `.env` files, database state, or build outputs. These are excluded by `.gitignore`. Account creation and invitations do not send email.

## Status

The app has passed TypeScript and production build checks. The homepage and registration routes were checked in local preview. A complete two-account gameplay session has not yet been verified end to end.

This is an unofficial UFC 6 companion project and is not affiliated with UFC or EA Sports.
