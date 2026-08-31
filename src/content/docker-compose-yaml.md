## What you will learn

By the end of this lesson, you should be able to:

- Read the mappings, lists, and scalar values in a Compose file.
- Use indentation and quoting so Compose receives the values you intended.
- Recognize comments and Compose variable interpolation without confusing them with YAML features.
- Explain why modern Compose files use the Compose Specification and do not need a top-level `version:` field.

Compose files are configuration, not programs. The file describes the services you want; the Compose
CLI later turns that description into containers, networks, and other Docker resources. This lesson
uses only the YAML you need for that job. The [YAML specification](https://yaml.org/spec/) is much
larger than the useful first step here.

## Mappings, lists, and scalars

YAML has three shapes that appear constantly in Compose:

- A **mapping** associates a key with a value, such as `image` with an image name.
- A **list** contains ordered items. A hyphen starts each item.
- A **scalar** is one value, such as a string, number, boolean, or null.

Here is a small, runnable Compose file. Create `compose.yaml` inside a directory named
`compose-lab`:

```yaml
services:
  web:
    image: nginx:1.27-alpine
    ports:
      - "127.0.0.1:8080:80"
    environment:
      APP_MODE: local
      SHOW_BANNER: "false"
  db:
    image: mysql:8.4.11
    environment:
      MYSQL_ROOT_PASSWORD: "local-root-password"
      MYSQL_DATABASE: curriculum
```

Read it from the outside in:

- `services` is a mapping. Its keys, `web` and `db`, are service names.
- Each service is another mapping containing settings such as `image`, `ports`, and `environment`.
- `ports` is a list with one scalar string. The string maps a host port to a container port.
- `environment` is a mapping of variable names to scalar values.

The indentation is data. `image` belongs to `web` because it is indented below `web`; `db` is a
second service because it has the same indentation as `web`. Use spaces, not tabs, and keep the
indentation consistent. Two spaces per level is a common convention, but the important rule is that
siblings line up and children are indented further than their parent.

## Quote values that carry structure

The value `127.0.0.1:8080:80` is meant to be one port mapping string. Quote it so YAML and Compose treat
it unambiguously as a string and make that intention obvious. Always quote Compose's short port syntax,
especially when it includes a host address:

```yaml
ports:
  - "127.0.0.1:8080:80"
  - "127.0.0.1:8443:443"
```

The first number is the port on the host computer; the last number is the port inside the container.
The `127.0.0.1` prefix keeps the published port reachable only from the host's loopback interface.
Do not publish a database to every network interface just to make a local client work.

Quote values when their spelling could be mistaken for another YAML type or when they contain YAML
punctuation:

```yaml
environment:
  FEATURE_ENABLED: "false"
  EMPTY_VALUE: ""
  LABEL: "local #1"
```

An unquoted `false` is a YAML boolean, while `"false"` is a string containing five characters. An
application environment normally receives strings, so quote values when that distinction matters.
The `#` in `"local #1"` is part of the value because it is inside quotes. Without quotes, `#1` would
start a comment.

## Comments and interpolation

Comments begin with `#` when they are outside a quoted scalar:

```yaml
services:
  web:
    image: nginx:1.27-alpine # Use the small official image for this lab.
```

Comments help explain a decision, but they are not a safe place for passwords or tokens. A comment is
still stored in the file and may be copied or committed.

Compose adds variable interpolation while it reads the YAML. For example:

```yaml
services:
  web:
    image: nginx:1.27-alpine
    ports:
      - "127.0.0.1:${WEB_PORT:-8080}:80"
```

`${WEB_PORT:-8080}` means "use `WEB_PORT` when it is set and non-empty; otherwise use `8080`." Compose can read
`WEB_PORT` from the shell or the project's `.env` file. This substitution is Compose behavior, not a
general YAML feature. The value in the final Compose model can be inspected with
`docker compose config`.

When a command in a Compose file should receive a literal dollar expression for the container shell,
write `$$` so Compose does not expand it first:

```yaml
services:
  web:
    image: nginx:1.27-alpine
    command: ["sh", "-c", "echo $${APP_MODE}"]
```

The `$$` becomes a single `$` in the container command. Keep interpolation deliberate: a missing
variable can produce an empty value, and `docker compose config` may reveal local configuration values
in its output.

## The modern Compose format

Use the [Compose Specification](https://compose-spec.github.io/compose-spec/spec.html), which defines
the current service, network, volume, and configuration model. Modern Compose implementations use
`compose.yaml` or `compose.yml` by default. They do not need the old top-level `version:` field. Do not
add it to new files: current Compose may warn that the field is obsolete and ignores it.

The [Compose file reference](https://docs.docker.com/reference/compose-file/) is the useful reference
when you need a key such as `healthcheck`, `volumes`, or `networks`. It is better to look up the small
part of the model you need than to memorize the whole YAML language.

## Validate a small file

Create the directory and change into it:

```bash
mkdir -p compose-lab
cd compose-lab
```

After saving the YAML example as `compose.yaml`, ask Compose to parse and render it:

```bash
docker compose config
docker compose config --quiet
```

The first command prints the resolved model. The second is a quiet validation check and should return
without output when the file is valid. Start the two services if Docker is running:

```bash
docker compose up -d
docker compose ps
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080) to see the Nginx welcome page. MySQL may still be
initializing when the containers first start; a running container is not automatically proof that the
database is ready for a client. Stop the lab when you are finished:

```bash
docker compose down
```

If port `8080` is already in use, change only the host-side number, keep the loopback address, and use
the new URL. For example, `127.0.0.1:8081:80` publishes the same container port on host port `8081`.

## Practice

Make the host port configurable without changing the container port:

1. Add a `.env` file containing `WEB_PORT=8081`.
2. Replace the `ports` value with `"127.0.0.1:${WEB_PORT:-8080}:80"`.
3. Run `docker compose config` and find the resolved port mapping.
4. Start the stack, open `http://127.0.0.1:8081`, and then run `docker compose down`.

Do not put a real credential in `.env`. Compose files and environment files are plain text; the next
configuration lesson explains the difference between interpolation and values passed to a container.

## Check your understanding

- Which indentation level makes `web` and `db` siblings?
- Why is `"127.0.0.1:8080:80"` a better Compose port value than an unquoted port mapping?
- Is `${WEB_PORT:-8080}` a YAML feature or Compose interpolation?
- What does `docker compose config` show that the source YAML does not?
- Why should a new Compose file omit the obsolete top-level `version:` field?
