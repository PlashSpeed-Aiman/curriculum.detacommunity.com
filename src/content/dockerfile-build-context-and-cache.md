## The build context is part of the build

When you run `docker build ... .`, the final path is the build context. Docker makes the files in that
directory available to `COPY` and `ADD` instructions. A Dockerfile cannot copy a file that is outside
its context.

The context is also sent to the builder. A large context slows builds and can accidentally include
credentials, local dependencies, build output, or test data. Treat the context as an input that needs
the same care as the Dockerfile itself.

## Keep unwanted files out

Create a `.dockerignore` next to the `Dockerfile`:

```text
.git
node_modules
dist
.env
*.log
```

This file changes what Docker sends as build context. It does not change what Git tracks and it does
not remove files from your working directory.

Never rely on `.dockerignore` as the only protection for a secret. Do not put a secret in the build
context in the first place. A file copied into an image can remain available in an earlier layer even
if a later instruction deletes it.

## Image layers and cache

Most Dockerfile instructions create a layer. Docker can reuse a layer when the instruction and the
inputs it depends on have not changed. This cache is why a good Dockerfile can be both repeatable and
quick to rebuild.

Consider a small Node application:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

CMD ["npm", "start"]
```

The dependency files are copied before the application source. If only a source file changes, Docker
can reuse the expensive `npm ci` layer. If `package-lock.json` changes, Docker correctly reruns the
dependency installation.

This ordering is not a trick to memorize. Put a stable, expensive step before a frequently changing
input only when the result remains correct. Never sacrifice correctness just to preserve cache hits.

## See the cache in action

Build with plain progress output so the builder's decisions are visible:

```bash
docker build --progress=plain --tag cache-example:dev .
```

Change a source file and run the same command again. Docker should report cached work for the base
image and dependency installation while rerunning the step that copies the changed source.

Now change the dependency manifest and build again. The dependency layer should be invalidated because
its input changed.

Use `--no-cache` when you intentionally want to test every build instruction from scratch:

```bash
docker build --no-cache --progress=plain --tag cache-example:fresh .
```

Do not use `--no-cache` as a routine fix for a confusing build. Find the input that changed and decide
whether the Dockerfile still describes the dependency correctly.

## Avoid leaking build-time values

`ARG` and `ENV` are not secret stores. Values supplied through them can appear in image metadata,
layers, logs, or the resulting process environment. Do not write tokens into a Dockerfile, pass them
as build arguments, or copy local environment files into an image.

If a build genuinely needs a secret, use the secret mechanism supported by your Docker builder and
make sure the secret is consumed without being written into a layer. The exact command depends on the
builder and should be documented with the project rather than improvised in a lesson.

## Practice

Use the static site from the previous lesson:

1. Add `.dockerignore` with `.git`, `dist`, `.env`, and `*.log` entries.
2. Build with `--progress=plain` and identify which steps are cached.
3. Change only `site/index.html` and build again.
4. Change the `COPY` source or the base image tag and observe which work is repeated.
5. Run `docker history curriculum-site:dev` and identify the layer that contains the site files.

Do not place credentials, private certificates, or personal files in the test directory while
experimenting.

## Check your understanding

- What does the final path in `docker build ... <path>` control?
- Why should dependency manifests often be copied before application source?
- What happens when a file in a layer is deleted by a later instruction?
- Why is `.dockerignore` useful even when a repository already has `.gitignore`?

## Builder note

If `docker image ls cache-example` comes back empty after a build, your default builder is
probably using the `docker-container` driver, which keeps results only in the build cache. Rerun
the build with `docker buildx build --load` in place of `docker build` so the result is imported
into the local image store.
