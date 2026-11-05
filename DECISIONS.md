# Decisions

## Conflict 1: "show everything on one page" vs API limits (25 records/request, 5 requests/minute)
- **Chose:** server-side search, filter, sort and pagination. The list call takes the whole query (all-column search, per-column filters, sort, page, page size) and returns one page, the filtered total and per-status counts. The browser never needs all 137 records, so the 25-per-request cap is respected by design. Page size is 10 by default, 25 at most.
- **Rate limit:** a client-side sliding window never sends a 6th request inside 60 s and shows "Waiting for a free slot…". Retries (max 3) and failed requests count against the budget. Results are cached per query, and a newer query drops an older one that is still queued.
- **Rejected:**
  - Loading all 137 records in the background and paging in the browser: works, but filter/sort would be client-side.
  - Page size 50: exceeds the API cap.
  - A request per keystroke: inputs are debounced (300 ms) and the rate limit would block it anyway.
- **Gave up:** ops' "no pagination" wish. Every new search/filter/sort/page is a request, so heavy filtering hits the 5/minute wait (one constant, `RATE_LIMIT`, controls it).

## Conflict 2: "coloured dot only" vs "never colour alone"
- **Chose:** a tinted pill with the coloured dot **and** a text label (Active / Inactive / Suspended / Unknown). The dot is `aria-hidden`; the text carries the meaning.
- **Rejected:** dot with tooltip or `aria-label` only (colour-blind and touch users still get nothing visible); text only (drops the designer's visual cue for no reason).
- **Gave up:** a slightly wider status column.

## Data normalization
- Raw records stay as they are in the fixture. `normalizeOrganisation()` is the single place that interprets them. No record is dropped.
- Duplicate id 42: row key is `id:server-position`, so it is unique and stable.
- Empty/null name: shown as "Unnamed organisation". `ACTIVE`/`Active`: trimmed and lower-cased.
- `actve` and `null` status: shown as "Unknown". I did **not** fuzzy-match `actve` to `active`, because guessing would silently misreport data.
- Member count `"12"` becomes 12; `-1`, `null` or non-integers become missing ("—").
- Missing owner shows "—"; an invalid email is shown as typed with an "(invalid email)" marker.
- Numeric timestamps and ISO strings both become epoch ms; `"not a date"` becomes missing and sorts last.
- Very long names wrap inside a capped column; Arabic/emoji names use `<bdi>`.
- The 137-record dataset is the 8 fixture rows cloned with varied ids, names, counts and dates, keeping the quirks (about every 17th record reuses the previous id).
- Rows with data problems list them under "Needs attention" in the details popup, and editing flags the fields.

## Architecture
- **Chose:** standalone components, signals, `inject()`, `@if/@for/@switch`, typed non-nullable reactive forms, strict TypeScript. All components are `OnPush`.
- **Two services:** `OrganisationApiService` is the mock server (delay 400–900 ms, ~15% list failures, page cap, rate limit, query execution). `OrganisationService` holds view state in signals, plus cache, retry and pacing.
- **URL is the source of truth** for search, column filters and page (`?q &name &status &owner &min &created &page`). Text inputs are debounced. Sort and page size are not in the URL.
- **One native `<dialog>`** for view, edit and create (`create | view | edit` state signal). It gives focus trapping, Esc and a backdrop for free.
- **Strings** are in one `en.json` read through a `t` pipe. **Colours and spacing** are CSS custom properties in `styles.scss`.
- **Responsive:** two SCSS breakpoint variables (custom properties cannot be used in media queries). Below 60rem the table becomes stacked cards.
- **Rejected:** NgRx (overkill), `BehaviorSubject` for view state (forbidden), a UI/modal library (not needed).

## Assumptions
- `unknown` status is display/filter only and cannot be chosen when creating.
- Name uniqueness is case-insensitive on the trimmed name, checked by the server (async validator on blur, and again on save). An edit ignores the record's own name.
- Rate limit and random failures apply to list requests only.
- Data lives in memory in the mock server, so changes disappear on a full page reload.
- Dates are shown in UTC so the day does not depend on the viewer's timezone.

## Limitations
- No back-off between retries; only the rate limiter paces them.
- A newly created organisation may be on another page or hidden by a filter, and the form does not say so.
- Load errors are generic; the error code is not shown.

## Verification
- Done: production `ng build` passes. I also drove the app in headless Chrome and checked the list, server-side sort/filter/search, paging, the rate-limit wait, view/edit/create popups, the duplicate-name check, and layouts at 390, 820 and 1440 px (no console errors, no horizontal overflow). Those scripts are not in the repo.
- Not done: automated tests in the repo, real-device or other-browser testing, screen-reader testing, and manual checks of URL restore on refresh and the retry button after a failed load.

## AI-tool declaration
- Claude Code (Claude Sonnet 5.5) wrote the application code, the structure of this document and the README from the assessment brief, and ran the build and browser checks described above.
- [Fill in before submitting: what you reviewed, changed or wrote yourself, and that you can explain every part.]
