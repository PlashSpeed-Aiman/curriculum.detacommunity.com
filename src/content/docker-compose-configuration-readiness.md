## What you will learn

By the end of this lesson, you should be able to:

- Distinguish `.env` interpolation from a service's `env_file`.
- Keep local example credentials fake and understand why environment variables are not a production
  secret store.
- Add a MySQL healthcheck that tests an authenticated query.
- Explain the difference between startup order and application readiness.
- Use `depends_on` precisely, without treating it as a replacement for retries.

Compose has several ways to move configuration around. The similar names make it easy to assume that
every environment file does the same job. Read the path and the consumer carefully: Compose itself
needs values while it renders the model, while a container needs values after it starts.

## `.env` interpolation and `env_file`

The two mechanisms have different consumers:

| Mechanism | Read by | Main purpose | Automatically passed to every container? |
| --- | --- | --- | --- |
| Project `.env` | Compose CLI | Interpolate `${...}` expressions in `compose.yaml` and provide CLI configuration values | No |
| Service `env_file` | Compose when creating that service | Add key/value pairs to that service's container environment | No, only the service that declares it |
| Service `environment` | Compose when creating that service | Set explicit container environment values | Only that service |

For example, create these files in `compose-lab`:

`.env` contains non-secret local settings:

```dotenv
WEB_PORT=8080
APP_MODE=local
```

`db.env` contains fake credentials for this disposable exercise:

```dotenv
MYSQL_ROOT_PASSWORD=local-root-password
MYSQL_DATABASE=curriculum
MYSQL_USER=curriculum_app
MYSQL_PASSWORD=local-app-password
```

If these files are inside a real project, add them to the project's ignore rules and use a separate
documented mechanism for real credentials. Do not reuse the example values outside this lab.

`.env` is loaded for interpolation because it is next to `compose.yaml`. It does not mean that
`WEB_PORT` or `APP_MODE` automatically appear in every container. `env_file` is a per-service setting;
the values in `db.env` are sent to `db`, not to `web`, and they are not automatically available for
interpolating unrelated YAML fields. If both `environment` and `env_file` define the same container
variable, the explicit `environment` value takes precedence.

## Build a configured MySQL stack

Use this `compose.yaml` in `compose-lab`:

```yaml
services:
  web:
    image: nginx:1.27-alpine
    ports:
      - "127.0.0.1:${WEB_PORT:-8080}:80"
    environment:
      APP_MODE: ${APP_MODE:-local}
      DATABASE_HOST: db
      DATABASE_PORT: "3306"
      DATABASE_NAME: curriculum
    depends_on:
      db:
        condition: service_healthy
  db:
    image: mysql:8.4.11
    env_file:
      - ./db.env
    ports:
      - "127.0.0.1:3307:3306"
    volumes:
      - db-data:/var/lib/mysql
    healthcheck:
      test:
        - CMD-SHELL
        - 'mysql --protocol=tcp --host=127.0.0.1 --user="$${MYSQL_USER}" --password="$${MYSQL_PASSWORD}" --database="$${MYSQL_DATABASE}" --execute="SELECT 1" >/dev/null 2>&1'
      interval: 5s
      timeout: 5s
      retries: 20
      start_period: 20s

volumes:
  db-data:
```

The `db` service receives its MySQL initialization values from `db.env`. The `web` service receives
only the values explicitly listed under its `environment` mapping. `DATABASE_HOST: db` and
`DATABASE_PORT: "3306"` are the values an actual application in this project would use. Nginx does not
consume them, but keeping them in the example makes the application boundary visible.

The `ports` entry for MySQL is optional. It is present here so DBeaver can connect from the host at
`127.0.0.1:3307`. Remove it when no host-side database client is needed. Container-to-container
connections continue to use `db:3306` either way.

The healthcheck runs inside the `db` container. Its loopback address is correct there because the check
is asking the local MySQL process. The escaped `$${MYSQL_USER}`, `$${MYSQL_PASSWORD}`, and
`$${MYSQL_DATABASE}` references are intentional: `$$` tells Compose to leave them for the container's
shell, which then expands them from `db.env`.
The check runs an authenticated `SELECT 1`, rather than assuming that a log line or a running process
proves that MySQL can accept the application account's work.

## Readiness is more than startup order

A container can be running while its service is still initializing. MySQL may create system tables,
apply initialization settings, and only then accept normal client queries. This is why a plain
`docker compose up -d` result is not a database readiness signal.

The short `depends_on` form expresses startup order only:

