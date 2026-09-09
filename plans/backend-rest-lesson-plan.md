# Plan: the REST lesson (what REST actually is, and why almost nothing is)

Status: **draft outline, pre-writing**. No `contentFile` exists yet. Per
`lesson-contribution-guidelines.md` this lesson stays unavailable until its Markdown, metadata, and
route are connected. All external claims below were verified against primary sources during
planning; citations are in "Sources verified" at the end.

## Context

While planning content for `/curriculum/backend-development/web-foundations` (module
`backend-web-foundations`, currently `lessons: []`), a scope question surfaced: where does REST
belong, and how do we teach it without repeating the industry's standard error?

The standard error is teaching "REST = HTTP verbs on nouns + JSON + status codes." That is not
REST. It is what Fielding calls RPC over HTTP, and it is what essentially every API a learner will
ever build or consume actually is. A curriculum that quietly repeats the error produces developers
who use the word confidently and wrongly for their whole career. The corrective framing — most APIs
are *RESTful-ish*, true REST requires hypermedia, and that is a defensible engineering trade-off
rather than a failure — is the reason this lesson earns its place.

## Placement decision: module 03, not module 01

**Recommendation: this is the opening lesson of `backend-rest-apis` (module 03), not a
web-foundations lesson.**

Reasoning:

- Module 01 (`backend-web-foundations`) should stay at the wire level: HTTP mechanics, status
  codes, JSON serialization. REST is an *architectural style layered on* those mechanics — you
  cannot meaningfully critique it before the learner can read a request/response exchange.
- Module 03 is literally titled "Building REST APIs" with summary "Design routes, handle requests,
  validate input, and return useful responses." A lesson that defines the term the module is named
  after belongs at its front door, framing every lesson after it.
- Putting it in 01 and *also* designing REST endpoints in 03 guarantees duplication.

**Required scope correction:** `src/data/curriculum.ts:662` currently gives module 01 the summary
"HTTP, REST, JSON, status codes, and how a request moves." Drop `REST` from that line so module 01
stops promising content that now lives in 03. Suggested replacement: "HTTP, JSON, status codes, and
how a request moves." Module 03's summary should gain the framing, e.g. "Design routes, handle
requests, validate input, and return useful responses — and know what REST actually requires."

## Lesson record

```ts
{
  id: 'backend-rest-what-rest-actually-is',
  slug: 'what-rest-actually-is',
  title: 'What REST actually is (and why your API probably is not)',
  summary: 'Separate Fielding\'s architectural style from the HTTP-and-JSON convention the industry calls REST, and see where hypermedia genuinely pays for itself.',
  contentFile: 'rest-what-rest-actually-is.md',
  readTime: '22 min',
  category: 'Backend / REST',
}
```

Place first in `backend-rest-apis.lessons`, before route design.

## Structure

Follows the house pattern: `## What you will learn` → body → `## Practice` →
`## Check your understanding` → `## Primary references`. No frontmatter, no `#` h1, body opens at
`##`.

### 1. `## What you will learn`

Outcomes:
- Name REST's six constraints and identify which one nearly every API drops.
- Explain why "RESTful" is the honest word for most HTTP+JSON APIs.
- Read a Richardson Maturity Model level off an unfamiliar API's responses.
- Describe HATEOAS concretely, and name real APIs that ship it and what it buys them.
- Decide, for a given API, whether hypermedia is worth its cost.

### 2. The origin — REST is a dissertation, not a convention

REST comes from Roy Fielding's 2000 doctoral dissertation, where it describes the architectural
style of the *web itself*, derived to explain why the web scaled. Establish early that REST was
descriptive of a working system before it was prescriptive for APIs. Six constraints:

client-server · stateless · cacheable · layered system · uniform interface · code-on-demand
(the only optional one).

Then the sub-constraints of the uniform interface, since this is where the lesson turns:
identification of resources · manipulation through representations · self-descriptive messages ·
**hypermedia as the engine of application state (HATEOAS)**.

### 3. The correction — the industry uses the word wrong

The core section. Fielding wrote a 2008 post specifically because of this, and his wording is blunt
enough to quote directly:

> "I am getting frustrated by the number of people calling any HTTP-based interface a REST API."

> "if the engine of application state (and hence the API) is not being driven by hypertext, then it
> cannot be RESTful and cannot be a REST API. Period."

Include his rule that a REST API "must not define fixed resource names or hierarchies (an obvious
coupling of client and server)" — because that single line invalidates the hardcoded-URL-template
approach of practically every API a learner has used, including ones with excellent documentation.
The point to land: **documentation is out-of-band information; in true REST the server teaches the
client its next moves in-band, through hypermedia.**

Then the fair counterweight, so this does not read as purity policing: teams knowingly stop short
of hypermedia because it costs client complexity and buys little when the client is a single
first-party SPA shipped in lockstep with the server. "RESTful" is the accurate, non-pejorative word
for that. The lesson's stance should be *use the word honestly*, not *go build hypermedia*.

### 4. Richardson Maturity Model as the measuring stick

Give learners a vocabulary for "how far along the spectrum is this API":

| Level | What it does | Typical example |
| --- | --- | --- |
| 0 | HTTP as a tunnel; one endpoint, one verb | SOAP-style POST to `/api` |
| 1 | Resources get their own URIs | `/orders/42` but everything is POST |
| 2 | HTTP verbs and status codes carry meaning | **where nearly every "REST API" sits** |
| 3 | Hypermedia controls tell the client what is possible next | PayPal, the HTML web |

