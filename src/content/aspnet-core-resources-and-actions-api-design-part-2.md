## The design session

This lesson designs an API from requirements instead of starting with controller names or database
tables. The example is a small shopping application, but the method also works for invoices,
reservations, courses, or support tickets.

The application needs to let a shopper:

- Browse and search products.
- Add products to a cart.
- Change or remove cart items.
- Submit the cart for checkout.
- View an order.
- Cancel an order before it ships.

The API may serve a browser, a mobile application, and a future integration. The design should not
become a list of endpoints for one screen. It should expose capabilities that those clients can use.

## Step 1: write use cases without URLs

Start with what the user or another system needs to accomplish. Do not name an endpoint yet. This
keeps a frontend event such as "click Add to cart" from becoming a premature API design.

| Actor | Intent | State change or read |
| --- | --- | --- |
| Shopper | Find products matching a search | Read a product collection |
| Shopper | Inspect one product | Read one product |
| Shopper | Put a product in a cart | Create or increase a cart item |
| Shopper | Change the quantity | Change a cart item |
| Shopper | Submit the cart | Create an order and start checkout |
| Shopper | See an order | Read one order |
| Shopper | Stop an order before shipment | Transition an order to cancelled |

This list already separates ordinary resource operations from business operations. Searching and
reading are queries. Adding a cart item changes a resource. Checkout and cancellation are workflows
with rules and side effects.

## Step 2: identify resources and lifecycles

Next, identify the domain nouns and how they live:

| Resource | Identity | Important lifecycle |
| --- | --- | --- |
| Product | `productId` | Draft, published, archived |
| Cart | `cartId` | Active, checked out, abandoned |
| Cart item | `cartId` + `itemId` | Added, quantity changed, removed |
| Order | `orderId` | Placed, paid, shipped, cancelled |

These are domain boundaries, not necessarily database tables. A cart item might be a row in a
database, but it is also a resource scoped by a cart. Checkout may create several rows, call a
payment provider, and publish an event. That does not mean every internal step deserves its own public
endpoint.

Ask these questions for each noun:

- Does it have an identity a client needs to refer to?
- Can it be read or changed independently?
- Who owns its lifecycle?
- Which rules must hold when it changes?
- Is it a real domain concept or only a database implementation detail?

## Step 3: sketch the resource endpoints

The first endpoint sketch can use ordinary collection and member conventions:

```text
GET    /api/products
GET    /api/products/{productId}

POST   /api/carts/{cartId}/items
PATCH  /api/carts/{cartId}/items/{itemId}
DELETE /api/carts/{cartId}/items/{itemId}

GET    /api/orders/{orderId}
```

The collection path represents a set of resources. The member path identifies one resource. The HTTP
method supplies the broad operation, while the request and response DTOs define the details.

Product search remains a collection query:

```http
GET /api/products?search=keyboard&category=office&page=1&pageSize=20
```

It does not need a route such as `/api/products-for-the-search-page`. The same collection capability
can serve a search page, a category page, and a mobile list.

Adding an item is also a resource operation:

```http
POST /api/carts/7/items
Content-Type: application/json

{
  "productId": 42,
  "quantity": 1
}
```

The frontend action is a button click, but the server receives a request to create an item in cart 7.
That contract is useful to any client and gives the backend a clear place to check stock, cart
ownership, quantity limits, and product availability.

## Step 4: find the actions

Some use cases are not simple changes to a resource field. They express a business operation:

```text
POST /api/carts/{cartId}/checkout
POST /api/orders/{orderId}/cancel
```

Checkout may validate the cart, calculate totals, reserve stock, create an order, and start payment.
Cancellation may be allowed only while the order is not shipped. These are commands, not ordinary
property assignments.

An action endpoint is clearer than pretending that the client can safely edit a status field:

```http
PATCH /api/orders/123

{
  "status": "cancelled"
}
```

That `PATCH` suggests the client is allowed to choose the next state. It hides questions such as
whether the order has shipped, whether a refund is required, and whether the current user is allowed
to cancel it. The action endpoint makes the intent visible and keeps the transition rules on the
server:

```http
POST /api/orders/123/cancel
```