```yaml
depends_on:
  - db
```

It starts `db` before `web`, but it does not wait for MySQL to be ready. It also does not retry a
connection made later by the application.

The long form used in this lesson adds a condition:

```yaml
depends_on:
  db:
    condition: service_healthy
```

With a declared healthcheck, Compose waits for `db` to report `healthy` before starting `web` during
`docker compose up`. That is a useful startup gate, but it is not a permanent availability guarantee.
The database can become unhealthy after `web` starts, and an application still needs connection timeouts,
retries, and a clear failure path. A healthcheck is also only as good as the operation it tests.

Do not use a startup order field as if it were a distributed readiness protocol. The application should
be able to recover when the database restarts, and it should not assume that one successful healthcheck
means every future query will succeed.

## Validate and observe the health state

From `compose-lab`, render the interpolation result without starting anything:

```bash
docker compose config
docker compose config --quiet
```

Review this output carefully in real projects. It can include values read from `.env` and `db.env`, so
do not paste it into an issue or commit it when it contains private settings.

Start the project and inspect the service states:

```bash
docker compose up -d
docker compose ps
docker inspect "$(docker compose ps -q db)" \
  --format '{{.State.Health.Status}}'
```

The final command should eventually print `healthy`. During the first initialization it may print
`starting`. If it becomes `unhealthy`, inspect the database logs and the healthcheck definition:

```bash
docker compose logs db
docker compose config
```

Once the database is healthy, DBeaver can use:

| Setting | Value |
| --- | --- |
| Host | `127.0.0.1` |
| Port | `3307` |
| Database | `curriculum` |
| User | `curriculum_app` |
| Password | The fake value in `db.env` |

An application container uses a different address: host `db`, port `3306`. The host publication is a
forwarding path for DBeaver, not the service's internal address.

## Credentials are configuration, not secret management

The values in this lesson are deliberately fake. Plain `.env` and `env_file` files are convenient for
local development, but they are readable files and can be exposed through source control, backups,
Compose output, container metadata, or process inspection. Environment variables are not a production
secret store. Do not put real production passwords, tokens, or private keys in a Compose file or an
environment file committed to a repository.

For a shared or production deployment, use the secret-management feature provided by the deployment
environment and define how values are rotated, audited, and revoked. Compose secrets and an external
secret manager can be useful boundaries, but they do not remove the need to control access to the host
and Docker daemon.

MySQL initialization has another important boundary. The official image reads `MYSQL_ROOT_PASSWORD`,
`MYSQL_DATABASE`, `MYSQL_USER`, and `MYSQL_PASSWORD` when `/var/lib/mysql` is empty. If `db-data` already
contains an initialized database, changing `db.env` does not change the existing root password, create a
new database, or update the application account automatically. Treat credential rotation as a database
operation, not as a simple environment-file edit.

## Practice

1. Create `.env`, `db.env`, and the Compose file above using only the fake values shown here.
2. Add `.env` and `db.env` to local ignore rules before running the stack in a real repository.
3. Run `docker compose config` and find the resolved host port and the healthcheck command.
4. Start the stack and watch `docker compose ps` move the database from starting to healthy.
5. Temporarily change `WEB_PORT` to `8081`, run `docker compose up -d`, and open `http://127.0.0.1:8081`.
6. Remove the MySQL `ports` section and confirm that an internal client can still use `db:3306` even though DBeaver no longer has a host publication.
7. Explain why changing `MYSQL_PASSWORD` in `db.env` does not change an already initialized database volume.

If you test a clean MySQL initialization, use only disposable local data and explicitly understand the
effect of `docker compose down -v` before running it.

## Check your understanding

- Does a project `.env` file automatically become the environment of every service?
- What does `env_file: ./db.env` change for the `db` service?
- Why does the healthcheck use `127.0.0.1` inside the `db` container but an application uses `db:3306`?
- What does short-form `depends_on` guarantee, and what does it not guarantee?
- When does the long `service_healthy` condition help, and why do applications still need retries?
- Why is an environment variable not a production secret store?

## Primary references

- [Compose environment variables and interpolation](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)
- [Compose `env_file` reference](https://docs.docker.com/reference/compose-file/services/#env_file)
- [Compose startup order and `depends_on`](https://docs.docker.com/compose/how-tos/startup-order/)
- [Compose healthcheck reference](https://docs.docker.com/reference/compose-file/services/#healthcheck)
- [Official MySQL image documentation](https://hub.docker.com/_/mysql)
