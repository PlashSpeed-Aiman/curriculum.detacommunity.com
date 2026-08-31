## Build time and runtime are different jobs

A development project often needs compilers, package managers, source files, and test tools. A running
application usually needs only its compiled output and a small runtime. Putting both environments in
one image makes the image larger and increases the amount of software that must be patched and
trusted.

A multi-stage Dockerfile separates those jobs. One stage builds the application; a later stage copies
only the runtime artifact.

## A multi-stage frontend image

The following example fits a Vite application that produces a `dist` directory:

```dockerfile
# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

The `build` stage contains Node, dependencies, source code, and the compiler output process. The
`runtime` stage starts from a fresh Nginx image and copies only `/app/dist` from the named build stage.
The source tree and Node dependencies do not become part of the final image.

The stage name is a label for the build graph. It is not a container name and it does not need to be
published.

## Build and compare

Build the final image from the directory containing the Dockerfile:

```bash
docker build --tag curriculum-site:production .
```

Run it locally:

```bash
docker run --rm --name curriculum-site-production --publish 8080:80 curriculum-site:production
```

In another terminal, inspect the image and its layers:

```bash
docker image inspect curriculum-site:production
docker history curriculum-site:production
```

The final image should contain the Nginx runtime and built files, not the Node dependency tree. The
builder still needs a useful `.dockerignore`, because the entire build context is considered before
the stages run.

You can stop after a named stage when debugging the build:

```bash
docker build --target build --tag curriculum-site:builder .
```

That image is useful for inspecting build output, but it is not the image you should deploy.

## Production boundaries

Multi-stage builds reduce the runtime surface, but they do not make an image production-ready by
themselves. Before deploying, make the runtime contract explicit:

- Pin base images to an approved version. For a high-assurance release, pin by digest as well.
- Keep runtime configuration outside the image when it changes between environments.
- Do not bake credentials, private keys, or environment files into any stage.
- Run as a non-root user when the runtime image and server configuration support it.
- Scan the final image and update base images and dependencies on a regular schedule.
- Add a health check at the deployment layer or in the image when the application has a meaningful
  endpoint to check.
- Define resource limits, logs, and shutdown behavior in the environment that runs the container.

The Nginx example serves static files. A single-page application with client-side routes may also need
an Nginx fallback configuration so a direct request to a nested URL returns the application's entry
file instead of a server-level 404. That is a web-server configuration concern, not a reason to copy
the Node toolchain into the runtime image.

## Practice

Apply the multi-stage pattern to a small frontend application:

1. Add the `build` and `runtime` stages from the example.
2. Add a `.dockerignore` that excludes `.git`, `node_modules`, `dist`, `.env`, and logs.
3. Build the image and run it on port `8081`.
4. Inspect the final image and confirm that the source files and `node_modules` directory are not
   needed by the Nginx runtime.
5. Change the application and rebuild. Confirm that dependency installation remains cached when the
   lockfile is unchanged.

If the application uses client-side routing, test both the home page and a direct nested URL. Record
the server configuration required for the second request to work.

## Check your understanding

- What belongs in the build stage but not the runtime stage?
- Why does `COPY --from=build` not copy the entire builder image?
- Which image should be deployed: `builder` or `production`, and why?
- What security and operational decisions remain after reducing the image size?

## Next step

Dockerfiles describe how an image is built. The next module will describe how several containers work
together, including networking, volumes, and local development with Docker Compose.

## Builder note

If `docker image ls curriculum-site` comes back empty after a build, your default builder is
probably using the `docker-container` driver, which keeps results only in the build cache. Rerun
the build with `docker buildx build --load` in place of `docker build` so the result is imported
into the local image store.
