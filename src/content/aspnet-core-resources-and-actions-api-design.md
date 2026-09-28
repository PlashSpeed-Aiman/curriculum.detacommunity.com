## Why an endpoint is an interface

When a frontend calls an HTTP API, it is depending on a public interface. That interface is not only
the URL. It includes the HTTP method, request headers, request body, response body, status codes,
error shape, authentication rules, and the meaning of each operation.

An endpoint should therefore represent a capability of the application, not a private method that a
particular screen happens to need today. The frontend may change from a server-rendered page to a
single-page application or a mobile client. A well-designed API can survive that change because it is
organized around stable domain concepts rather than component names.

The central question is not, "Which endpoint does this button need?" It is:

> What resource or business operation does the client need to access, and what contract should the
> server own?

## Start with resources

A resource is a useful noun in the domain: a product, customer, order, invoice, or course. A resource
has an identity, a representation, and operations that make sense for its lifecycle.

For a `Product` resource, a basic interface might look like this:

| Purpose | Method and path | Typical result |
| --- | --- | --- |
| List products | `GET /api/products` | A paginated collection |
| Read one product | `GET /api/products/42` | One product or `404 Not Found` |
| Create a product | `POST /api/products` | `201 Created` and the new product |
| Replace a product | `PUT /api/products/42` | `200 OK` or `204 No Content` |
| Partially update a product | `PATCH /api/products/42` | The changed product or `204 No Content` |
| Delete a product | `DELETE /api/products/42` | `204 No Content` |

The path identifies the resource. The method explains the broad operation. The request and response
models explain the data contract. This gives a frontend several useful capabilities without creating
a route for every product screen or interaction.

For collection reads, use query parameters for selection and presentation of the collection:

```http
GET /api/products?search=keyboard&category=office&page=2&pageSize=20&sort=-createdAt
```

The endpoint is still the product collection. The query changes which representation of that
collection is returned; it does not require a new endpoint such as
`/api/products-for-office-search-page`.

## What the API exposes

An HTTP API should expose a contract, not the application's internal object graph. For each operation,
decide deliberately:

- Which resource or operation is being addressed?
- Which inputs are allowed, and which are required?
- Which response DTO represents the result?
- Which status codes describe success, absence, validation failure, or conflict?
- Which authentication and authorization rules apply?
- Which errors can the client safely act on?

For example, a create request should use a request DTO designed for creation:

```json
{
  "name": "Keyboard",
  "description": "A compact mechanical keyboard",
  "price": 79.99
}
```

The response can use a different DTO:

```json
{
  "id": 42,
  "name": "Keyboard",
  "description": "A compact mechanical keyboard",
  "price": 79.99,
  "createdAt": "2026-09-29T10:30:00Z"
}
```

The server might store audit fields, internal flags, database keys, or moderation data that should not
become part of the public contract. Mapping between domain objects and DTOs is a small amount of code
that prevents clients from depending on storage details.

Use a consistent error representation as well. ASP.NET Core can return `ProblemDetails` for errors so a
client can distinguish a malformed request from a missing resource or a business conflict without
parsing arbitrary error strings.

## Resources and actions

CRUD is a good fit when the client is creating, reading, changing, or removing a resource. Some
operations are more naturally expressed as domain actions. An action is appropriate when the request
means, "Perform this business operation," rather than, "Set these fields to these values."

Examples include:

```text
POST /api/orders/123/cancel
POST /api/payments/456/capture
POST /api/invitations/789/accept
POST /api/accounts/42/close
```

These operations may involve validation, authorization, several writes, external services, events, or
state transitions. `cancel` is not merely a request to set an `Order.Status` column to `Cancelled`.
The application may need to check whether the order has shipped, release reserved stock, refund a
payment, and publish an event. Naming the action makes that intent visible and gives the server a
clear place to own the rules.

Do not use `GET` for an action that changes state. `GET` should be safe to repeat and cache. Use
`POST` for a command with side effects unless another method's semantics clearly fit the operation.
Make repeated commands safe where possible, or use an idempotency key for operations such as payment
submission where a network retry must not create a second charge.

An action endpoint should still be a domain capability, not a frontend event. Prefer
`POST /api/orders/123/cancel` over `POST /api/cancel-order-button-clicked`.

## An example shopping flow

Consider the operations in a shopping application:

| Frontend need | API design | Why |
| --- | --- | --- |
| Search the catalog | `GET /api/products?search=keyboard` | A filtered collection read |
| Open a product page | `GET /api/products/42` | A resource read |
| Add an item to a cart | `POST /api/carts/7/items` | Creates a cart-item resource in a cart |
| Change item quantity | `PATCH /api/carts/7/items/18` | Partially changes an existing resource |
| Submit checkout | `POST /api/carts/7/checkout` | A domain operation with several rules and side effects |
| Cancel an order | `POST /api/orders/123/cancel` | A named state transition |

