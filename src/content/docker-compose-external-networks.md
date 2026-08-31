## What you will learn

By the end of this lesson, you should be able to:

- Create a Docker network before a Compose project uses it.
- Declare that network with `external: true` and an explicit `name`.
- Attach services from two independent Compose projects to the same network.
- Use service-name DNS across those projects without publishing another host port.
- Explain who owns the external network and when it is safe to remove it.

Each Compose project normally gets its own default network. That isolation is useful, but sometimes a
local system is split into separate Compose projects: an application stack in one directory and a
supporting tool or service in another. An external network is a deliberate connection between those
projects. It is not a network that Compose is allowed to create or delete on your behalf.

## Create the network first

Create the shared network outside Compose, before starting either project:

```bash
docker network create --driver bridge curriculum-shared
docker network inspect curriculum-shared
```

If `curriculum-shared` already exists, inspect it and reuse it rather than creating a second network.
The network name is intentionally explicit so both Compose files can refer to the same Docker object.

The [Docker network documentation](https://docs.docker.com/engine/network/) explains the network
object; the [Compose networks reference](https://docs.docker.com/reference/compose-file/networks/)
defines the Compose declaration.

## Attach the first Compose project

In `compose-lab/compose.yaml`, retain the existing image, environment, volume, and healthcheck settings
and add these network attachments:

```yaml
services:
  web:
    networks:
      - default
      - shared
  db:
    networks:
      - default
      - shared

networks:
  default: {}
  shared:
    external: true
    name: curriculum-shared
```

The `default` entry keeps the normal project network. The `shared` entry refers to the already-created
Docker network by its exact name. `external: true` tells Compose not to create that network and not to
remove it when the project is taken down. The `name` field prevents Compose from prefixing the network
with the project name.

Only services that need cross-project communication should join `shared`. In this lab both `web` and
`db` join it so the discovery checks can target either service. In a real system, exposing a database to
every participant in a shared network may be unnecessary; attach only the narrow set of services that
need the connection.

Start the first project from `compose-lab`:

```bash
docker compose config --quiet
docker compose up -d
docker network inspect curriculum-shared
```

The `Containers` section should include the `web` and `db` containers as endpoints. The project still
has its own default network as well, so services can use either the project-local path or the shared
path according to their attachment.

## Attach a second Compose project

Create a separate directory for a one-off network probe. It has its own project identity and joins the
same external network as `compose-lab`:

```bash
mkdir -p ../compose-client
cd ../compose-client
```

Create `compose.yaml` there:

```yaml
services:
  probe:
    image: busybox:1.36
    command: ["sh", "-c", "while true; do sleep 3600; done"]
    networks:
      - shared

networks:
  shared:
    external: true
    name: curriculum-shared
```

Start the second project:

```bash
docker compose up -d
docker compose ps
```

The `probe` container can now resolve service names registered by the first project on
`curriculum-shared`:

```bash
docker compose exec probe nslookup web
docker compose exec probe nslookup db
docker compose exec probe wget -qO- http://web:80
```

The last command fetches the Nginx response through `web:80`. It does not use the host publication
`127.0.0.1:8080` from the first project. The second project has no `ports` entry at all. This is the
important boundary: app-to-app traffic on a common Docker network uses the destination service name
and its container port; it does not require a host-published port.

The `db` name resolves only because the `db` service was also attached to `curriculum-shared`. If a
service is attached only to its project default network, containers in the other project cannot use its
service name. A service must also listen on an address reachable from the network. Nginx does this by
default; an application that binds only to `127.0.0.1` inside its container would not accept traffic
from another container and should usually bind to `0.0.0.0` inside the container instead.

## External network ownership

If you start a Compose project before creating the network, Compose should fail with an external-network
not-found error. That is intentional: Compose cannot guess whether it is safe to create a shared
network or what other projects depend on it.

The network also remains after either project is stopped. Run `docker compose down` once in
`compose-client`, then return to `compose-lab` and run it there as well before inspecting the network:

```bash
docker compose down
cd ../compose-lab
docker compose down
docker network inspect curriculum-shared
```

Compose removes the containers and project-owned default networks, but it does not delete the external
`curriculum-shared` network. The network is owned by the Docker administrator or the setup process that
created it. Remove it manually only after every dependent project is disconnected and the network is no
longer needed:

```bash
docker network rm curriculum-shared
```

That final command is deliberately a Docker network operation, not part of `docker compose down`. It is
disruptive to every attached project, so inspect first and treat it as an explicit cleanup decision.

## Service names across projects

On a shared user-defined network, Compose provides service-name aliases for attached services. Use
`web`, `db`, or another stable service name rather than a container IP or a generated container name.
If two projects publish the same service name on one shared network, the name becomes ambiguous for
callers. Choose distinct service names or define deliberate network aliases when the topology requires
them. Do not solve the problem by hard-coding `container_name`.

The external network is a connectivity boundary, not an authorization policy. Every attached service
can potentially reach the ports exposed by other attached containers. Keep the membership small, avoid
publishing sensitive services unnecessarily, and still enforce authentication at the service protocol.

## Practice

1. Create `curriculum-shared` before starting either project and verify it with `docker network inspect`.
2. Attach `web` and `db` from `compose-lab` to the external network.
3. Start the `compose-client` probe and resolve both `web` and `db` by service name.
4. Remove the `ports` entry from `web` in `compose-lab`, reconcile that project, and run `wget -qO- http://web:80` again from `probe`.
5. Remove `db` from the shared network list in `compose-lab`, run `docker compose up -d` there to reconcile
   the change, and confirm from `compose-client` that `probe` can no longer resolve `db` while it can still
   resolve `web`.
6. Stop both projects and decide whether the externally managed network should remain for another local experiment.

Do not run the final `docker network rm` command while either project still depends on the network.

## Check your understanding

- Why must `curriculum-shared` exist before a Compose file with `external: true` starts?
- What does `name: curriculum-shared` control?
- Which network does the `probe` container join, and why is that enough for this test?
- Why can `probe` request `http://web:80` without a published host port?
- What happens to the external network when both projects run `docker compose down`?
- Why should only selected services join a shared external network?

## Primary references

- [Compose networking](https://docs.docker.com/compose/how-tos/networking/)
- [Compose networks reference](https://docs.docker.com/reference/compose-file/networks/)
- [Docker network create](https://docs.docker.com/reference/cli/docker/network/create/)
- [Docker network inspect](https://docs.docker.com/reference/cli/docker/network/inspect/)
