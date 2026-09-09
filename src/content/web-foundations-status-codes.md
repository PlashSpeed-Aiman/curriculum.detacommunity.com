## What you will learn

An HTTP status code is a promise made to a caller that the server does not know personally. A
browser, a command-line client, a mobile application, a proxy, and a monitoring system can all see
the same three digits and make a first decision without understanding the application's code. That is
why a status code is part of an API's machine-readable contract, not a decorative number beside a
message.

By the end of this lesson, you should be able to:

- Read the five status-code classes as broad promises to a caller.
- Choose correctly between the failure pairs that are commonly confused: 200 versus a real error,
  401 versus 403, 400 versus 422, and 404 versus 410.
- Distinguish safe methods from idempotent methods and explain what that changes about retries.
- Choose between 301/302 and 307/308 when a redirect must preserve a method and its request content.
- Use RFC 9457 Problem Details with `application/problem+json` when a status code needs structured
  application-specific detail.

The lesson stays at the HTTP layer. It does not assume a framework, an authentication library, or a
particular resource design.

## The status line is the first promise

An HTTP response carries several kinds of information. The status code gives the broad outcome, the
headers add protocol instructions and metadata, and the content gives a representation or more detail.
The code should be useful before a caller has parsed the content.

In an HTTP/1.1 text exchange, a response begins with a status line like this. This is an illustrative
line, not output captured from a server:

```http
HTTP/1.1 422 Unprocessable Content
```

