## What you will learn

By the end of this lesson, you should be able to:

- Explain the default network Compose creates for a project.
- Use a service name such as `db` for container-to-container connections.
- Distinguish a container port from a port published on the host.
- Diagnose DNS, network membership, and port-mapping problems.
- Choose the correct connection details for an application versus DBeaver on the host.

The `compose-lab` project has two services: Nginx listens on port `80` in `web`, and MySQL listens
on port `3306` in `db`. Those are container ports. They are not automatically ports on your laptop.
Compose's networking model gives the services a private way to find one another without requiring
every service to be exposed to the host.

## The default project network

When a Compose project has no custom network configuration, Compose creates a user-defined bridge
network named from the project, usually `compose-lab_default`, and attaches every service to it. Docker
provides embedded DNS on that network. A service can resolve another service by its service name:

```text
web  ->  db:3306
```

The name `db` resolves to the current container for the `db` service. Do not copy a container IP into
application configuration. A recreated container can receive a different IP while its service name
stays the same. The [Docker networking documentation](https://docs.docker.com/engine/network/) covers
the underlying networks, and the [Compose networking documentation](https://docs.docker.com/compose/how-tos/networking/)
describes the service-name behavior.

A service name is available only to containers attached to a common network. It is not a hostname that
your host operating system or DBeaver can resolve.

## Three different connection points

Keep the caller in mind when writing a connection string:

| Caller | Host name | Port | Why |
| --- | --- | --- | --- |
| An application container in this project | `db` | `3306` | It uses Compose DNS and MySQL's container port. |
| A temporary client container on the project network | `db` | `3306` | It follows the same internal path as an application. |
| DBeaver running on the host | `127.0.0.1` | `3307` | It needs a host-published port mapped to container port `3306`. |

The host port `3307` is only an example chosen to avoid a host MySQL process on `3306`. It does not
change the port on which MySQL listens inside `db`.

The Nginx service in this lab publishes its web port for a browser:

```yaml
services:
  web:
    image: nginx:1.27-alpine
    ports:
      - "127.0.0.1:8080:80"
```

That mapping means `127.0.0.1:8080` on the host forwards to port `80` in `web`. It says nothing about
how another container reaches `web`; another container can use `web:80` on the Compose network.

If you need DBeaver for this lab, add a host publication to the `db` service in `compose.yaml`:

```yaml
services:
  db:
    image: mysql:8.4.11
    ports:
      - "127.0.0.1:3307:3306"
```

Restart or reconcile the project after saving the change:

```bash
docker compose up -d
```

In DBeaver, use host `127.0.0.1`, port `3307`, and the local exercise credentials. Do not use host
`db` in DBeaver. From a container, use `db` and port `3306`. If no host-side tool needs MySQL, omit the
`ports` section entirely. Keeping the database unpublished reduces the number of ways the host can
reach it.

## The `localhost` trap

`localhost` always means "this machine" from the caller's point of view. Inside a container, that
means the current container, not another service and not your laptop.

- From inside `web`, `localhost:80` means Nginx in `web`.
- From inside `db`, `localhost:3306` means MySQL in `db`.
- From a host application, `127.0.0.1:3307` means the host publication that forwards to `db`.
- From an application container, `db:3306` means the MySQL service on the shared Compose network.

Changing `localhost` to `127.0.0.1` does not fix a container-to-container connection. The address is
still loopback for the current container. Use the service name and the internal port instead.

## Test the internal path

Run the project from `compose-lab` and wait for MySQL to finish its initial setup:

```bash
docker compose up -d
docker compose ps
```

The following command starts a short-lived client container from the same MySQL image. It joins the
project network as a one-off `db` service container, then connects to the existing database container
through the service name `db` and internal port `3306`:

```bash
docker compose run --rm --no-deps db \
  sh -c 'mysql --protocol=tcp --host=db --port=3306 --user="$MYSQL_USER" --password="$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SELECT 1;"'
```

The values come from the service environment already used in the lab. This command contains no
password literal. If MySQL is still initializing, wait and run it again. The important part is that
the client does not use the host port `3307` or `localhost`.

You can also ask Compose which host port it published for `web`:

```bash
docker compose port web 80
```

Inspect the project containers and their network attachments:

```bash
docker compose ps
docker network ls --filter name=compose-lab
docker inspect "$(docker compose ps -q web)" \
  --format '{{json .NetworkSettings.Networks}}'
```

If the project was started with `--project-name`, its network will use that project name rather than
`compose-lab_default`. Use the network name shown by `docker network ls` when inspecting it directly:

```bash
docker network inspect compose-lab_default
```

Look for the service containers in the network's `Containers` section. If a service cannot connect,
check these boundaries in order:

1. Is the target service running in `docker compose ps`?
2. Are both containers attached to the same network in `docker network inspect`?
3. Is the caller using the service name and container port rather than a host address and host port?
4. Is the target process listening on the expected port inside its container?
5. Did a recreated service change an IP that someone incorrectly configured statically?

## Practice

1. Add the loopback-only MySQL publication and connect from DBeaver at `127.0.0.1:3307`.
2. Run the one-off client command and confirm that it still uses `db:3306`, not `127.0.0.1:3307`.
3. Remove the MySQL `ports` section and run `docker compose up -d` again.
4. Confirm that the one-off client still reaches MySQL, while DBeaver no longer has a host port to use.
5. Run `docker network inspect compose-lab_default` and identify the `web` and `db` endpoints.

If you add an application later, configure its database host as `db` and its database port as `3306`.
Publish a port only for a deliberate host-side workflow such as a browser or DBeaver.

## Check your understanding

- What network does Compose create by default for `compose-lab`?
- Why should an application use `db:3306` instead of `localhost:3307`?
- Which side of `127.0.0.1:3307:3306` does DBeaver use?
- Does publishing MySQL's port make container-to-container DNS work?
- What evidence would `docker network inspect` provide when a service cannot connect?

## Primary references

- [Networking in Compose](https://docs.docker.com/compose/how-tos/networking/)
- [Docker network drivers](https://docs.docker.com/engine/network/drivers/)
- [Docker networking overview](https://docs.docker.com/engine/network/)
