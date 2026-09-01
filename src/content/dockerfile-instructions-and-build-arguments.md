## Read a Dockerfile as a small language

The [Dockerfile reference](https://docs.docker.com/reference/dockerfile/) is more than a list of
commands. It describes a small language for turning a build context into an image and then declaring
how a container should run. The useful question is not "Which instruction can I fit here?" but "Which
part of the image or runtime contract does this instruction own?"

By the end of this reference lesson, you should be able to:

- identify the job of every instruction in the reference list;
- use `ARG` for deliberate build-time variation without confusing it with `ENV`;
- scope build arguments correctly across `FROM` lines and stages;
- choose safer defaults for files, processes, users, ports, and health checks; and
- avoid putting credentials in build arguments, environment variables, layers, or labels.

## The instruction map

Docker runs instructions from top to bottom. Instruction names are conventionally uppercase, although
the instruction itself is not case-sensitive. A Dockerfile must begin with `FROM`, except that parser
directives, comments, and globally scoped `ARG` declarations may appear before it.

| Area | Instructions | Job |
| --- | --- | --- |
| Build graph | `FROM`, `ARG` | Select a base image, start a stage, and parameterize build decisions. |
| Files and build steps | `RUN`, `COPY`, `ADD`, `WORKDIR` | Execute build commands, move files, and establish a predictable directory. |
| Runtime contract | `CMD`, `ENTRYPOINT`, `ENV`, `USER` | Describe the default process, its environment, and its identity. |
| Runtime metadata | `EXPOSE`, `HEALTHCHECK`, `STOPSIGNAL`, `VOLUME` | Document or configure ports, health, shutdown, and mutable data locations. |
| Metadata and reuse | `LABEL`, `ONBUILD`, `SHELL` | Add image metadata, defer instructions for child images, or change shell behavior. |
| Deprecated | `MAINTAINER` | Legacy author metadata; use a label instead. |

These instructions do different kinds of work. `RUN`, `COPY`, and `ADD` commonly change the image
filesystem. `CMD`, `ENV`, `EXPOSE`, `LABEL`, and similar instructions can change image configuration
without adding the files you see in a filesystem layer. Keeping that distinction in mind makes image
history and runtime behavior easier to reason about.

## Put parser directives first

Parser directives affect how the Dockerfile is interpreted. They do not create image layers and are not
build steps. Put them at the very top, before an ordinary comment, blank line, or builder instruction:

```dockerfile
# syntax=docker/dockerfile:1

FROM alpine:3.21
```

The `syntax` directive selects the Dockerfile frontend. The `:1` channel follows the latest stable
Dockerfile syntax, so a project that needs strict long-term reproducibility should choose and update a
specific supported version deliberately.

Build checks can also be configured with a parser directive:

```dockerfile
# syntax=docker/dockerfile:1
# check=error=true
```

Checks normally report warnings. `error=true` makes check failures fail the build. Use this only with a
Dockerfile frontend that supports the directive, and pin the syntax version when adopting it so a newly
introduced check does not unexpectedly break a future build. Build checks can also be run separately
with `docker build --check .` when that command is available in the installed Docker toolchain.

## Give `ARG` a narrow job

`ARG` defines a build argument. It is useful for values that affect the build graph, such as a base image
variant, a package version, or a feature selected while compiling:

```dockerfile
ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
```

A caller can override the default without editing the Dockerfile:

```bash
docker build --build-arg NODE_VERSION=22 --tag instruction-lab:dev .
```

Use defaults that are valid, documented, and tested. If changing an argument changes a dependency or
base image, test each supported value in CI rather than treating `--build-arg` as an unvalidated escape
hatch.

### Understand `ARG` scope

An `ARG` before the first `FROM` is in the global scope. It can be used by `FROM`, but it is not
automatically available to commands later in a build stage. Consume it again inside the stage when a
later instruction needs the value:

```dockerfile
ARG ALPINE_VERSION=3.21

FROM alpine:${ALPINE_VERSION} AS build
ARG ALPINE_VERSION

RUN printf 'Building from Alpine %s\n' "$ALPINE_VERSION" > /build-base.txt
```

The second `ARG ALPINE_VERSION` has no new default. It brings the global argument, including an
override supplied by `--build-arg`, into the stage. A stage-scoped argument is inherited by stages that
use that stage as their base:

```dockerfile
FROM alpine:3.21 AS base
ARG APP_REVISION=dev

FROM base AS test
RUN printf 'Testing revision %s\n' "$APP_REVISION"
```

An unrelated stage does not inherit `APP_REVISION`; declare it there if that stage needs it. An argument
also has no effect until an instruction uses it. This makes unused arguments misleading: remove them or
connect them to a real build decision.

### Do not use `ARG` for secrets

Build arguments are not runtime environment variables, but that does not make them secret. Values can
appear in image history, build metadata, provenance, logs, or files generated during the build. The same
warning applies to `ENV`, labels, copied `.env` files, and commands that print credentials.

Do not do this:

```dockerfile
ARG NPM_TOKEN
RUN npm config set //registry.npmjs.org/:_authToken="$NPM_TOKEN" \
    && npm ci
```

The token can be recorded in build output or a layer even if a later instruction removes the npm
configuration. Instead, use a temporary BuildKit secret mount:

```dockerfile
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci
```

Pass the secret from the client, not through the Dockerfile:

```bash
docker buildx build \
  --secret id=npmrc,src="$HOME/.npmrc" \
  --tag instruction-lab:private .
```

The mounted file is available only to that `RUN` instruction and is not intended to become part of the
resulting image. SSH mounts serve the same purpose for private Git access. Do not print a mounted secret,
copy it into an artifact, or assume a secret is safe because its source file is listed in `.dockerignore`.

## Decide whether a value belongs in `ENV`

`ENV` persists in the image configuration and in containers created from the image. Use it for an
intentional runtime default, not merely because the value is convenient to reference during a build:

```dockerfile
FROM node:22-alpine

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "server.js"]
```

Here, `ARG` makes the build configurable and `ENV` deliberately carries the selected value into the
running container. A caller can choose a different build default with `--build-arg NODE_ENV=staging`,
but the resulting image then has a different runtime default.

If a value is needed for only one build command, keep it local to that command instead:

```dockerfile
RUN DEBIAN_FRONTEND=noninteractive apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
```

Persisting a build-only setting with `ENV` can change how later commands and users of the image behave.
It can also leave a value in image configuration even after a later instruction tries to unset it.

## Use the file instructions deliberately

### Prefer `COPY` for ordinary files

Use `COPY` for normal transfers from the build context or from another build stage:

```dockerfile
COPY --from=build /app/dist /usr/share/nginx/html
```

Keep the context small with `.dockerignore`, and copy only what the next step needs. This reduces build
time, limits accidental input, and makes cache boundaries easier to understand.

`ADD` has additional behavior: it can fetch supported remote sources and automatically extract local
tar archives. Those features can be useful, but they make the source behavior less obvious. Use `ADD`
when you need one of those features, validate remote artifacts with a checksum when supported, and use
`COPY` for a straightforward local copy.

### Set an explicit `WORKDIR`

Use a clear absolute path instead of depending on the base image's current directory or repeating
`RUN cd ...` in multiple instructions:

```dockerfile
WORKDIR /app
```

`WORKDIR` applies to later `RUN`, `CMD`, `ENTRYPOINT`, `COPY`, and `ADD` instructions in that stage. It
also makes a Dockerfile easier to read when the base image changes.

## Make build steps repeatable

`RUN` executes a command while the image is being built. Treat each `RUN` as a dependency boundary:

- install only packages the image needs;
- on Debian or Ubuntu, keep `apt-get update` and `apt-get install` in the same `RUN`;
- use `--no-install-recommends` when optional packages are not needed;
- remove package lists and temporary files in the same layer that creates them;
- sort long package lists so updates are easy to review; and
- order stable inputs before frequently changing source so correct cache hits remain useful.

For example:

```dockerfile
RUN apt-get update \
    && apt-get install --yes --no-install-recommends \
       ca-certificates \
       curl \
    && rm -rf /var/lib/apt/lists/*
```

Do not combine unrelated commands only to reduce the number of lines. A clear boundary is more useful
than a small Dockerfile when the operations have different inputs, failure modes, or cache behavior.
When a shell pipeline must fail if an earlier command fails, use a shell that supports `pipefail` and
configure it explicitly; not every `/bin/sh` implementation supports that option.

## Define the runtime contract

### `CMD` and `ENTRYPOINT`

`CMD` supplies a default command or default arguments. Only the last `CMD` takes effect. `ENTRYPOINT`
defines the executable that the image is intended to run. A common command-line image pattern is:

```dockerfile
ENTRYPOINT ["example-tool"]
CMD ["--help"]
```

The default starts the tool with `--help`, while arguments supplied to `docker run` can replace the
default arguments. Prefer exec form for long-running processes:

```dockerfile
ENTRYPOINT ["/usr/local/bin/server"]
CMD ["--port", "8080"]
```

Exec form does not invoke a shell automatically and lets the application receive signals more directly.
Shell-form entrypoints can become a shell process that does not forward signals or handle runtime
arguments as expected. If an entrypoint script is necessary, finish it with `exec "$@"` after its setup
work.

### `USER`

If the application does not need root privileges, create the required user and group during the
privileged setup phase, make application files readable by that user, and switch with `USER` before the
runtime instructions. `USER` affects later build commands as well as the default runtime user.

Use an explicit UID and GID when the numeric identity must be stable across rebuilds or mounted volumes.
The exact user-creation command depends on the base distribution, so do not copy a Debian command into
an Alpine or distroless image without checking the image first.

### `EXPOSE` is documentation

`EXPOSE 8080` records that the application is expected to listen on port `8080` inside the container.
It does not publish a host port. Publishing is a runtime decision:

```bash
docker run --publish 8080:8080 instruction-lab:dev
```

The first port belongs to the host and the second belongs to the container. Use `/udp` when the
container listens with UDP; TCP is the default when no protocol is specified.

### `HEALTHCHECK` should test useful behavior

A health check should exercise a meaningful local application path, not merely check that a process ID
exists. Keep the probe lightweight, choose a timeout that matches the application, and ensure the probe
program exists in the final image. A curl-based example is only valid when `curl` is installed:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl --fail --silent http://127.0.0.1:8080/health || exit 1
```

Health status reports information to Docker; it does not publish a port or automatically repair an
application. Configure restart and orchestration policy where the container is run.

## Keep the remaining instructions purposeful

- `LABEL` stores searchable image metadata such as source, version, license, or revision. Use stable
  metadata names and never put credentials in labels.
- `VOLUME` marks a path intended for mutable or user-serviceable data. It is not a backup strategy, so
  document how that data is created, migrated, and backed up.
- `SHELL` changes the shell used by shell-form `RUN`, `CMD`, and `ENTRYPOINT` instructions. Use it when
  the image genuinely needs a different shell, especially on Windows, rather than hiding shell
  assumptions in a command.
- `STOPSIGNAL` can select the signal an application expects during a normal container stop. Set it only
  when the default signal is not the correct runtime contract.
- `ONBUILD` defers an instruction until another Dockerfile uses this image as its base. It is useful for
  carefully designed parent images, but can surprise users. Give such images a clearly separate tag and
  be especially cautious with deferred `COPY` or `ADD` instructions that require files in a child's
  context.
- `MAINTAINER` is deprecated. Use a label such as
  `org.opencontainers.image.authors="team@example.com"` when author metadata is needed.

## Practice: audit a Dockerfile

Take the Dockerfile from the previous lessons and make an intentional pass through it:

1. Add a version argument before `FROM` and override it once with `--build-arg`.
2. If a later `RUN` needs that value, redeclare the argument inside the stage and confirm its scope.
3. Decide which values should be runtime `ENV` values and which should stay local to one `RUN`.
4. Check that credentials are absent from `ARG`, `ENV`, `LABEL`, copied files, and shell output.
5. Replace an ordinary `ADD` with `COPY` if no `ADD`-specific behavior is required.
6. Set an absolute `WORKDIR`, inspect the runtime user, and confirm that `EXPOSE` has not been confused
   with port publishing.
7. Run the available build checks and inspect the final image configuration with `docker image inspect`.

For a clean base-image refresh, remember the distinction between these flags:

```bash
docker build --pull --no-cache --tag instruction-lab:fresh .
```

`--pull` checks for a newer base image. `--no-cache` reruns build steps. Neither flag is a substitute
for pinning versions, reviewing dependency updates, or testing the result.

## Check your understanding

- Why can a global `ARG` be used in `FROM` but not automatically in a later `RUN`?
- When is `ENV` the right choice, and why is it risky for a build-only value?
- Why is `COPY` usually clearer than `ADD` for a local file transfer?
- What is the difference between `CMD`, `ENTRYPOINT`, and the command supplied to `docker run`?
- Why does `EXPOSE 8080` not make `localhost:8080` reachable?
- Which mechanism should carry a private package token into a build?
- Why should a health check verify application behavior and not just process existence?

## Further reading

- [Dockerfile reference](https://docs.docker.com/reference/dockerfile/)
- [Docker build best practices](https://docs.docker.com/build/building/best-practices/)
- [Build variables](https://docs.docker.com/build/building/variables/)
- [Build secrets](https://docs.docker.com/build/building/secrets/)
