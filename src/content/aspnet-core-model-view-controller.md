## The problem MVC is trying to solve

As an application grows, one request can easily become responsible for too many things. A single
class might read HTTP input, query a database, apply business rules, and build HTML. That code may
work at first, but each change becomes risky because unrelated concerns are tied together.

Model-View-Controller (MVC) is a way to give those concerns clearer homes. It separates the work of
receiving a request, deciding what the application should do, and presenting the result. The goal is
not to create three folders for their own sake. The goal is to make changes travel through smaller,
understandable boundaries.

## The three parts

### Model

The **Model** represents the data and behavior the application needs. This can include domain
objects, validation rules, application services, and the data passed to a view. A model is not
automatically a database table. In a well-separated application, the domain model does not need to
know whether its data came from MySQL, a file, or an external service.

### View

The **View** is the representation returned to the client. In a server-rendered application, this
may be a Razor view. In a Web API, the equivalent is usually a response DTO that ASP.NET Core
serializes to JSON. The DTO describes the API contract without exposing database details by accident.

The representation should not decide how products are priced or open a database connection. It should
receive the data it needs and format that data for its consumer.

### Controller

The **Controller** is the HTTP-facing coordinator. It receives a request, uses an application
service or model to perform the work, and chooses a response. It knows about routes, status codes,
model binding, and the next step in the request. It should not become the place where every business
rule lives.

A Web API request can be described like this:

```text
GET /api/products/42
        |
        v
ProductsController.GetById(42)
        |
        v
IProductCatalog -> ProductResponse
        |
        v
JSON response -> API client
```

The controller coordinates this flow. In a Web API, the "view" is the response representation and
the client may be a browser application, mobile app, or another service. Each part has a smaller job
than a single class that does everything.

## MVC in an ASP.NET Core Web API

For backend work, the three parts usually look like this:

- **Controller:** owns routes, model binding, authentication or authorization boundaries, and HTTP
  status codes.
- **Model and application layer:** owns the use case, domain rules, and access to the data needed by
  that use case.
- **View or representation:** owns the public response shape, such as a JSON DTO.

An ASP.NET Core API controller can receive its dependencies through constructor injection:

```csharp
public sealed record ProductResponse(int Id, string Name, string Description);

public interface IProductCatalog
{
    Task<Product?> FindAsync(int id);
}

[ApiController]
[Route("api/products")]
public sealed class ProductsController : ControllerBase
{
    private readonly IProductCatalog catalog;

    public ProductsController(IProductCatalog catalog)
    {
        this.catalog = catalog;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductResponse>> GetById(int id)
    {
        var product = await catalog.FindAsync(id);

        if (product is null)
        {
            return NotFound();
        }

        var response = new ProductResponse(product.Id, product.Name, product.Description);
        return Ok(response);
    }
}
```

The controller handles HTTP-specific work: route matching, the `id` parameter, and the `200` or `404`
status. The catalog handles the application operation. `ProductResponse` defines the public response
contract. ASP.NET Core's JSON formatter turns that response into something like:

```json
{
  "id": 42,
  "name": "Keyboard",
  "description": "A compact mechanical keyboard"
}
```

The controller does not need to know whether `IProductCatalog` uses Entity Framework Core, a SQL query,
or an in-memory collection. It also does not return the database entity directly. Mapping to a response
DTO keeps persistence fields and API fields from becoming accidentally coupled.

If an application also serves server-rendered HTML, an MVC controller can return a Razor view instead
of JSON. That is one presentation option, not the center of the backend design. For a Web API, think of
the response DTO and JSON serialization as the View side of MVC.

## How this creates decoupling

Decoupling means that one part of the system can change without forcing unrelated parts to change
with it. MVC helps by giving dependencies a direction and by keeping framework details near the
edge of the application.

- An **API response can change** through an explicit DTO mapping without exposing domain or database
  objects to clients.
- A **server-rendered view can change** from one HTML layout to another without changing the pricing
  or catalog rules.
- A **storage implementation can change** from a fake collection to MySQL without changing the
  controller's request flow.
- A **controller can be tested** with a fake `IProductCatalog`, without starting a web server or a
  real database.
- **Application rules can be tested** without constructing an HTTP request or rendering HTML.
- An **API representation can change** from a domain object to a response DTO without making the
  domain object responsible for JSON details.

This does not mean the parts have no dependencies. The controller still depends on a catalog
abstraction, and the response representation still depends on its DTO. The useful question is: *which
direction does the dependency point, and is that direction stable?* A controller depending on a small
interface is easier to replace than a controller depending directly on a particular database client.

## How MVC supports SOLID

SOLID is a set of design principles, not a feature that MVC switches on. MVC creates boundaries where
those principles can be applied. It especially encourages the Single Responsibility Principle and
Dependency Inversion, while making the other principles easier to see.

### Single Responsibility Principle

Each class should have one reason to change.

- A controller changes when the HTTP contract or request flow changes.
- A catalog or application service changes when the application operation changes.
- A repository changes when persistence changes.
- A response DTO or serializer changes when the external representation changes.

MVC does not guarantee this separation. A controller that validates input, calculates prices, builds
SQL, and writes HTML is still a controller with too many responsibilities. When a controller grows,
move application behavior into a focused service rather than adding more private methods to it.

### Open/Closed Principle

Software should be open for extension and closed for unnecessary modification. If the catalog is
behind `IProductCatalog`, a new implementation can serve test data or another storage system without
rewriting the controller. A new response format can use the same application operation with a
different presentation adapter.

This does not mean never edit existing code. It means stable responsibilities should not need to be
rewritten every time a new adapter or representation is added.

### Liskov Substitution Principle

