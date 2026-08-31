## What you will learn

By the end of this lesson, you should be able to:

- Describe Docker Compose as a declarative model for a group of services.
- Choose between using a pre-built `image` and building an image with `build`.
- Create a small Nginx and MySQL project in `compose.yaml`.
- Use `up`, `ps`, `logs`, `exec`, `config`, and `down` to operate the project.

Compose is useful when one container is no longer the whole development environment. Instead of
remembering several long `docker run` commands, you describe the desired services and their
relationships in one file. The [Docker Compose documentation](https://docs.docker.com/compose/) calls
this a declarative model: you state what the project should look like, and Compose creates or updates
the resources needed to approach that state.

## A project is a group of services

The service name is the identity used inside the Compose network. This project has a `web` service and
a `db` service:

```yaml
services:
  web:
    image: nginx:1.27-alpine
    ports:
      - "127.0.0.1:8080:80"
  db:
    image: mysql:8.4.11
    environment:
      MYSQL_ROOT_PASSWORD: "local-root-password"
      MYSQL_DATABASE: curriculum
      MYSQL_USER: curriculum_app
      MYSQL_PASSWORD: "local-app-password"
```

These are fake credentials for a disposable local exercise. Do not replace them with a real password
that is reused anywhere else, and do not commit local credential files. The database has no published
host port in this first version. A container on the Compose network can use `db:3306`; a host program
such as DBeaver cannot connect until a loopback-only host port is added. That distinction is the focus
of the networking lesson.

Save the file as `compose.yaml` in the `compose-lab` directory used in the previous lesson. This file
does not include a top-level `version:` field. `compose.yaml` is discovered automatically when commands
run from the project directory.

## `image` versus `build`

An `image` names a packaged image that Docker can pull or reuse from its local image store. The example
uses the official Nginx image and the version-tagged official MySQL image `mysql:8.4.11`.

Use `build` when the service should be created from a Dockerfile in your project:

```yaml
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "127.0.0.1:8080:80"
```

`context` is the directory sent to the builder, and `dockerfile` selects the recipe within that
context. For a service with an application Dockerfile, `build` makes local source changes buildable.
For a service that already has the image you need, `image` is simpler. Do not add a `build` section to
this Nginx example unless you have also created the referenced Dockerfile. A file that declares a
nonexistent build context is not a runnable project.

## Project resources

When you run the file, Compose creates resources in the context of a project:

- One container for each service, normally named with the project and service names.
- A default user-defined network so services in the same project can communicate.
- Any named volumes declared by the file. This first file declares none. The MySQL image declares
  `/var/lib/mysql` as a volume, so Docker uses an anonymous volume, but the Compose file does not give
  that volume a stable application name. `docker compose down` leaves this anonymous volume by default,
  but a later `up` does not have a stable name to reuse and can create another anonymous volume. The
  next lesson declares an intentional named volume for the database.

The project name normally comes from the directory name. You can set it explicitly with the global
`--project-name` option when two copies of a lab need to coexist. Avoid hard-coding `container_name` in
normal Compose files; it reduces the ability to scale or run separate project copies and is not needed
for service discovery.

## Operate the project

Run these commands from `compose-lab`:

```bash
docker compose config
docker compose up -d
docker compose ps
```

`config` parses the file and prints the effective model. `up -d` creates or recreates what changed and
leaves the services running in the background. `ps` shows the service containers and their current
state. The first MySQL start initializes files and may take a little time; `Up` means its main process
is running, not that every database operation will succeed yet.

Read logs for one service or follow them while investigating startup:

```bash
docker compose logs db
docker compose logs --follow web
```

Press `Ctrl+C` to stop following logs. It does not stop the service. Logs are a diagnostic view, not a
readiness check; the configuration and readiness lesson adds a healthcheck for MySQL.

`exec` runs a command in an already running service container. Nginx can show its active configuration
without opening a shell:

```bash
docker compose exec web nginx -T
```

After MySQL has completed initialization, you can open its client inside the `db` container. The
`--password` option with no value prompts for the local fake root password rather than putting it in
the command line:

```bash
docker compose exec db \
  mysql --protocol=tcp --host=127.0.0.1 --user=root --password curriculum
```

At the MySQL prompt, run `SELECT 1;`, then type `exit`. This uses loopback inside the database
container, which is different from a host connection. The next lesson shows the service name that an
application should use instead of `localhost`.

`config --quiet` is useful in scripts and checks:

```bash
docker compose config --quiet
```

When the experiment is over, remove the project containers and its automatically created default
network:

```bash
docker compose down
```

This does not remove the images. It also does not remove named volumes unless you explicitly pass
`--volumes` or `-v`. It also leaves the MySQL image's anonymous volume by default; `down -v` removes
attached named and anonymous volumes. Later, when this project has a named database volume, that
distinction matters.

## Practice

1. Run `docker compose up -d` and confirm that both services appear in `docker compose ps`.
2. Open the Nginx page at `http://127.0.0.1:8080`.
3. Run `docker compose logs db` and identify the initialization messages.
4. Use `docker compose exec web nginx -T` to inspect the running service.
5. Change the host port to `127.0.0.1:8081:80`, validate with `docker compose config --quiet`, and start the project again.
6. Run `docker compose down`, then explain which resources were removed and which images remain.

Do not add a database host port just because the `db` service exists. Publish it only when a host-side
tool needs access, and bind that publication to `127.0.0.1`.

## Check your understanding

- What does the `web` service name identify inside the Compose project?
- When is `image` enough, and when does a service need `build`?
- Why can `docker compose up -d` finish while MySQL is still initializing?
- What does `docker compose config` validate and render?
- What does `docker compose down` remove, and why should a named volume be treated separately?

## Primary references

- [Docker Compose overview](https://docs.docker.com/compose/)
- [Compose file reference](https://docs.docker.com/reference/compose-file/)
- [Official MySQL image documentation](https://hub.docker.com/_/mysql)