The last two are not just UI actions. Checkout may reserve stock, calculate totals, create a payment
attempt, and create an order. Cancellation may be allowed only before fulfillment. The server should
own these workflows instead of asking the frontend to call several repositories of business behavior
in a particular sequence.

At the same time, adding an item to a cart is naturally modeled as creating a child resource. The
frontend event is "the user clicked Add to cart," but the API contract is about the cart's items. This
distinction keeps the API useful to a mobile client, a batch process, or another future interface.

## Do not create an endpoint for every frontend use case

A frontend use case often combines several API capabilities. A product page might need product
details, reviews, stock information, and related products. That does not automatically mean the
backend needs an endpoint named `/api/product-page`.

Before adding a route, ask what kind of need it represents:

| Need | Usually prefer |
| --- | --- |
| Different fields from one collection | Query parameters or a response projection |
| A filtered or sorted list | `GET` with query parameters |
| Data from several independent resources | Client composition, if latency and consistency are acceptable |
| A server-owned business rule | An application command exposed through a resource action |
| Several writes that must be atomic | One server-side command or action |
| A repeated, expensive read composition | An intentional read model or BFF endpoint |
| Local UI state such as opening a panel | No API endpoint |

Client composition is reasonable when the calls are independent, the client already has the needed
permissions, and a partial result is acceptable. It becomes less attractive when it creates a slow
chain of requests, duplicates orchestration in several clients, or lets clients observe an invalid
intermediate state.

A dedicated read endpoint can be a good design when the server can provide a stable, optimized read
model for several clients. It should be named and documented as a read capability, not created merely
to mirror one component's current data-fetching code. Measure the problem first: endpoint count is
not the only cost, and fewer endpoints are not automatically better.

## A practical decision test

Use these questions before creating a new endpoint:

1. Is this a resource, a collection query, or a domain action?
2. Can an existing resource endpoint express the need with a query, body, or representation change?
3. Does the server own a rule that the client must not implement?
4. Do multiple writes need one authorization decision or one transaction?
5. Would several clients benefit from this capability, or is it specific to one screen?
6. Will client composition create unacceptable latency, duplication, or consistency problems?
7. What is the smallest stable request and response contract?

If the answer is only "the frontend has a new screen," start by reusing existing resources. If the
answer is "the server must enforce this workflow atomically," an action or dedicated application
operation is probably justified.

## Keep the implementation decoupled

The route is only the outer adapter. A command endpoint can follow this path:

```text
HTTP request
    -> controller and request DTO
    -> application command
    -> domain rules
    -> repository or external-service ports
    -> response DTO
    -> JSON response
```

In ASP.NET Core, the controller should bind input, authorize the request, call the application
operation, and translate its result to HTTP. It should not contain the complete checkout workflow or
write SQL. The application layer should not need to know whether the command came from a browser,
mobile app, or a scheduled job.

This is where resource and action design connects to SOLID:

- **Single Responsibility:** the controller translates HTTP; the application service executes the
  use case; infrastructure persists or calls other systems.
- **Open/Closed:** a new client can use the same capability without copying the business workflow.
- **Interface Segregation:** clients and services depend on focused resource or command contracts.
- **Dependency Inversion:** application code depends on ports, not directly on a database client or
  frontend-specific representation.

## Contract tips for fullstack developers

- Name routes after domain resources or meaningful domain actions, not screens, buttons, or component
  names.
- Keep request and response DTOs separate. A client should not be able to change fields merely
  because a database entity contains them.
- Use status codes consistently: `201` for creation, `204` for a successful empty result, `404` for
  absence, `409` for a state conflict, and `422` or `400` for invalid input according to the API's
  chosen convention.
- Document pagination, filtering, sorting, and limits before clients depend on an accidental query
  behavior.
- Treat authorization as part of the endpoint contract. Hiding a button is not authorization.
- Plan for retries. Reads should be safe to repeat, updates should have clear idempotency semantics,
  and important commands may need idempotency keys.
- Prefer one endpoint that owns a complete business operation over a sequence of frontend calls that
  tries to recreate the operation.
- Do not optimize for a theoretical future client by making every endpoint generic. Design a clear
  contract for a real capability and evolve it deliberately.

## Practice

Take a frontend ticket such as "show the order page with a cancel button" and classify each part:

1. Which existing resource reads can provide the page data?
2. Is cancellation a field update or a business action?
3. Which rules must the server enforce?
4. What should happen if the client retries the request?
5. Which status codes and error details should the frontend handle?

The goal is not to minimize endpoint count. The goal is to make every endpoint a clear, reusable
contract owned by the backend domain rather than an accidental reflection of one frontend view.