The three-digit code is the machine-readable part. The reason phrase, `Unprocessable Content`, helps a
human read an HTTP/1.1 transcript, but a client should branch on `422`, not on the exact wording. HTTP
versions with a different wire format still use the status-code semantics defined by
[RFC 9110, Section 15](https://www.rfc-editor.org/rfc/rfc9110.html#section-15).

You can ask `curl` to show response headers as well as content with `-i`:

```bash
curl -i https://example.com/
```

No output is included here because headers, redirects, and representations can vary. When reading the
response, look at the status code before reading the body. A generic client can then decide whether to
use the result, follow a redirect, change the request, or consider a retry before it knows anything
about the application's JSON shape.

That ordering is the central habit for this lesson:

1. Read the status code.
2. Apply the relevant header rules, such as `Location` or `WWW-Authenticate`.
3. Parse the content only when the status and content type say that parsing is useful.

The content can explain *why* a response has a status, but it should not have to overturn the status.

## Five classes, five promises

The first digit gives a caller a coarse branch. The individual code supplies the more precise
meaning. The [overview in RFC 9110, Section 15.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.1)
also defines how a client should reason about an unrecognized code in a known class: understand the
class from the first digit and treat an unknown code as the `x00` member of that class.

| Class | Promise at a glance | Sensible first question |
| --- | --- | --- |
| 1xx Informational | The request has been received or understood so far, but this is an interim response, not the final result. | Should I wait for the final response? |
| 2xx Successful | The request was successfully received, understood, and accepted. The individual code still says whether work is complete, queued, or has no content. | What result or representation should I use? |
| 3xx Redirection | The client needs another step to complete the request, such as following a `Location` value or using a stored representation. | Should I follow a direction, and must I preserve the method? |
| 4xx Client Error | The server cannot or will not fulfill the request as currently sent. Changing the request, credentials, or target may help. | What about this request must change? |
| 5xx Server Error | The server or an intermediary failed to fulfill a request that it understood well enough to process. | Is this transient, and is retrying safe? |

The labels are about the request-response contract, not about assigning moral blame to a person. A
4xx response can result from stale client state, an intentionally hidden resource, or credentials that
do not grant access. A 5xx response can come from a gateway rather than the application that ultimately
owns the target. The class tells a generic caller which kind of next step is plausible; it does not
replace the exact code, headers, or content.

Two useful boundaries are easy to miss:

- `202 Accepted` is successful receipt of a request whose processing may not be finished. `2xx` does
  not always mean that the final business result already exists.
- `304 Not Modified` is in the 3xx class, but it tells a cache-aware client to use its stored
  representation rather than sending it to a new URL. Not every 3xx response is a simple move.

## The confusions that break clients

The following table is the practical core of the lesson. The question in the last column is a quick
diagnostic, not a substitute for reading the complete status definition.

| Pair | The rule | The tell |
| --- | --- | --- |
| 200 vs a real error | [`200 OK`](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.3.1) says the request was successful. A body such as `{"error": ...}` can be valid JSON, but if it means the operation failed, returning 200 makes generic clients, monitoring, and caching policy treat the response as success unless they know this private body convention. | If the caller must parse the body to discover that the request failed, the status contract is carrying the wrong result. |
| 401 vs 403 | [`401 Unauthorized`](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.2) means the request lacks valid authentication credentials. The origin server generating a 401 **MUST** send at least one `WWW-Authenticate` challenge. [`403 Forbidden`](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.4) means the server understood the request but refuses to fulfill it; supplied credentials may be insufficient. | Is the caller missing valid credentials and being given a challenge? Use 401. Has the request been understood but access refused? Use 403. A 401 without its required challenge is a broken 401 contract, not a silent 403. |
| 400 vs 422 | [`400 Bad Request`](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.1) covers a request the server cannot or will not process because it sees a client error, commonly invalid syntax or framing. [`422 Unprocessable Content`](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.21) means the server understands the content type and the syntax is correct, but it cannot process the instructions in the content. | Did parsing or request syntax fail? Think 400. Did parsing succeed but validation or request semantics fail? Think 422. |
| 404 vs 410 | [`404 Not Found`](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.5) means the origin did not find a current representation, or is not willing to disclose that one exists. [`410 Gone`](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.11) means the target is no longer available and the condition is likely permanent. | Is the absence temporary, unknown, or intentionally concealed? Use 404. Was the resource deliberately removed and is it likely not coming back? Use 410. |

### 200 with an error body

Consider this body by itself:

```json
{
  "error": {
    "code": "invalid_input",
    "message": "The value is not valid."
  }
}
```

There is nothing inherently wrong with an `error` member in JSON. The contract fails when a server
sends that body with `200 OK` to report that the requested operation failed. A caller that only knows
HTTP can reasonably record a success, cache the response when the cache rules permit it, or hand the
body to normal success handling. A caller that knows the private convention has to duplicate the
server's application logic just to find the result.

Return an appropriate 4xx or 5xx status first, then use the body to explain the failure. The body is
valuable; it is not a replacement for the status code.

### 401 and 403 are not interchangeable

The word `Unauthorized` in the 401 reason phrase causes much of the confusion. In RFC 9110's
semantics, 401 is about the absence of valid authentication credentials for the target resource. It
also has a specific header requirement. An illustrative 401 shape is:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Basic realm="example"
```

This is an example of a response shape, not a transcript from a live service. The value of
`WWW-Authenticate` is a challenge using an authentication scheme understood by the service. A server
may send more than one challenge, but the origin server generating 401 must send at least one.
The header's rules are in [RFC 9110, Section 11.6.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-11.6.1).

Use 403 when the server has understood what the caller is asking for but refuses to fulfill it. The
reason might be insufficient permission or a policy decision. If the server instead wants to conceal
whether a current representation exists, 404 is the relevant status semantics. This lesson does not
need to choose an authentication scheme: the useful protocol distinction is whether the caller needs a
valid credential challenge or whether the understood request is being refused.

### 400 and 422 mark different failure stages

Think of a request body passing through two broad gates:

1. **Syntax gate:** Can the server parse the request according to its framing and content syntax? If
   not, 400 is the natural fit. An unsupported media type is a separate 415 case.
2. **Meaning gate:** The content parsed successfully, but its instructions cannot be processed. A
   validation failure such as a negative value where only positive values are allowed can fit 422.

RFC 9110 defines 422 as `Unprocessable Content` in [Section 15.5.21](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.21).
Older material often calls it `Unprocessable Entity` and presents it as WebDAV-only. The current HTTP
semantics specification defines it directly, but a service still needs to document which validation
conditions it maps to 422 rather than 400.

### 404 and 410 communicate different expectations

404 does not prove that no resource exists. RFC 9110 explicitly allows it when the origin is not
willing to disclose a current representation. It also makes no promise that a later request will have
the same result.

410 is stronger: the origin says the resource is no longer available and believes that condition is
likely permanent. "Likely permanent" is important. It is a deliberate signal about expected lifetime,
not an eternal guarantee, so a later deployment can still change the result.

## Safe, idempotent, and why retries depend on it

Status codes describe the response. The request method describes what repeating the request means. A
client that is deciding whether to retry needs both pieces of information.

### Safe is not the same as read-only in every detail

Under [RFC 9110, Section 9.2.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.1), a method is
**safe** when the client does not request a state change from the target resource. The server can still
log the request, count it, update metrics, or perform other incidental side effects. "Safe" describes
the intended semantics of the request, not a guarantee that no byte anywhere on the server changes.

The standard safe methods are `GET`, `HEAD`, `OPTIONS`, and `TRACE`. The important distinction is that
safe does not mean "the response cannot fail" and it does not mean "the method is the only thing the
server can do internally."

### Idempotent is about the intended effect of repetition

Under [RFC 9110, Section 9.2.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2), a method is
**idempotent** when multiple identical requests have the same intended effect as one request. The
responses do not have to be identical. A second `DELETE` might report that the target is already gone,
for example, while the intended resource state is still "gone".

The standard method properties can be summarized like this:

| Method | Safe? | Idempotent? | Reasoning |
| --- | --- | --- | --- |
| `GET` | Yes | Yes | Retrieves a representation. |
| `HEAD` | Yes | Yes | Retrieves the metadata a corresponding `GET` would expose, without response content. |
| `OPTIONS` | Yes | Yes | Asks about communication options for a target or server. |
| `TRACE` | Yes | Yes | Performs a diagnostic loop-back of the request. Its safe semantics do not make it appropriate to expose everywhere. |
| `PUT` | No | Yes | Replaces or creates the representation at a known target; repeating the same desired representation does not multiply that intended replacement. |
| `DELETE` | No | Yes | Requests removal of the target; repeating the request does not intend a second removal. |
| `POST` | No | No by default | Processes enclosed content according to the target resource; repeating it may perform the operation again. |

So safe methods are a subset of the idempotent methods. `PUT` and `DELETE` are idempotent without
being safe. Idempotent does not mean read-only, and it does not mean that a server is forbidden from
logging or performing other incidental work.

The property belongs to the method semantics that the caller can rely on. If an endpoint uses `PUT`
but each identical request appends another record or triggers a second independent action, it is not
honoring the usual idempotent meaning of `PUT`. An extension method or a particular application
operation needs an explicit contract; do not infer idempotence from a familiar-looking name.

### What a retry can and cannot tell you

Imagine a client sends a request, the server completes it, and the connection fails before the client
receives the response. The client now has uncertainty, not a definite failure. It does not know whether
the request reached the server or whether the response was lost.

An idempotent request can be a reasonable candidate for an automatic retry because repeating it does
not multiply its intended effect. RFC 9110 permits clients to retry idempotent requests after a
communication failure and says that a client **SHOULD NOT** automatically retry a non-idempotent request
unless it has a way to know that this particular request is actually idempotent. That is permission and
guidance, not a promise that every browser, proxy, or mobile client will retry.

This is why a timeout on a `POST` that might create a purchase, job, or message is dangerous: the
original operation may have succeeded, and an unexamined retry may create a second result. A timeout on
a correctly idempotent `PUT` can still be operationally important, but repeating the same desired state
does not have the same duplication risk. A `GET` is safe to retry in its intended semantics, subject to
the client's policy and the service's availability.

The status code adds another signal, but it is not a complete retry policy:

- A definitive 4xx response usually means that retrying the unchanged request will repeat the same
  problem. Fix the request or its credentials first.
- A 5xx response can be transient, especially when it comes from an intermediary, but it can also mean
  that the server performed part of the work before failing. Use backoff and only retry when the method
  and application contract make repetition acceptable.
- A response such as 503 may include `Retry-After`, but that header still does not make a non-idempotent
  operation safe to repeat. The [Retry-After definition is in RFC 9110, Section 10.2.3](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.2.3).

The practical rule is: classify the method, classify the failure, and then decide whether the caller
can safely repeat the request. Never use a broad "retry every error" rule.

## Redirects change more than the URL

A redirect response normally carries a `Location` header. The permanent/temporary pairs are easy to
remember, but their method behavior is the part that changes whether a request body survives:

| Lifetime | Redirect that may rewrite a method | Redirect that preserves the method |
| --- | --- | --- |
| Temporary | `302 Found` | `307 Temporary Redirect` |
| Permanent | `301 Moved Permanently` | `308 Permanent Redirect` |

For historical compatibility, a user agent may change `POST` to `GET` when following a 301 or 302.
That can silently discard the original request body. The rules are described in
[RFC 9110, Section 15.4.2 for 301](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4.2) and
[Section 15.4.3 for 302](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4.3).

When the redirected request must keep its original method, use 307 for a temporary move or 308 for a
permanent move. A client that automatically follows 307 or 308 must not change the request method, so
it does not silently turn a body-carrying `POST` into a `GET`. The client still needs to be capable of
resending the request content, and callers should not send sensitive content to an untrusted redirect
target. See [RFC 9110, Section 15.4.8 for 307](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4.8)
and [Section 15.4.9 for 308](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4.9).

These examples use an echo/redirect service and send only the harmless value `sample=one`. They are
learner exercises, not captured output. `-i` includes each response's headers, `-L` follows redirects,
and `--data` makes the initial request a `POST`:

```bash
curl -iL --data 'sample=one' \
  'https://httpbin.org/redirect-to?url=https%3A%2F%2Fhttpbin.org%2Fanything&status_code=301'
```

```bash
curl -iL --data 'sample=one' \
  'https://httpbin.org/redirect-to?url=https%3A%2F%2Fhttpbin.org%2Fanything&status_code=307'
```

Inspect the request method and body reported by the final echo response, then compare the two codes.
The exact transcript depends on the client and its options. If you do not want to contact a public
service, use a local redirect endpoint and a local echo endpoint instead.

## When the code is not enough: Problem Details

A status code gives generic HTTP software a stable branch, but `403` alone cannot explain whether a
request was refused because of a policy, an account state, or a permission decision. An HTML error page
may help a person in a browser, but it is awkward for a non-human consumer to process consistently.

[RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html#section-1) defines Problem Details as a common
format for carrying machine-readable error detail in HTTP content. Its JSON serialization uses the
media type `application/problem+json`, not a private variation of an ordinary success document.

Problem Details can accompany any HTTP status code, but they fit most naturally with 4xx and 5xx
responses. They supplement the status code; they do not justify returning `200 OK` for an operation
that failed.

### The five standard members

The members are defined in [RFC 9457, Section 3.1](https://www.rfc-editor.org/rfc/rfc9457.html#section-3.1):

| Member | Meaning |
| --- | --- |
| `type` | A URI reference identifying the problem type. If omitted, it defaults to `about:blank`. Consumers should use this identifier rather than parsing prose. |
| `title` | A short, human-readable summary of the problem type. It should normally stay stable for the same type, apart from localization. |
| `status` | The HTTP status code generated by the origin server for this occurrence. It is advisory in the body; the actual HTTP response status remains authoritative for generic HTTP software. |
| `detail` | A human-readable explanation specific to this occurrence. Clients should not parse it as a data protocol. |
| `instance` | A URI reference identifying this particular occurrence of the problem. It may be dereferenceable or simply an opaque identifier. |

These are the standard members, not five mandatory fields that every response must contain. A problem
type may define extension members, and consumers must ignore extensions they do not recognize. If a
body includes `status`, the generator should keep it consistent with the actual response status; the
RFC requires the generator to use the same status code in the HTTP response.

Here is an illustrative validation response shape. The `.test` host is reserved for examples, and the
values are not from a live service:

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
```

```json
{
  "type": "https://api.example.test/problems/invalid-profile",
  "title": "Profile is invalid",
  "status": 422,
  "detail": "The age field must be a positive integer.",
  "instance": "https://api.example.test/problem-instances/abc123",
  "errors": [
    {
      "field": "age",
      "reason": "must be a positive integer"
    }
  ]
}
```

The `errors` array is an application-specific extension. A generic client can still branch on 422 and
recognize the `application/problem+json` media type without knowing the extension. A client that does
know this problem type can use the structured field location without scraping `detail`.

RFC 9457 obsoletes RFC 7807. That does not mean every existing service changes its media type overnight;
it means new reading and implementation should use the current specification. The aim is to avoid
inventing a different error envelope for every service while keeping the HTTP status semantics visible.

## Practice

Use read-only endpoints or a disposable local service. Do not send credentials to an unfamiliar host,
and do not use a mutating endpoint merely to see what status it returns. The public examples below send
no credentials and, for the redirect exercise, only the sample body shown above.

1. Inspect a response with `curl -i` from a public API or a local endpoint that you are allowed to
   call. Find a case where the body appears to describe an error but the status is 2xx. Record the
   status, relevant headers, and body without copying a made-up transcript. Explain what a generic
   client, monitor, or cache could infer incorrectly. If you cannot find such an endpoint, use the
   illustrative JSON in this lesson and state that it is hypothetical.
2. Make a credential-free request to a safe authentication demonstration endpoint:

   ```bash
   curl -i https://httpbin.org/basic-auth/learner/example
   ```

   Inspect the response for `401` and `WWW-Authenticate`. Then use a read-only endpoint you are
   authorized to access and identify a request where the server understands the caller but refuses it
   with 403. Do not paste a real credential into this lesson or into a command you will share.
3. Run the two redirect commands above. Compare 301 with 307 and write down the method and body that
   the client sends to the final target. Repeat the reasoning for the temporary pair, 302 versus 307,
   and the permanent pair, 301 versus 308, without sending another request.
4. Write a complete `application/problem+json` body for a validation failure. Include `type`, `title`,
   `status`, `detail`, and `instance`, choose 400 or 422 based on whether parsing or meaning failed,
   and add one structured extension only if a client needs it. Check that the body status matches the
   HTTP response status you chose.
5. Take an endpoint you already understand and make a table of its methods: safe, idempotent, or
   neither. For each method, imagine that the connection fails after the server might have received
   the request. Mark whether an automatic retry could duplicate the intended effect and explain why.

## Check your understanding

- Why is a 200 response with an error-shaped body a contract problem even when the JSON is valid?
- Which header must accompany a 401 response generated by an origin server, and how is that response
  different from 403?
- For a syntactically valid body containing an unacceptable value, which processing gate failed and
  which status code is a possible fit: 400 or 422?
- What uncertainty does 404 leave open that 410 narrows, and what does "likely permanent" mean?
- Which methods in RFC 9110 are safe? Which unsafe methods are still idempotent?
- Why can a timeout after a POST be more dangerous to retry than a timeout after an idempotent PUT?
- Which redirect pair may rewrite POST to GET, and which pair requires the method to be preserved?
- What does `application/problem+json` add beyond a status code, and why should a client not branch on
  the `detail` string or trust a body `status` over the actual HTTP status?

## Next step

You can now choose a status that tells a generic caller what happened. The next lesson adds the other
half of the response contract: how `Content-Type` and JSON serialization tell that caller what the
bytes mean.

## Primary references

- [RFC 9110: HTTP Semantics, status-code overview](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.1)
- [RFC 9110: Safe methods, Section 9.2.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.1)
- [RFC 9110: Idempotent methods, Section 9.2.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)
- [RFC 9110: `WWW-Authenticate`, Section 11.6.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-11.6.1)
- [RFC 9110: 301 Moved Permanently, Section 15.4.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4.2)
- [RFC 9110: 302 Found, Section 15.4.3](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4.3)
- [RFC 9110: 307 Temporary Redirect, Section 15.4.8](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4.8)
- [RFC 9110: 308 Permanent Redirect, Section 15.4.9](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4.9)
- [RFC 9110: 400 Bad Request, Section 15.5.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.1)
- [RFC 9110: 401 Unauthorized, Section 15.5.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.2)
- [RFC 9110: 403 Forbidden, Section 15.5.4](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.4)
- [RFC 9110: 404 Not Found, Section 15.5.5](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.5)
- [RFC 9110: 410 Gone, Section 15.5.11](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.11)
- [RFC 9110: 422 Unprocessable Content, Section 15.5.21](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.21)
- [RFC 9457: Problem Details JSON object, Section 3](https://www.rfc-editor.org/rfc/rfc9457.html#section-3)
- [RFC 9457: Problem Details members, Section 3.1](https://www.rfc-editor.org/rfc/rfc9457.html#section-3.1)
- [RFC 9457: Extension members, Section 3.2](https://www.rfc-editor.org/rfc/rfc9457.html#section-3.2)
- [RFC 9457: Defining new problem types, Section 4](https://www.rfc-editor.org/rfc/rfc9457.html#section-4)
