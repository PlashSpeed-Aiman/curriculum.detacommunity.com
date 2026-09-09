# Plan: Web and API foundations (module 01) — lessons 1-3

Status: **draft outline, pre-writing**. No `contentFile` exists yet for any lesson below. Per
`lesson-contribution-guidelines.md` a planned lesson stays unavailable until its Markdown,
metadata, and route are connected — do not create empty `.md` files to make this look complete.
Every spec claim below was verified against the RFC during planning; citations at the end.

## Context

`/curriculum/backend-development/web-foundations` (module `backend-web-foundations`,
`src/data/curriculum.ts:658-664`) currently has `lessons: []` — the page renders nothing. This plan
fills it with three lessons that establish the wire before any framework hides it.

The module's job is narrow on purpose. Module 02 is ASP.NET Core and module 03 is Building REST
APIs, so module 01 must stay **framework-agnostic and stop short of endpoint design**. Its
deliverable is a learner who can read an HTTP exchange with their own eyes and knows what the
response's status line and content type are actually promising. Everything downstream depends on
that literacy, and it's the layer most tutorials skip straight past.

**Scope correction carried over from `backend-rest-lesson-plan.md`:** line 662's summary currently
reads "HTTP, REST, JSON, status codes, and how a request moves." `REST` moves to module 03. New
summary: **"HTTP, JSON, status codes, and how a request moves."**

## Sequence

1 → 2 → 3 is a build: lesson 1 introduces the whole exchange, then 2 and 3 dissect the two halves
of the response that carry meaning (status line, then content type and body).

---

## Lesson 1 — Follow one request: the anatomy of an HTTP exchange

```ts
{
  id: 'backend-web-request-lifecycle',
  slug: 'anatomy-of-an-http-exchange',
  title: 'Follow one request: the anatomy of an HTTP exchange',
  summary: 'Trace a single request from DNS through TCP, TLS, and the request line to a parsed response, reading each layer with curl.',
  contentFile: 'web-foundations-http-exchange.md',
  readTime: '20 min',
  category: 'Backend / web foundations',
}
```

### Premise

One command, unpacked completely. The learner runs `curl -v` once and then spends the lesson
learning to read what it already printed. Nothing is asserted that the terminal doesn't show.

### Structure

`## What you will learn`
- Name the stages a request passes through before any application code runs.
- Read `curl -v` output line by line and say which layer each line belongs to.
- Distinguish the HTTP/1.1 text framing from HTTP/2's binary framing and pseudo-headers.
- Explain what connection reuse changes about the cost of a second request.

**`## One command, eight stages`** — the spine. Run it, print the output, then walk it:

```bash
curl -v --http1.1 https://api.github.com/zen
```

Then a table mapping output prefixes to layers — `*` is curl's own commentary (DNS, TCP, TLS),
`>` is what was sent, `<` is what came back. That three-symbol key is the single most useful thing
in the lesson and most learners have never been told it.

Stages to walk: DNS resolution → TCP connection → TLS handshake (with SNI and ALPN named) →
request line → request headers → blank line → response status line → response headers → body.

**`## The request line is three tokens`** — `GET /zen HTTP/1.1`, then the `Host` header and why
HTTP/1.1 made it mandatory (one IP, many sites). Small point, large payoff: it explains virtual
hosting, SNI, and why `Host` is the one header you cannot omit.

**`## Why the blank line matters`** — headers end at `\r\n\r\n`; everything after is body. This is
the framing rule, and it's why `Content-Length` or chunked encoding exists. Makes the protocol feel
mechanical rather than magical.

**`## The same exchange over HTTP/2`** — the honesty section, and the reason `--http1.1` is in the
command above. Re-run without the flag; ALPN negotiates h2 and the text request line disappears.
Introduce pseudo-headers `:method`, `:path`, `:authority`, `:scheme`, and that header names are
lowercase in HTTP/2. Land the point: **the semantics are identical, the framing is not** — HTTP/2
changed how bytes go on the wire, not what a GET means. That framing pays off in lesson 2, where
semantics are the whole subject.

