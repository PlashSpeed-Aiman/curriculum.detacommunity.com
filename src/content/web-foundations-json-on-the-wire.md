## What this lesson covers

An application can hold a rich in-memory object, but an HTTP peer receives only bytes and
metadata. This lesson follows the boundary where that object becomes JSON text, where the text
becomes UTF-8 bytes, and where a client reconstructs a value from those bytes.

By the end, you should be able to inspect a JSON HTTP exchange and explain:

- what `Content-Type` promises and what `Accept` asks for;
- why JSON sent between independent systems should be UTF-8 even though `charset` is not a JSON
  media-type parameter;
- how to serialize large identifiers, timestamps, money, and optional values without silently
  changing their meaning; and
- why a valid body with the wrong header can still break a client.

The outcome is not a framework-specific serializer. It is a wire contract you can read, question,
and test before choosing a library.

## The bytes are not the object

Suppose an application has a profile in memory. That profile may contain a database identifier, a
date object, and a decimal money value. None of those runtime types travel over HTTP as themselves.
The exchange has stages:

```text
in-memory value -> serializer -> JSON text -> UTF-8 encoder -> HTTP body bytes
HTTP body bytes -> UTF-8 decoder -> JSON parser -> client-side value
```

The serializer makes choices. It might turn a date into a string, a decimal into a number, or a
large integer into digits that a receiving language cannot represent exactly. Once the bytes have
crossed the boundary, the recipient cannot recover information that the serializer discarded.

[RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) describes JSON as a text format for serializing
structured data. Its JSON values are objects, arrays, strings, numbers, booleans, and `null`.
Those six categories are a portable syntax, not a complete copy of every application's type
system.

This small browser-console experiment makes the stages visible without contacting a server:

```js
const value = { greeting: "hello", count: 2 };
const jsonText = JSON.stringify(value);
const utf8Bytes = new TextEncoder().encode(jsonText);

({ value, jsonText, utf8Bytes });
```

`value` is an in-memory JavaScript object. `jsonText` is a string containing JSON text. The
`TextEncoder` result is a sequence of UTF-8 bytes. A different language can perform the same
stages with different APIs; the boundary is the same.

Headers are the out-of-band description of those bytes. The body does not contain a reliable
instruction saying, "parse me as JSON." A client may choose to parse a body explicitly, but a
correct HTTP exchange gives the client an accurate media type so generic tooling can make the same
choice.

## Content-Type is a promise; Accept is a request

These headers are easy to conflate because they often appear beside each other. They answer
different questions:

| Header | Question it answers | Direction in this example |
| --- | --- | --- |
| `Content-Type` | What media type is the content in this message? | The JSON body sent in the request |
| `Accept` | Which response media types can the sender receive? | The response the client wants back |

Here is an illustrative request. It is a labeled example of the wire shape, not a captured
response. The formatted body below uses LF line endings and is 158 UTF-8 octets, so the
`Content-Length` field makes the HTTP/1.1 framing explicit.

```http
POST /profiles HTTP/1.1
Host: api.example.test
Content-Type: application/json
Accept: application/json
Content-Length: 158

{
  "id": "9007199254740993",
  "displayName": "Ada",
  "createdAt": "2026-09-10T12:34:56Z",
  "balanceMinor": 1099,
  "currency": "USD",
  "nickname": null
}
```

Read it line by line:

- `Content-Type: application/json` labels the request content after the blank line. It tells the
  recipient how the sender intends those bytes to be interpreted; it does not convert a non-JSON
  body into JSON.
- `Accept: application/json` asks for a response represented as JSON. It does not label the request
  body.
- The JSON document itself carries conventions for the identifier, timestamp, money, and nullable
  value. JSON syntax alone does not explain all of those conventions.