An action is not a frontend event. Prefer `cancel` over `cancel-button-clicked`, and prefer `checkout`
over `checkout-screen-submit`. The name should describe a domain capability.

## Step 5: design one complete contract

Take checkout as a design exercise. Define the contract before writing the controller:

```http
POST /api/carts/7/checkout
Content-Type: application/json

{
  "paymentMethodId": "pm_123"
}
```

Possible outcomes include:

| Situation | Response | Meaning |
| --- | --- | --- |
| Checkout creates an order | `201 Created` | Return the order or a link to it |
| Cart does not exist or is not owned by the caller | `404` or `403` | Do not reveal more than the policy allows |
| Cart is empty or no longer valid | `409 Conflict` | The current state cannot be checked out |
| Request body is malformed | `400 Bad Request` | The HTTP input cannot be understood |
| Payment requires later processing | `202 Accepted` | Return a status resource or operation location |

The exact status policy should be consistent across the API. The important design question is what
the response promises. If `201 Created` is returned, the client should be able to locate the created
order. If `202 Accepted` is returned, the client needs a way to observe the operation's progress.

The controller can remain small:

```csharp
[HttpPost("{cartId:int}/checkout")]
public async Task<ActionResult<OrderResponse>> Checkout(
    int cartId,
    CheckoutRequest request,
    CancellationToken cancellationToken)
{
    var order = await checkout.ExecuteAsync(
        new CheckoutCommand(cartId, request.PaymentMethodId),
        cancellationToken);

    return CreatedAtAction(nameof(GetOrder), new { orderId = order.Id }, Map(order));
}
```

The example leaves the important work in `checkout.ExecuteAsync`. That operation owns the workflow;
the controller owns route binding and HTTP translation. A real implementation would also map not-found,
conflict, validation, and authorization results to the API's agreed error contract.

## Heuristics for a first design

Rules are useful because they make an API predictable. Treat them as starting points, not laws:

| Question | Good default |
| --- | --- |
| Is this durable domain data? | Model it as a resource with an identity. |
| Is this a list, search, filter, or sort? | Use `GET` on a collection with query parameters. |
| Is this creating a child resource? | `POST` to its collection. |
| Is this replacing a complete representation? | Use `PUT` with clear replacement semantics. |
| Is this changing selected fields? | Use `PATCH` if partial-update semantics are defined. |
| Is this a business transition or command? | Use a named action, usually `POST`. |
| Is the child meaningless outside its parent? | Nest it under the parent. |
| Does the child have its own lifecycle and identity? | Consider a top-level endpoint as well. |
| Is the need only a component interaction? | Keep it in the client; do not add an endpoint. |
| Is the client repeating expensive composition? | Consider a deliberate read model or BFF. |

Use plural collection names such as `/products` and `/orders`. Keep path parameters for identity and
query parameters for selection. Avoid adding verbs to ordinary CRUD paths, but do not force a fake CRUD
shape onto a workflow that has a real domain name.

## Refactor endpoint ideas that are too frontend-shaped

These are common first attempts when an API is designed directly from frontend tickets:

| First idea | Better design | Reason |
| --- | --- | --- |
| `POST /api/add-to-cart-button` | `POST /api/carts/{cartId}/items` | The API models a cart item, not a button. |
| `GET /api/product-page-data` | Product, review, and stock resources or a deliberate read model | A screen is not automatically a domain resource. |
| `GET /api/products-for-search-page` | `GET /api/products?search=...` | Search is a collection query. |
| `POST /api/update-order-status` | `POST /api/orders/{id}/cancel` or another named action | The allowed transition should be explicit. |
| `POST /api/delete-product` | `DELETE /api/products/{id}` | Deletion is a resource operation. |
| `POST /api/refresh-dashboard` | Read existing resources or define a measured read model | Refreshing a screen is not necessarily a server command. |

The better design is not always the smallest number of routes. It is the design that exposes a stable
capability instead of leaking how one frontend currently happens to work.

## When to break the conventions

Breaking a convention is reasonable when the default shape makes the actual capability less clear or
less reliable. Document the reason and keep the exception consistent.