Two accuracy notes to preserve when writing: the model is Leonard Richardson's, presented at QCon
and popularized by Fowler; and Fowler is explicit that RMM is *not* itself a definition of REST
levels — Fielding treats level 3 as a **precondition** of REST, not the top of a scoring rubric.
Do not present level 3 as "extra credit."

### 5. HATEOAS in the real world

The section that keeps this from being theory. Order from most familiar to most specialized:

1. **The web browser is the reference implementation.** A user navigates an entire application
   knowing exactly one URL, because every page ships the links and forms for its next legal
   transitions. That is HATEOAS, working at planetary scale, and it is why Fielding derived REST
   from it. Best possible intuition pump — start here.
2. **Link headers for pagination** — the most widely deployed partial hypermedia. GitHub's REST API
   returns a `Link` header with `rel="next"`, `"prev"`, `"first"`, `"last"`; a client pages through
   by *following links it was given* rather than constructing `?page=n` itself. Show a real header.
   This is standardized as web linking (RFC 8288).
3. **PayPal's Orders/Payments APIs** — a genuine production HATEOAS design: responses carry a
   `links` array of objects with `href`, `rel`, and `method`, so a payment flow is driven by the
   links the previous response returned (`rel: "self"`, an `approve` link, a refund link that
   appears only when refunding is currently legal). This is the strongest real-world argument:
   **state-dependent affordances**. The server will not offer a refund link on an unpaid order, so
   the client never needs to reimplement that rule.
4. **Hypermedia formats** — HAL (`_links`), JSON:API (`links`), Siren, and OpenAPI 3's `links`.
   Mention as the menu, do not teach each one.
5. **The modern revival** — htmx and HTML-over-the-wire as a deliberate return to hypermedia after
   the JSON-RPC era. One paragraph; it shows the idea is live, not historical.

Close the section with the honest trade-off: hypermedia's payoff is decoupling and discoverability;
its cost is heavier clients, larger payloads, and few client libraries that actually follow links.
Teams pay it when clients are third-party, long-lived, or must not break when URLs change — which
is exactly PayPal's situation and exactly not a typical internal CRUD API's.

### 6. `## Practice`

1. `curl -sI https://api.github.com/repositories/1300192/issues?page=2` and read the `Link` header;
   page forward by following `rel="next"` only, never editing the URL by hand.
2. Take any API the learner has used and score it against RMM levels 0-3, citing the specific
   response evidence for the level assigned.
3. Fetch a PayPal sandbox order response (or the documented sample) and list which `rel` values
   appear; explain what each one authorizes the client to do next.
4. Rewrite one plain JSON response to include a `_links` object in HAL style; state what the client
   no longer needs to hardcode.
5. Argue the opposite case in writing: name an API where adding hypermedia would be a net cost, and
   say why.

### 7. `## Check your understanding`

- Which of REST's six constraints is optional, and which one do most "REST APIs" omit?
- Why does Fielding say an API with fixed, documented URI templates cannot be REST?
- What is the difference between "REST" and "RESTful" as this lesson uses them?
- At which RMM level do most production APIs sit, and what would move them to level 3?
- Why is a refund link that appears only on paid orders more useful than documenting the same rule?
- When is *not* implementing HATEOAS the correct engineering decision?

## Writing constraints

- **Tone: correcting a widespread error, not scolding.** The learner has probably shipped a level-2
  API and called it REST. The lesson should make them precise, not defensive. Explicitly bless
  "RESTful" as the right word rather than treating level 2 as failure.
- Quote Fielding directly for the contentious claims — his own words carry the correction better
  than paraphrase, and this is the part readers will push back on.
- Every real-world claim names the API and shows the actual response shape. No "many APIs do X."
- Do not resolve the essay into "therefore build hypermedia." The honest conclusion is that most
  teams should not, and should stop misusing the term.

## Files to touch

| File | Change |
| --- | --- |
| `src/content/rest-what-rest-actually-is.md` | New lesson body |
| `src/data/curriculum.ts` | Add record to `backend-rest-apis.lessons`; drop `REST` from module 01's summary (line ~662); extend module 03's summary |
| `src/views/LessonView.vue` | `?raw` import + `markdownByFile` entry (manual step, per guidelines) |

## Verification

1. `npm run dev`; open `/curriculum/backend-development/rest-apis/what-rest-actually-is`; confirm
   the body renders from `##` with no stray YAML and the RMM table is intact.
2. Confirm module 01's page no longer advertises REST in its summary.
3. Re-run the `Link` header command in Practice step 1 and confirm the documented `rel` values still
   appear before publishing.
4. Check every quotation against the sources below — these are the claims most likely to be
   challenged by a reader.

## Sources verified during planning

- Fielding, "REST APIs must be hypertext-driven" (2008) — both quotations and the fixed-resource-
  names rule confirmed verbatim: https://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven
- Fowler on the Richardson Maturity Model — levels 0-3, Richardson's QCon origin, and the explicit
  "level 3 is a precondition of REST, RMM is not a definition of REST levels" clarification:
  https://martinfowler.com/articles/richardsonMaturityModel.html
- GitHub REST pagination `Link` header with `rel="prev"|"next"|"last"|"first"` — real example
  confirmed: https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api
- PayPal HATEOAS links (`href`, `rel`, `method`; state-dependent links such as refund):
  https://developer.paypal.com/api/rest/responses and
  https://developer.paypal.com/docs/api/reference/api-responses/#hateoas-links
- Fielding's dissertation (constraints and uniform-interface sub-constraints) — cite directly in the
  lesson: https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm
- RFC 8288 Web Linking — to cite for the `Link` header: https://www.rfc-editor.org/rfc/rfc8288