The response has its own content metadata. An illustrative successful response might begin like
this:

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "9007199254740993",
  "displayName": "Ada"
}
```

`Content-Type` can therefore describe content in either direction: request or response. `Accept`
is normally a request header that influences the representation selected for the response. A GET
with no body usually needs no request `Content-Type`; adding it does not mean "please send JSON."
Use `Accept` for that preference.

A server may honor `Accept`, choose a fallback representation, or report that it cannot provide an
acceptable representation. Do not assume that sending `Accept: application/xml` guarantees a
`406 Not Acceptable`, and do not assume that a server returning JSON proves it honored the header.
The response's status and `Content-Type` are the evidence for that particular exchange.

## UTF-8 is required; charset is not a JSON switch

[RFC 8259, section 8.1](https://www.rfc-editor.org/rfc/rfc8259#section-8.1) says that JSON text
exchanged between systems that are not part of a closed ecosystem **MUST** be encoded using UTF-8.
That is a rule about the bytes, not a side effect of adding a parameter to a header.

The `application/json` media-type registration defines no `charset` parameter. RFC 8259, section
11, says that adding one has no effect on compliant recipients. These two headers therefore do not
mean different JSON encodings:

- `Content-Type: application/json` is the direct media type.
- `Content-Type: application/json; charset=utf-8` is commonly emitted but redundant. It does not
  make an otherwise non-UTF-8 body valid.

A parameter claiming another charset is not a valid way to opt an open JSON exchange into another
encoding. If the actual bytes are not UTF-8, the sender has violated the interoperability rule;
the recipient may reject the content, decode it incorrectly, or apply an implementation-specific
workaround. Do not use the parameter as a substitute for producing UTF-8 bytes.

Do not confuse character encoding with content coding. If a server compresses the representation,
`Content-Encoding` describes that additional coding while `Content-Type` remains the media type of
the underlying representation, such as `application/json`.

## Four serialization gaps

JSON has no native date, decimal, or absent-member type, and its number syntax does not guarantee
that every consumer can preserve every integer. The following table is a serialization catalogue:

| Gap | What breaks | Wire convention |
| --- | --- | --- |
| Integer identifiers beyond `2^53 - 1` | A client using IEEE 754 binary64 numbers can round a 64-bit identifier and address the wrong record. | Send the identifier as a decimal string, such as `"9007199254740993"`. |
| Dates and timestamps | JSON has strings, not date/time values; an unqualified string leaves timezone and parsing rules to guesswork. | Use an RFC 3339 timestamp with `Z` or a numeric offset, such as `"2026-09-10T12:34:56Z"`. |
| Decimal money | A JSON number does not promise decimal arithmetic, and binary floating-point values cannot represent many decimal fractions exactly. | Use currency-aware minor units, or a decimal string with a documented scale and rounding rule. |
| Absent versus `null` | An omitted member and a member whose value is `null` are different JSON documents, but JSON does not assign them application-level meaning. | Define whether omission means no change or unavailable, and whether `null` means clear or known empty. |

The table is a contract-design guide, not a claim that every API must use the same field names.
What matters is that both sides agree before parsing values into narrower types.

### Large integer identifiers

The number grammar can contain many digits, but a JSON parser is allowed to limit numeric range and
precision. RFC 8259, section 6, notes that exact agreement is expected for integers in the range
`[-(2^53) + 1, (2^53) - 1]` when implementations use IEEE 754 binary64 numbers. The positive upper
bound is `9007199254740991`.

This is a precision problem, not merely a display problem. If a server sends this as a JSON number:

```json
{
  "id": 9007199254740993
}
```

a JavaScript client parses it through `Number`, which cannot distinguish every integer above the
safe-integer boundary. The server may have emitted the right digits, yet the client can hold a
different identifier. Sending the digits as a string moves the value into a type whose contract is
"identifier text":

```json
{
  "id": "9007199254740993"
}
```

The string is not a workaround that every client must convert to a floating-point number. Keep it
as a string, or convert it only with an explicitly chosen arbitrary-precision type and validation.
The convention must be consistent for the field; alternating between number and string makes
client code guess.

Use the browser console to inspect the difference. This parses literal strings locally; it does not
claim to show output from a network request:

```js
const numericWireValue = '{"id":9007199254740993}';
const stringWireValue = '{"id":"9007199254740993"}';

const numericRecord = JSON.parse(numericWireValue);
const stringRecord = JSON.parse(stringWireValue);

