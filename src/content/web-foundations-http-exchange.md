## What you will learn

An HTTP request is not the first thing that happens when an application calls a URL. A name must
be resolved, a transport connection must be opened, and an encrypted connection may need to agree
on an application protocol before HTTP can send its first line.

The primary outcome of this lesson is that you can take one request and locate each part of its
exchange: the network setup, the HTTP/1.1 request and response boundaries, and the equivalent
HTTP/2 representation. By the end, you can:

- Name the stages a request passes through before application code receives it.
- Read `curl -v` output line by line and identify which layer produced each line.
- Explain the HTTP/1.1 request line, `Host` field, CRLF framing, and response body boundary.
- Distinguish HTTP/1.1 text framing from HTTP/2 binary frames and pseudo-header fields.
- Explain what connection reuse changes about the cost of a second request.

The examples use only `curl` and public, read-only URLs. Your output will vary with your curl
version, DNS answers, network, proxy, and the server's current response. The lesson uses no captured
terminal transcript, so you learn to read the exchange you actually receive.

## One command, eight stages

Run this from any directory:

```bash
curl -v --http1.1 https://api.github.com/zen
```

This sends a `GET` request to a public endpoint. It does not create or change a resource. The `-v`
option asks curl to describe the connection and the HTTP headers; `--http1.1` makes the wire format
deliberately visible by preventing this request from using HTTP/2. The response body is written to
your terminal, while verbose diagnostics are written to standard error.

### The `*` / `>` / `<` key

Read the first character of each verbose line before reading the rest of the line:

| Prefix | Meaning | Examples of what it can describe |
| --- | --- | --- |
| `*` | curl's own diagnostic commentary, not an HTTP field | DNS resolution, TCP connection, TLS, ALPN, and connection reuse |
| `>` | Data curl is sending at the HTTP message layer | The request line and request fields |
| `<` | Data curl is receiving at the HTTP message layer | The response status line and response fields |