**`## Practice`**
1. Run the command with and without `--http1.1`; diff the two outputs and label each difference as
   framing or semantics.
2. `curl -v` the same host twice on one command line with two URLs; find the line where curl says it
   reused the connection, and explain what work was skipped.
3. Use `curl --resolve` or `dig` to separate DNS from the request and confirm which stage each
   `*` line reports.
4. Hit a plain-HTTP endpoint and observe which stages vanish.

**`## Check your understanding`** — what do `*`, `>`, `<` mean; why is `Host` mandatory; what ends
the header section; what does ALPN decide and when; does HTTP/2 change what `GET` means.

---

## Lesson 2 — Status codes as a contract

```ts
{
  id: 'backend-web-status-codes',
  slug: 'status-codes-as-a-contract',
  title: 'Status codes as a contract',
  summary: 'Read status classes as promises to the caller, and fix the confusions that break clients: 200 with an error body, 401 vs 403, 400 vs 422, 404 vs 410.',
  contentFile: 'web-foundations-status-codes.md',
  readTime: '18 min',
  category: 'Backend / web foundations',
}
```

### Premise

The highest-leverage lesson in the module — modules 03 and 06 both inherit it. Frame status codes
as a **machine-readable contract with a caller you will never meet**, not as a lookup table. Build
around the confusions people actually ship, not all 60-odd codes.

### Structure

`## What you will learn` — read the five classes as promises; choose correctly between the
commonly-confused pairs; explain safe vs idempotent and why retries depend on it; know why a status
code alone is often not enough.

**`## Five classes, five promises`** — 1xx informational, 2xx it worked, 3xx look elsewhere, 4xx you
made a mistake, 5xx we made a mistake. The 4xx/5xx line is the one that matters: **it assigns
blame, and blame decides whether retrying is sensible.**

**`## The confusions that break clients`** — the core, as a table with verified RFC 9110 semantics:

| Pair | The rule | The tell |
| --- | --- | --- |
| 200 vs real errors | A 200 with `{"error": ...}` breaks every generic client and all caching | If the caller must parse the body to know it failed, the status is wrong |
| 401 vs 403 | 401 = no valid credentials; 403 = understood, refused | A 401 response **MUST** send `WWW-Authenticate` — if you can't name the scheme, you mean 403 |
| 400 vs 422 | 400 = malformed; 422 = well-formed but semantically unprocessable | Did the parser fail, or did the validator? |
| 404 vs 410 | 404 = no current representation (or won't say); 410 = gone, likely permanent | 410 is a promise not to come back |

Note when writing: **422 is defined in RFC 9110 §15.5.21**, no longer WebDAV-only — worth saying
outright, because older tutorials still call it non-standard.

**`## Safe, idempotent, and why retries depend on it`** — verified against RFC 9110: GET, HEAD,
OPTIONS, TRACE are *safe*; PUT and DELETE plus all the safe methods are *idempotent*; POST is
neither. The practical consequence: a proxy, a browser, or a mobile client on a flaky network will
retry an idempotent request on its own. Ship a non-idempotent PUT and something else's retry logic
will duplicate the effect. This is where the abstract vocabulary becomes an outage.

**`## Redirects change more than the URL`** — 301/302 permit a client to rewrite the method (POST
becomes GET, historically); **307/308 require the method and content to be preserved**. Choosing
302 for a redirected POST silently drops the body.

**`## When the code is not enough`** — RFC 9457 Problem Details, `application/problem+json`, with
its five members (`type`, `title`, `status`, `detail`, `instance`). The RFC's own argument is the
one to quote: a bare 403 can't say whether the cause was insufficient credit or bad permissions,
and non-human consumers can't read an HTML error page. Note it obsoletes RFC 7807, since most
existing write-ups cite the old number. Sets up module 06's error handling.

**`## Practice`**
1. Find a public API that returns 200 with an error body; show the response and name what breaks.
2. `curl -i` an endpoint needing auth with no credentials; confirm 401 and read `WWW-Authenticate`.
   Then with valid-but-insufficient credentials; confirm 403.
3. `curl -iL` a URL that 301s from a POST; observe the method curl uses on the second request.
4. Write a `problem+json` body for a validation failure — correct status, all five members.
5. Take an endpoint you've built and classify each method safe / idempotent / neither; flag any
   that would misbehave if a proxy retried it.

**`## Check your understanding`** — which header MUST accompany 401; parser or validator for
400 vs 422; what does 410 promise that 404 doesn't; which redirects preserve the method; why is
POST-that-isn't-idempotent dangerous on a mobile network; what does problem+json add to a status.

---

## Lesson 3 — JSON on the wire: content types and serialization

```ts
{
  id: 'backend-web-json-on-the-wire',
  slug: 'json-on-the-wire',
  title: 'JSON on the wire: content types and serialization',
  summary: 'Separate the bytes from the object: Content-Type, Accept, encoding, and the serialization gaps that turn a valid response into a client bug.',
  contentFile: 'web-foundations-json-on-the-wire.md',
  readTime: '18 min',
  category: 'Backend / web foundations',
}
```

### Premise

The gap between "my server returned an object" and "the client received bytes it could reconstruct
that object from." Every failure in this lesson is one where the server is *technically correct* and
the client is *still broken* — which is why they survive code review and surface in production.

### Structure

`## What you will learn` — explain what `Content-Type` obligates; distinguish `Content-Type` from
`Accept`; name JSON's four missing types and the standard workarounds; predict which values lose
fidelity crossing the wire.

**`## The bytes are not the object`** — opening frame. JSON is a text interchange format; the
server serializes, the client parses, and everything the client knows about how to parse comes from
headers. Nothing else is in-band.

**`## Content-Type is a promise; Accept is a request`** — the pair most learners conflate.
`Content-Type` describes the body being sent (either direction); `Accept` states what the sender
will take back. Show a request carrying both and label them.

**`## The charset trap`** — verified against RFC 8259: JSON text exchanged between systems that
aren't a closed ecosystem **MUST** be UTF-8, and the `application/json` registration defines **no**
`charset` parameter — "Adding one really has no effect on compliant recipients." So
`application/json; charset=utf-8` is redundant rather than wrong, and a `charset` claiming anything
else is a bug the recipient may ignore. Worth stating plainly, because half the frameworks in the
world emit that parameter and learners assume it's load-bearing.

**`## Four things JSON cannot represent`** — the concrete failure catalogue, each with the
workaround:

| Missing | What breaks | The convention |
| --- | --- | --- |
| Integers beyond 2^53-1 | Verified: RFC 8259 notes exact agreement only within `[-(2^53)+1, (2^53)-1]`; a JS client silently rounds a 64-bit ID | Serialize large IDs as strings — the reason APIs ship `id_str`-style fields |
| Dates | No date type; every language guesses differently | RFC 3339 / ISO 8601 UTC strings, always with an offset |
| Decimals for money | Binary floats can't hold `0.1` exactly | Integer minor units, or a string |
| Absent vs null | `{"nickname": null}` and `{}` mean different things to PATCH | Decide and document; matters again in module 06 |

The 2^53 one deserves the most space — it's the canonical example of a server that is completely
correct and a client that is completely broken, and the fix lives in the serialization layer.

**`## When the header lies`** — a body that is JSON served as `text/html`, or a JSON error page
served as HTML by a proxy in front of the app. Show what a client does with each. Connects back to
lesson 2: an HTML 500 from a gateway is a real thing an API client must survive.

**`## Practice`**
1. `curl -i` a JSON API; read `Content-Type` exactly; note whether it sends a `charset` parameter
   and say whether that parameter has any effect.
2. Send `Accept: application/xml` to a JSON-only API; record what comes back (200 JSON anyway? 406?)
   and judge it against lesson 2.
3. In a browser console, evaluate `9007199254740993` and explain the result; then find an API that
   returns IDs as strings and explain the choice.
4. Serialize the same timestamp in two languages and compare; make both RFC 3339 in UTC.
5. Serve a JSON body with a deliberately wrong `Content-Type` from a scratch server and observe a
   real client's behavior.

**`## Check your understanding`** — difference between `Content-Type` and `Accept`; is
`charset=utf-8` on `application/json` meaningful; why do large IDs arrive as strings; what does an
omitted field mean versus null; what should a client do when the header and body disagree.

---

## Files to touch

| File | Change |
| --- | --- |
| `src/content/web-foundations-http-exchange.md` | New |
| `src/content/web-foundations-status-codes.md` | New |
| `src/content/web-foundations-json-on-the-wire.md` | New |
| `src/data/curriculum.ts` | Populate `backend-web-foundations.lessons` with the three records; fix line ~662 summary (drop `REST`) |
| `src/views/LessonView.vue` | Three `?raw` imports + three `markdownByFile` entries (manual step) |

## Writing constraints

- **No frontmatter, no `#` h1.** Body opens at `##`, per `lesson-contribution-guidelines.md`.
- Framework-agnostic throughout. `curl` and a browser console are the only tools. No C#, no
  ASP.NET — module 02 owns that, and using it here would date the lesson to one stack.
- Every claim demonstrable in the learner's terminal. Where a claim is spec-derived, cite the RFC
  section rather than asserting it.
- One primary outcome per lesson; resist letting lesson 2 drift into REST design (module 03) or
  auth schemes (module 06).
- Tables for the confusion pairs and the serialization catalogue — matches the treatment already
  used in `docker-compose-log-rotation-war-story.md`.

## Verification

1. `npm run dev`; open all three routes under `/curriculum/backend-development/web-foundations/`;
   confirm each renders from `##` with intact tables and code fences.
2. Confirm the module index lists three lessons and its summary no longer advertises REST.
3. Re-run every `curl` command in the Practice sections before publishing — output shapes drift,
   and a stale terminal transcript is the most likely thing to rot in these lessons.
4. Check each RFC quotation against the sources below.

## Sources verified during planning

- **RFC 9110 (HTTP Semantics)** — safe methods (GET, HEAD, OPTIONS, TRACE); idempotent (PUT, DELETE
  plus the safe methods); 401 "MUST send at least one WWW-Authenticate header field"; 403; 404
  "did not find a current representation… or is not willing to disclose"; 410 "likely to be
  permanent"; **422 Unprocessable Content is defined here, §15.5.21**; 307/308 preserve method and
  content where 301/302 historically did not: https://www.rfc-editor.org/rfc/rfc9110.html
- **RFC 8259 (JSON)** — §8.1 UTF-8 MUST for non-closed ecosystems; §11 "No 'charset' parameter is
  defined for this registration"; §6 exact-agreement range `[-(2^53)+1, (2^53)-1]`:
  https://www.rfc-editor.org/rfc/rfc8259
- **RFC 9457 (Problem Details)** — `application/problem+json`; members `type`, `title`, `status`,
  `detail`, `instance`; obsoletes RFC 7807; rationale that a bare 403 can't distinguish
  insufficient credit from bad permissions: https://www.rfc-editor.org/rfc/rfc9457.html
- **RFC 3339** — date/time on the wire: https://www.rfc-editor.org/rfc/rfc3339
- HTTP/2 pseudo-headers (`:method`, `:path`, `:authority`, `:scheme`) and lowercase field names —
  verify against RFC 9113 §8.3.1 before writing lesson 1's HTTP/2 section.