({
  numericId: numericRecord.id,
  stringId: stringRecord.id,
  numericIsSafe: Number.isSafeInteger(numericRecord.id),
});
```

Inspect the types, digits, and `numericIsSafe` value. The important question is not whether a
particular console prints a rounded number; it is whether the receiving type can preserve the
identifier exactly.

### Dates and timestamps

An application date object does not survive JSON as a date object. It becomes a string, so the
contract must specify what that string means. [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339)
defines an Internet date/time format that is a profile of ISO 8601. A timestamp has a stated
relationship to UTC, expressed as `Z` or a numeric offset:

```json
{
  "createdAt": "2026-09-10T12:34:56Z",
  "publishedAt": "2026-09-10T08:34:56-04:00"
}
```

These two examples identify instants. A field that represents a calendar date, such as a birthday
or a billing date, may intentionally use a date-only convention like `"2026-09-10"`; that is not
the same thing as an instant and should be documented as such. Never make a client infer a local
timezone from a timestamp that has no offset.

### Decimal money

The JSON spelling `10.99` contains decimal digits, but a client may parse it into a binary
floating-point type. Arithmetic on that type can produce a value that is not the exact decimal
amount a ledger needs. A money contract should carry the currency and choose one exact convention.

One option is an integer in the currency's minor unit:

```json
{
  "amountMinor": 1099,
  "currency": "USD"
}
```

This requires the contract to define the scale for each currency; not every currency uses two
fractional digits. Another option is a decimal string:

```json
{
  "amount": "10.99",
  "currency": "USD"
}
```

For the string form, document accepted digits, scale, sign, and rounding behavior. Do not assume
that a JSON number is a portable decimal type just because its source code contains a decimal
point.

### Absent versus `null`

These are different JSON documents:

```json
{}
```

```json
{
  "nickname": null
}
```

The first has no `nickname` member. The second has a member whose value is the JSON literal `null`.
JSON defines the syntax but not the application meaning. In a partial-update contract, a common
choice is to make omission mean "leave the existing value alone" and `null` mean "clear it". A
different API may use `null` to mean "known but unavailable" and omission to mean "not included in
this representation." Both choices can be valid; an undocumented choice is the bug.

The distinction also matters in responses. A client should not silently convert an omitted optional
field into `null` unless the API contract says that the two states are equivalent.

## When the header lies

`Content-Type` is metadata. It does not rewrite the body, and a JSON parser does not prove that the
HTTP header was correct. A client that uses the header to select a parser, renderer, cache policy,
or security behavior can therefore fail even when the bytes themselves look familiar.

| Body actually contains | Header says | Possible result |
| --- | --- | --- |
| Valid JSON | `text/html` | A browser or generic client may treat it as HTML or plain text instead of selecting a JSON parser. A caller that explicitly parses JSON may still succeed, but the exchange is mislabeled. |
| HTML gateway error | `application/json` | A client that follows the header and parses JSON can fail with a syntax error, hiding the useful fact that an intermediary returned an HTML error page. |
| JSON | `application/json` | The media-type contract is coherent, but the body can still be malformed or violate the application's field-level schema. |

For example, this deliberately illustrative response has a wrong header. It is not a captured
server result:

```http
HTTP/1.1 502 Bad Gateway
Content-Type: application/json

<!doctype html>
<html>
  <body>upstream unavailable</body>