The response body normally has none of these three prefixes. That is why verbose diagnostics and
the body can appear interleaved when both are sent to a terminal. The prefixes are curl's display
convention, not bytes that the server receives or sends. The exact diagnostics and their wording
vary by curl version; the roles of the prefixes are the useful invariant. See curl's
[`--verbose` documentation](https://curl.se/docs/manpage.html#-v).

### The eight stages

The stages below are a reading order, not a claim that every implementation exposes eight separate
packets or function calls. ALPN is part of the TLS handshake, but keeping it as its own question
makes the protocol choice easier to see.

| Stage | What happens | What to look for in the trace |
| --- | --- | --- |
| 1. DNS resolution | The hostname is resolved to one or more IP addresses. | `*` lines about resolving `api.github.com` |
| 2. TCP connection | curl opens a TCP connection to an address on port 443. | `*` lines about trying and connecting |
| 3. TLS handshake | The peers negotiate TLS, the server presents a certificate, and the connection is prepared for protected application data. | `*` lines describing TLS and certificate verification |
| 4. ALPN selection | The client and server select an application protocol such as `http/1.1` or `h2`. | `*` lines about the protocols offered or selected |
| 5. HTTP request | curl sends the request line and request fields. | Lines beginning with `>` |
| 6. Header terminator | An empty line ends the HTTP/1.1 header section; a request body would follow it. | The boundary after the `>` request fields |
| 7. HTTP response | The server sends a status line and response fields. | Lines beginning with `<` |
| 8. Response body | The response content follows the response framing rules. | Usually unprefixed content after the response fields |

DNS, TCP, and TLS are prerequisites for this HTTP exchange, but they are not themselves HTTP.
Seeing a `*` line does not mean that an HTTP header was sent. Seeing a `>` or `<` line means curl
is showing the HTTP-level representation it understands, even when the underlying protocol is later
HTTP/2.

### DNS, TCP, TLS, SNI, and ALPN

The URL contains two names that are easy to blur together: the scheme `https` and the hostname
`api.github.com`. DNS resolves the hostname to an address. The resolver may return IPv4 or IPv6
addresses, and curl may try more than one. The result is an address choice, not proof that an HTTP
server has accepted the request. The DNS architecture is described in
[RFC 1034](https://www.rfc-editor.org/rfc/rfc1034.html).

TCP then provides an ordered byte stream between the client and the selected address and port. For
HTTPS, the default port is 443. TCP does not know that the bytes will contain HTTP; it only carries
the bytes. The current TCP specification is [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html).

TLS starts on top of that TCP stream. In the usual HTTPS case, the server proves its identity with a
certificate and the peers establish protected application data. curl verifies the certificate
against its configured trust store and the URL hostname; bypassing that check with `-k` would make
this a poor learning example, so none of these commands disable verification. See curl's
[certificate verification documentation](https://curl.se/docs/sslcerts.html) and
[TLS 1.3, Section 1](https://www.rfc-editor.org/rfc/rfc8446.html#section-1).

Two TLS extensions answer different questions during that handshake:

- **SNI, or Server Name Indication,** carries the hostname the client is contacting in the TLS
  `ClientHello`. A server that hosts several virtual sites at one address can use that name when
  selecting a certificate or other TLS policy. SNI helps the TLS endpoint choose; it does not
  replace certificate validation. See [RFC 6066, Section 3](https://www.rfc-editor.org/rfc/rfc6066.html#section-3).
- **ALPN, or Application-Layer Protocol Negotiation,** lets the client offer application protocol
  identifiers and lets the server select one during the TLS handshake. HTTP/2 over TLS uses `h2`,
  while HTTP/1.1 uses `http/1.1`. ALPN chooses how the following application bytes are framed; it
  does not choose the DNS address. See [RFC 7301, Sections 3.1-3.2](https://www.rfc-editor.org/rfc/rfc7301.html#section-3.1).

The `--http1.1` option tells curl to use HTTP/1.1 for this transfer. Without that constraint, a
curl build with HTTP/2 support can offer `h2`, and the server can select it. A proxy or a build
without HTTP/2 support can produce a different negotiation result.

## The request line is three tokens

For a direct HTTP/1.1 request to this URL, the request line has this shape:

```http
GET /zen HTTP/1.1
Host: api.github.com
```

This is simplified wire notation, not a transcript from the command. The `Host` line is shown with
the request to make its relationship to the request line clear; a real curl request also includes
other fields such as its user agent and accepted media types.

The request line itself has three tokens separated by one space:

1. `GET` is the method. It asks the server to transfer a current representation of the target.
2. `/zen` is the request-target. In the common origin form, it is the path and optional query,
   not the full URL.
3. `HTTP/1.1` identifies the message syntax and version.

The request line ends with CRLF, just like every HTTP/1.1 field line. The grammar for this line and
the four request-target forms are defined in [RFC 9112, Section 3](https://www.rfc-editor.org/rfc/rfc9112.html#section-3).

`Host` carries the authority, here `api.github.com`. An HTTP/1.1 client **MUST** send a `Host`
field in every request, and a server must reject a request that lacks one or contains more than one
with a `400 Bad Request` response. See [RFC 9112, Section 3.2](https://www.rfc-editor.org/rfc/rfc9112.html#section-3.2) and
[RFC 9110, Section 7.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-7.2).

Why require a name when TCP already connected to an IP address? One IP address can serve many
websites. The IP address gets the bytes to a machine or load balancer, SNI identifies the intended
TLS name early enough for certificate selection, and `Host` identifies the HTTP authority after the
TLS connection is ready. These values are often identical, but they belong to different layers and
are not interchangeable.

The mandatory `Host` rule also gives an HTTP/1.1 origin server enough information to reconstruct the
target URI when the request-target is only `/zen`. A proxy can receive an absolute-form target in
some situations, but the HTTP/1.1 `Host` requirement still applies.

## Why the blank line matters

HTTP/1.1 is a text-oriented message syntax with a mechanical boundary between fields and content. A
message has a start-line, zero or more field lines, an empty line, and an optional message body. The
specification describes the shape like this:

```text
start-line CRLF
field-line CRLF
field-line CRLF
CRLF
[message body]
```

Each `CRLF` means two octets: carriage return (`\r`) followed by line feed (`\n`). The last field's
line ending plus the empty line produces the familiar `\r\n\r\n` boundary. In a compact notation,
the beginning of this request could be represented as:

```http
GET /zen HTTP/1.1\r\n
Host: api.github.com\r\n
Accept: */*\r\n
\r\n
```

The backslash sequences above are notation for the bytes; they are not a claim about what curl
prints in the terminal. The empty line ends the header section. It does not promise that a body
exists. This `GET` request normally has no request body, while a response may have one.

Once the header section ends, HTTP/1.1 still needs a rule for deciding how many bytes belong to the
message body. A `Content-Length` field gives a decimal count of octets. `Transfer-Encoding: chunked`
uses chunk sizes and a terminating zero-size chunk when the sender does not know the total size in
advance. In other cases, the response rules can use the status code or connection closure to decide
whether and how the body ends. These are message-framing rules, not guesses based on the number of
characters a body appears to contain. See [RFC 9112, Section 6](https://www.rfc-editor.org/rfc/rfc9112.html#section-6).

This boundary matters especially when a connection stays open for another request. If a recipient
could not tell where one body ended, it could mistake the next response or request for more body
bytes. The blank line separates fields from content; `Content-Length`, chunked framing, or another
HTTP/1.1 rule separates one message from the next.

## The same exchange over HTTP/2

Run the same safe request without forcing HTTP/1.1:

```bash
curl -v https://api.github.com/zen
```

If this curl build supports HTTP/2 and the server selects `h2` through ALPN, the HTTP exchange is
HTTP/2. If the server or client selects `http/1.1` instead, the exchange remains HTTP/1.1. Read the
ALPN and protocol-selection lines in your own trace rather than assuming one result.

HTTP/2 keeps the HTTP meaning of a request but changes how the message is carried:

- HTTP/1.1 sends a readable request line, field lines, CRLF delimiters, and optional body bytes.
- HTTP/2 sends binary frames on a stream. `HEADERS` frames carry the request control data and fields;
  `DATA` frames carry content when there is a body.
- HTTP/2 uses field compression and can interleave frames from multiple streams on one connection.

For an ordinary request, the HTTP/2 control data corresponding to the HTTP/1.1 request above is
conceptually:

```text
:method: GET
:scheme: https
:authority: api.github.com
:path: /zen
```

These are pseudo-header fields, not four lines sent with HTTP/1.1 CRLF framing. `:method` carries
the method, `:scheme` carries `https`, `:authority` carries the authority that HTTP/1.1 represents
with `Host`, and `:path` carries the path and query. HTTP/2 field names are lowercase, and pseudo-
header fields are part of the HTTP/2 header block. See [RFC 9113, Sections 8.2-8.3.1](https://www.rfc-editor.org/rfc/rfc9113.html#section-8.2).

The important distinction is **same semantics, different framing**. `GET` still means the same
thing, `/zen` still identifies the same target, and the response still has a status and fields.
What changes is the binary representation, the stream association, and the way fields and content
are framed. A verbose curl trace may print a human-readable summary of HTTP/2 fields, but that
summary is not the binary wire format. HTTP/2's frame and stream model is described in
[RFC 9113, Sections 2, 4, and 5](https://www.rfc-editor.org/rfc/rfc9113.html#section-2).

The HTTP/1.1 blank-line rule is therefore not a universal definition of HTTP. It is the framing rule
for HTTP/1.1 text messages. HTTP/2 uses frames, flags, and stream state to delimit its messages while
preserving HTTP semantics. See [RFC 9113, Section 8.1](https://www.rfc-editor.org/rfc/rfc9113.html#section-8.1).

## Connection reuse changes the second request

The first request to a host may pay for DNS lookup, a TCP handshake, a TLS handshake, certificate
verification, and ALPN selection. A client can then keep the connection open and send another HTTP
request through it.

Run two transfers in one curl invocation:

```bash
curl -v --http1.1 https://api.github.com/zen https://api.github.com/zen
```

curl fetches multiple URLs sequentially by default and attempts to reuse a compatible connection
within one command invocation. Look for a `*` diagnostic that indicates reuse; the wording differs
between curl versions. If reuse occurs, the second transfer does not need a new TCP or TLS
handshake, so it can begin at the HTTP request stage. ALPN was already decided for that connection.
See curl's [URL and connection reuse documentation](https://curl.se/docs/manpage.html) and
[HTTP/1.1 persistence rules](https://www.rfc-editor.org/rfc/rfc9112.html#section-9.3).

Reuse is an opportunity, not a promise. The server or an intermediary may close the connection, the
response may ask for closure, the host or port may differ, or the client's connection settings may
not be compatible. If curl opens a new connection, read the trace as a fresh pass through DNS, TCP,
TLS, and ALPN.

HTTP/1.1 keeps requests on a persistent connection in sequence for this curl command. HTTP/2 goes
further: several streams can share one TCP and TLS connection, and frames from those streams can be
interleaved. That is why HTTP/2 can reduce the setup cost of many requests without changing what
each HTTP method means. See [RFC 9113, Section 5](https://www.rfc-editor.org/rfc/rfc9113.html#section-5) and
[RFC 9113, Section 9.1.1](https://www.rfc-editor.org/rfc/rfc9113.html#section-9.1.1).

## Practice

Use the same public, read-only endpoint for each exercise. Do not add credentials or use `-k`.
The output is intentionally left for you to inspect; response headers, addresses, and protocol
selection can change over time.

1. Compare HTTP/1.1 with the default negotiation. In a POSIX shell, save only the verbose traces in
   a temporary directory, then compare them:

   ```bash
   trace_dir="$(mktemp -d)"
   curl --no-progress-meter -v --http1.1 https://api.github.com/zen \
     >"${trace_dir}/http1.body" 2>"${trace_dir}/http1.trace"
   curl --no-progress-meter -v https://api.github.com/zen \
     >"${trace_dir}/negotiated.body" 2>"${trace_dir}/negotiated.trace"
   diff -u "${trace_dir}/http1.trace" "${trace_dir}/negotiated.trace"
   ```

   Label each meaningful difference as transport/protocol framing, curl presentation, or a
   server-generated value. In particular, do not infer that a changed date or header value means
   that `GET` changed meaning.

2. Run the two-URL command from the connection reuse section. Find the reuse diagnostic and explain
   which work the second request skipped. Then explain one reason a client might have to open a new
   connection instead.

3. Separate name resolution from the rest of the request. First inspect the address records:

   ```bash
   dig +short A api.github.com
   ```

   Take one address printed by that command and substitute it for `ADDRESS` below:

   ```bash
   curl -v --http1.1 --resolve "api.github.com:443:ADDRESS" https://api.github.com/zen
   ```

   `--resolve` supplies the address for this host and port while leaving the URL hostname intact.
   Identify what stayed the same: the TLS name, certificate check, `Host` field, and HTTP target.
   This is a safe way to see that choosing an address and naming the HTTP authority are different
   decisions. If `dig` is unavailable, skip this exercise rather than replacing `ADDRESS` with a
   guessed value.

4. Compare HTTPS with a plain HTTP request to the reserved example domain:

   ```bash
   curl -v --http1.1 http://example.com/
   ```

   Do not add `-L`; if the server responds with a redirect, curl will not follow it. Identify the
   stages that remain (DNS, TCP, and HTTP) and the HTTPS stages that disappear (TLS, SNI, and ALPN).
   Never send credentials or private data over a plain HTTP URL.

## Check your understanding

Answer these without looking back at the tables:

- In a curl verbose trace, what do `*`, `>`, and `<` mean? Which prefix normally introduces the
  response body, if any?
- Why does HTTP/1.1 require `Host` even though DNS and TCP already selected an IP address?
- What do SNI and `Host` identify, and at which different stages are they used?
- What does ALPN select, when is it selected, and what does `--http1.1` change?
- What exact sequence ends the HTTP/1.1 header section? Why can a recipient not simply read until
  the TCP connection closes when persistent connections are allowed?
- What roles do `Content-Length` and chunked transfer coding play after the blank line?
- Where did `GET`, `/zen`, and `HTTP/1.1` go in the HTTP/2 representation? Why is there no HTTP/2
  text request line on the wire?
- If the second URL in one curl invocation reuses the connection, which setup steps are skipped?
  Why is reuse not guaranteed?

## Next step

You can now read the envelope of an exchange without depending on a framework. The next lesson
stays on the response side of the same `<` lines and treats status codes as a contract with the
caller.

## Primary references

- [RFC 9112: HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112.html), especially message format, request targets, message body length, and connection persistence.
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html), including the `Host` field definition and method semantics.
- [RFC 9113: HTTP/2](https://www.rfc-editor.org/rfc/rfc9113.html), including frames, streams, pseudo-header fields, and connection reuse.
- [RFC 6066, Section 3: Server Name Indication](https://www.rfc-editor.org/rfc/rfc6066.html#section-3).
- [RFC 7301: TLS Application-Layer Protocol Negotiation](https://www.rfc-editor.org/rfc/rfc7301.html).
- [curl man page](https://curl.se/docs/manpage.html), including verbose mode, `--http1.1`, multiple URLs, and `--resolve`.