An implementation should honor the promises of the abstraction it replaces. Every
`IProductCatalog` implementation should accept the same valid inputs and provide the same meaningful
result or failure behavior. A fake used in a test should not behave in a surprising way that the real
catalog would never allow.

### Interface Segregation Principle

Clients should not be forced to depend on methods they do not use. Instead of giving every controller
a large `IProductService` with dozens of unrelated operations, define smaller interfaces around
actual needs, such as `IProductReader` or `IProductPriceCalculator`.

Smaller interfaces make controllers easier to understand and test. They also make it clearer which
capability a class really requires.

### Dependency Inversion Principle

High-level policy should not depend directly on low-level details. Both should depend on abstractions.
In the example, `ProductsController` depends on `IProductCatalog`, not on a concrete database
context. The database implementation can depend on the same interface or on a lower-level port
defined by the application.

ASP.NET Core dependency injection connects the abstractions to their implementations in the
composition root. That keeps framework and infrastructure decisions out of the controller's main
job.

## What MVC is not

MVC is not a rule that every class must be named `Model`, `View`, or `Controller`. It is also not a
license to put all non-UI code into a folder named `Models`. A useful ASP.NET Core application often
has additional boundaries:

```text
Controllers      HTTP coordination
Application      Use cases and application services
Domain           Business rules and domain objects
Infrastructure   Database and external-service adapters
Contracts        Request and response DTOs
Presentation     JSON serialization or optional HTML views
```

The names can vary. What matters is that responsibilities and dependency directions remain clear.

## A small exercise

Choose one endpoint in an ASP.NET Core application and write down its path through the system:

1. Which controller action receives the request?
2. Which application operation does it need?
3. Which data shape does the view or API response require?
4. Which dependency could be replaced in a test?

If the controller directly contains SQL, business rules, and presentation decisions, identify one
responsibility to move behind a small interface. That first boundary is usually more valuable than
creating a large architecture all at once.

## Discussion: how and why CRUD endpoints stay decoupled

CRUD means **create, read, update, and delete**. It is useful vocabulary for describing what an API
does, but CRUD is not the architecture by itself. The controller still needs to translate HTTP into an
application operation, and the application still needs to protect its business rules.

Imagine an API for `Product` resources:

| Operation | Endpoint | Request body | Typical success response |
| --- | --- | --- | --- |
| Create | `POST /api/products` | `CreateProductRequest` | `201 Created` with the new product |
| Read one | `GET /api/products/42` | None | `200 OK` or `404 Not Found` |
| Read many | `GET /api/products` | Query parameters | `200 OK` with a collection |
| Update | `PUT /api/products/42` | `UpdateProductRequest` | `204 No Content` or the updated product |
| Delete | `DELETE /api/products/42` | None | `204 No Content` or `404 Not Found` |

### Create

The client sends data in a request model. The controller accepts the request, then asks the
application layer to create the product:

```http
POST /api/products
Content-Type: application/json

{
  "name": "Keyboard",
  "description": "A compact mechanical keyboard"
}
```

If the operation succeeds, `201 Created` tells the client that a new resource exists. A `Location`
header can point to `GET /api/products/42`, and the response body can contain the public
`ProductResponse` DTO. The controller should not decide whether the name is unique or whether the
price is valid. Those are application or domain rules.

### Read

Reading a collection and reading one resource are separate use cases:

```http
GET /api/products
```

```http
GET /api/products/42
```

The controller handles route and query-string binding. The application layer handles filtering or
retrieval, and the controller maps the result to response DTOs. If product `42` does not exist,
returning `404 Not Found` is clearer than returning an empty product object or a successful response
with an error message hidden inside it.

### Update

`PUT` commonly means replacing the resource at a known identifier:

```http
PUT /api/products/42
Content-Type: application/json

{
  "name": "Quiet Keyboard",
  "description": "A compact mechanical keyboard with silent switches"
}
```

The controller passes the identifier and update request to an application operation. The service can
check rules such as ownership, uniqueness, or whether the product is still editable. The repository
then persists the change. For partial updates, an API may choose `PATCH`, but it should document which
fields can change and how missing fields differ from fields explicitly set to `null`.

### Delete

Deleting a resource has a small HTTP surface:

```http
DELETE /api/products/42
```

The application layer still decides whether deletion is allowed. For example, a product attached to
an existing order might be archived instead of physically deleted. That decision belongs in the
application or domain layer, not in the controller just because the route is called `DELETE`.

### The decoupled path

Each CRUD action can follow the same direction:

```text
HTTP request
    -> controller and request DTO
    -> application operation
    -> domain rules and repository
    -> response DTO
    -> JSON response
```

This structure explains the "how" and the "why":

- The **controller** changes when the HTTP contract changes. It can return `400`, `404`, `409`, or
  `201` without knowing how data is stored.
- The **application service** changes when the use case changes. It can be tested without an HTTP
  server and can enforce rules shared by several endpoints.
- The **domain** changes when a business rule changes. It does not need to know about JSON, routes, or
  ASP.NET Core attributes.
- The **repository or infrastructure adapter** changes when MySQL, Entity Framework Core, or an
  external service changes.
- The **request and response DTOs** change when the public API contract changes. They prevent clients
  from depending directly on internal database entities.

That is MVC applied to backend development: the controller is the boundary, not the whole
application. Keeping the boundary thin makes each CRUD endpoint easier to reason about, replace, and
test while leaving the important behavior in code that is independent of HTTP.

## Next step

Once the responsibilities are separated, the next question is how ASP.NET Core receives a request,
selects an action, binds input, and produces a response. That request pipeline gives the MVC pieces
their place in a running application.