### Use an action for a domain command

`POST /api/orders/{id}/cancel` is a deliberate exception to noun-only URL advice. Cancellation is a
business command with rules and side effects. The action name helps clients understand what the
server accepts.

### Use a read model or BFF for expensive composition

Suppose a mobile home screen always needs account details, unread messages, recommendations, and the
next invoice. If every client reimplements that composition, the result may be slow and inconsistent.
A dedicated read capability can be justified:

```text
GET /api/account-overview
```

This should be a stable read model with an owner and documented contract, not a shortcut for every
new screen. Keep mutations on domain resources or actions rather than placing unrelated writes behind
the overview endpoint.

### Use a job resource for long-running work

An export or report may not finish during one request:

```text
POST /api/exports
202 Accepted
Location: /api/exports/901

GET /api/exports/901
```

The job resource gives the client a stable way to observe progress. It is clearer than holding the
request open or making the client guess when a background operation finished.

### Use bulk operations when bulk is the capability

If a user archives 5,000 records, sending 5,000 individual requests may be the wrong interface. A
bulk command can be appropriate when it has clear authorization, validation, limits, and failure
semantics:

```text
POST /api/products/bulk-archive
```

This is not permission to add a bulk endpoint for every list selection. The server should own a real
bulk capability and explain whether the operation is all-or-nothing or partially successful.

### Preserve an imperfect shape for compatibility

An existing public endpoint may not follow your preferred naming rules. Renaming it can break clients,
bookmarks, integrations, or cached responses. Keep the old contract when necessary, document it, and
use the clearer convention for new work. Consistent evolution is more valuable than a one-time purity
refactor.

## Do not add an endpoint for every frontend use case

When a frontend ticket arrives, classify the need before opening a controller file:

| Frontend request | First question | Likely result |
| --- | --- | --- |
| "Show a filtered list" | Is this selection of an existing collection? | Existing `GET` plus query parameters |
| "Show a screen with five resource types" | Can the client compose safely? | Existing reads or an intentional read model |
| "Run a workflow" | Does the server own rules or a transaction? | Application command and action endpoint |
| "Toggle a panel" | Does server state change? | No endpoint |
| "Save a form" | What resource is being created or changed? | Resource `POST`, `PUT`, or `PATCH` |
| "Perform this operation for many records" | Is bulk processing a real capability? | Deliberate bulk endpoint or queued job |

Client composition is healthy when calls are independent, the client has the right permissions, and
partial results are acceptable. It becomes a backend concern when composition creates unacceptable
latency, duplicates business rules across clients, requires one transaction, or exposes an invalid
intermediate state.

Do not add an endpoint only because a component has a new name. Add one when the server owns a new
capability, a new public representation, or a meaningful performance and consistency boundary.

## Design review worksheet

For a new use case, fill in this table before implementing it:

| Question | Decision |
| --- | --- |
| Actor and intent | Who wants what? |
| Resource or action | What domain concept is being addressed? |
| Method and path | What is the smallest stable URL and HTTP operation? |
| Request contract | Which fields can the client send? |
| Response contract | What representation should the client receive? |
| Invariants | Which rules must the server enforce? |
| Failure cases | Which absence, conflict, validation, and authorization outcomes exist? |
| Retry behavior | Is the operation safe or idempotent to repeat? |
| Composition | Can an existing endpoint solve the need? |
| Exception | If a convention is broken, why is the exception worth it? |

Use the worksheet on the shopping requirements from the beginning of this lesson. Then compare your
design with the resource and action sketch. Differences are useful if you can explain them in terms of
domain ownership, client needs, consistency, or operations.

## The final heuristic

Start boring. Use resources, standard HTTP methods, DTOs, predictable errors, and consistent
collection queries. Introduce an action when the domain has a command. Introduce a read model when
composition has become a measured boundary. Introduce a bulk or asynchronous interface when the
operation itself is bulk or asynchronous.

The rule is not "never break REST conventions." The rule is "do not make the client reconstruct a
business capability from accidental implementation details." A good fullstack API gives the frontend
stable building blocks while keeping business decisions, transactions, and integration work on the
server.
