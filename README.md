# Habit Tracker

An Expo SDK 55 habit tracker for daily check-ins, streaks, calendar progress, analytics, and local profile/preferences. The app stores habit data on-device with SQLite and supports iOS, Android, and static web export.

## Requirements

- Node.js 20.19 or newer
- pnpm 11.5.2 through Corepack
- An Expo account for EAS builds

## Local Development

```bash
corepack enable
pnpm install
pnpm start
```

Useful app targets:

```bash
pnpm ios
pnpm android
pnpm web
```

## Production Checks

Run the same checks used by GitHub Actions:

```bash
pnpm check
```

This runs:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm export:web`

## EAS Builds

The repository includes `eas.json` with `development`, `preview`, and `production` profiles.

Before the first cloud build, authenticate and link the Expo project:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
```

Build commands:

```bash
pnpm build:preview
pnpm build:production
pnpm submit:production
```

Store credentials, service account keys, and generated native folders are ignored by git. Keep release secrets in EAS credentials or GitHub secrets, not in the repository.

## GitHub

CI is configured in `.github/workflows/ci.yml` for pushes to `main` and pull requests. Add a remote, push the branch, and verify the workflow passes before creating a release build.
