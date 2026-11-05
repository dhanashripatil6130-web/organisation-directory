# Organisation Directory

Angular 18 app (standalone components, signals, typed reactive forms) for finding, filtering and creating organisations against a mock API.

## Setup
```bash
npm install
```

## Run
```bash
npm start
```
Open http://localhost:4200. Try `/?q=glob&status=suspended`.

## Build
```bash
npm run build
```
Output goes to `dist/organisation-directory`.

## Notes
- The mock API (400–900 ms delay, ~15% list failures, max 25 per request, 5 requests/minute) lives in `src/app/core/services/organisation-api.service.ts`. Search, filtering, sorting and pagination run in that mock server. Because of the rate limit, a 6th request within a minute waits for a free slot.
- Strings are in `src/app/core/i18n/en.json`; design tokens are in `src/styles.scss`.
- See [DECISIONS.md](DECISIONS.md) for decisions, conflict resolutions and assumptions.