</html>
```

An HTTP status, a media type, and a body answer different questions. A `502` tells generic HTTP
software that a gateway failed. The content type tells a recipient how to interpret the response
content. The body may carry details, but it cannot repair a contradictory header.

For machine-readable HTTP errors, [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) defines
Problem Details. Its JSON serialization uses `application/problem+json`. That media type is an
intentional JSON error representation; it is not permission to label an HTML error page as JSON.
When a client supports it, it can list `application/problem+json` in `Accept` alongside the normal
success representation.

## Practice

These exercises are designed to observe your own run rather than memorize a response transcript.
Use read-only requests, do not add credentials, and do not send state-changing methods to an
endpoint you do not control.

1. Inspect a public JSON response with `curl`. The request is a read-only GET; the result can change
   or be rate-limited, so record only what your run actually shows:

   ```bash
   curl -i --get \
     -H 'Accept: application/json' \
     -H 'User-Agent: curriculum-json-lesson' \
     'https://api.github.com/repos/octocat/Hello-World'
   ```

   Find the response `Content-Type` and read it exactly. Does it include a `charset` parameter?
   Inspect the body without assuming that its current fields are permanent. Explain which bytes
   `Content-Type` describes and which representation `Accept` requested.

2. Repeat the same safe GET with a deliberately different response preference:

   ```bash
   curl -i --get \
     -H 'Accept: application/xml' \
     -H 'User-Agent: curriculum-json-lesson' \
     'https://api.github.com/repos/octocat/Hello-World'
   ```

   Record the status and response `Content-Type` from this run. A server may return JSON anyway,
   choose another representation, or reject the preference; explain what the observed headers say
   instead of predicting a universal result.

3. In a browser console, run the large-identifier example from this lesson. Explain why the string
   form is safer for an identifier, even if the server's source language has a 64-bit integer type.
   Then change the example to an identifier at or below `9007199254740991` and state which part of
   the risk has changed.

4. Compare omission and `null` using local serialization only:

   ```js
   const omitted = {};
   const explicitNull = { nickname: null };
   const undefinedProperty = { nickname: undefined };

   [
     JSON.stringify(omitted),
     JSON.stringify(explicitNull),
     JSON.stringify(undefinedProperty),
   ];
   ```

   Read the three JSON strings. Decide which wire form should mean "leave unchanged," which should
   mean "clear," and which should be rejected for your chosen update contract. Remember that this
   is JavaScript's serialization behavior; the API contract still has to define the meaning.

5. Choose one object from a project you can inspect, or use the profile example above. Make a
   four-row serialization table for its identifiers, dates, money, and optional fields. For each
   row, write the exact JSON spelling, the receiving type, and the rule that prevents loss of
   meaning. If you cannot write the rule in one sentence, the wire contract is not finished.

## Check your understanding

- In the labeled POST request, which header describes the bytes after the blank line, and which
  header describes the response the client can receive?
- Why does `Content-Type: application/json; charset=utf-8` not cause a body to become UTF-8?
- What is the `2^53 - 1` boundary warning about, and why does a string identifier avoid it?
- What information must a timestamp include to identify an instant, and how is that different from
  a calendar date?
- Why are minor units or a decimal string safer than a floating-point JSON number for money?
- What are the wire-level differences between an omitted member and `"nickname": null`? Who gives
  those differences their application meaning?
- If a body is valid JSON but the header says `text/html`, why might one client parse it while
  another renders or rejects it?
- What does `application/problem+json` identify, and why is it still not proof that the body is
  valid JSON?

## Next step

You can now inspect the bytes and metadata that cross an HTTP boundary without mistaking them for
in-memory objects. Carry that discipline into the next module, where a framework will help implement
the same contracts without hiding what the client actually receives.

## Primary references

- [RFC 8259: The JSON Data Interchange Format](https://www.rfc-editor.org/rfc/rfc8259), especially
  sections [3 (values)](https://www.rfc-editor.org/rfc/rfc8259#section-3),
  [6 (numbers)](https://www.rfc-editor.org/rfc/rfc8259#section-6),
  [8.1 (UTF-8)](https://www.rfc-editor.org/rfc/rfc8259#section-8.1), and
  [11 (the `application/json` registration)](https://www.rfc-editor.org/rfc/rfc8259#section-11).
- [RFC 3339: Date and Time on the Internet: Timestamps](https://www.rfc-editor.org/rfc/rfc3339),
  especially [section 5.6 (Internet Date/Time Format)](https://www.rfc-editor.org/rfc/rfc3339#section-5.6).
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html), especially
  [section 8.3 (`Content-Type`)](https://www.rfc-editor.org/rfc/rfc9110.html#section-8.3) and
  [section 12.5.1 (`Accept`)](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.1).
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html), which
  defines the `application/problem+json` error representation and obsoletes RFC 7807.
