## What this supplementary lesson adds

Earlier lessons in this module taught how layers are built and why environment variables and build
arguments are not a place for secrets. This lesson follows that idea into the Dockerfile itself. It
demonstrates, with a real build on the default BuildKit engine, where a secret can survive in an
image, and which Docker mechanisms remove it and which do not.

Every claim below was reproduced locally before being written. Use only throwaway tokens when you run
the demonstrations yourself; never test with a credential you care about.

By the end, you should be able to:

- Explain the difference between `ENV` and `ARG` and why each one leaks secrets differently.
- Find leaked values with `docker image inspect`, `docker image history`, and layer extraction.
- Pass a build-time secret without storing it, using a `RUN --mount=type=secret` mount.
- Explain what multi-stage builds remove from the final image and what they do not remove.
- Decide where a real secret should live instead of in a Dockerfile.

## A secret is not an environment variable

Docker's own documentation is direct about this: "Build arguments and environment variables are
inappropriate for passing secrets to your build, because they persist in the final image." The two
instructions differ in exactly how they persist:

| | `ENV` | `ARG` |
| --- | --- | --- |
| When is the value available? | During the build **and** when the container runs | During the build only |
| Where does it live afterwards? | In the image configuration (`Config.Env`), in the image history, and in every container created from the image | Not embedded in the image configuration |
| Typical use | Runtime defaults, image metadata, paths | Values the builder needs: versions, tags, non-secret build input |

The official `ENV` reference says values set with `ENV` persist when a container runs from the image,
and that "you can view the values using `docker inspect`". That sentence is a red flag when the value
is a secret: the image carries it in plaintext by design. The official `ARG` reference is the mirror
image: "Unlike `ENV`, an `ARG` variable is not embedded in the image and is not available in the final
container." That sounds safe, but the same reference carries a warning that build arguments are
visible in `docker history`, and build arguments still reach every instruction in their stage, so a
`RUN` step can copy them into the filesystem. The rest of this lesson makes both statements concrete.

## Demonstration 1: `ENV` bakes the secret into the image

Start from this deliberately careless Dockerfile:

```dockerfile
FROM alpine:3.20
ARG API_TOKEN
ENV API_TOKEN=${API_TOKEN}
RUN mkdir -p /etc/app && printf 'token=%s\n' "$API_TOKEN" > /etc/app/settings.conf
```

Build it with a throwaway value:

```bash
docker build --build-arg API_TOKEN=supersecret-12345 -t leakdemo:envleak .
```

The value is now readable in three places without any special tooling. First, the image
configuration:

```bash
docker image inspect leakdemo:envleak --format '{{json .Config.Env}}'
```

```json
["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin","API_TOKEN=supersecret-12345"]
```

Second, the image history, where both the `ENV` line and the `RUN` step show the resolved value:

```text
RUN |1 API_TOKEN=supersecret-12345 /bin/sh -c mkdir -p /etc/app && printf "token=%s\n" "$API_TOKEN" > /etc/app/settings.conf # buildkit
ENV API_TOKEN=supersecret-12345
ARG API_TOKEN=supersecret-12345
CMD ["/bin/sh"]
```

Third, anyone who obtains the image file can extract it and read the layer contents:

```bash
docker save leakdemo:envleak | tar -x
```

The token appears in the image's configuration JSON and inside the layer archive under
`etc/app/settings.conf`. Distribution is how images travel; the secret travels with them.

## Demonstration 2: `ARG` alone still leaks

Repeat the same experiment without the `ENV` line:

```dockerfile
FROM alpine:3.20
ARG DB_PASSWORD
RUN mkdir -p /etc/app && printf 'dbpassword=%s\n' "$DB_PASSWORD" > /etc/app/db.conf
```

Build it with `--build-arg DB_PASSWORD=dbpass-99999`. This time the image configuration is clean:

```json
["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"]
```

The `ARG` value did not become a runtime environment variable. But the history still exposes it, and
the layer filesystem still contains the file that used it:

```text
RUN |1 DB_PASSWORD=dbpass-99999 /bin/sh -c mkdir -p /etc/app && printf "dbpassword=%s\n" "$DB_PASSWORD" > /etc/app/db.conf # buildkit
ARG DB_PASSWORD=dbpass-99999
```

The lesson is uncomfortable but precise: `ARG` protects the *container environment*, not the secret.
Any instruction inside the stage can persist the value into a layer, and the stage's own lines in the
history repeat it. That is why the official warning exists and why the recommended tool for
build-time credentials is neither `ENV` nor `ARG`.

## Demonstration 3: deleting the file does not delete the layer

A natural attempt at cleanup is to write the secret and then remove it in a later `RUN` step. Layers
do not work that way. Consider:

```dockerfile
FROM alpine:3.20
RUN mkdir -p /etc/app && printf 'token=deleted-secret-777\n' > /etc/app/gone.conf
RUN rm /etc/app/gone.conf
```

The running container cannot open the file at all:

```text
cat: can't open '/etc/app/gone.conf': No such file or directory
```

Yet extracting the image shows the secret file alive in the first layer:

```text
present in <layer>/layer.tar
token=deleted-secret-777
```

This is the whiteout mechanism: deleting a file in a later layer only places a marker that hides the
file in the union view. Image layers are immutable once created, so the earlier layer keeps the
secret forever. Docker's storage documentation says the same thing about containers: the read-only
image layers keep the file, and deletion only affects the container's writable layer. Cleanup inside
a single image is therefore not a recovery strategy.

## The fix for build-time secrets: secret mounts

The supported mechanism for a value that only the build needs is the secret mount. A secret mount
makes the value available to a single `RUN` instruction as a file, then discards it. The official
documentation is explicit that this keeps the value "from being baked into the image or build cache."

```dockerfile
# syntax=docker/dockerfile:1
FROM alpine:3.20
RUN --mount=type=secret,id=api_token,required \
    mkdir -p /etc/app && \
    test -s /run/secrets/api_token && \
    printf 'fetched-with-token\n' > /etc/app/artifact.txt
```

Provide the value at build time, never in the Dockerfile:

```bash
docker build --secret id=api_token,src=./token.txt -t leakdemo:secretmount .
```

Verified behavior from a local reproduction:

- The secret appears inside the build container only for the duration of that one `RUN` step, mounted
  by default at `/run/secrets/api_token`, readable by root.
- With `required` set, the build fails immediately when the secret is not provided: `secret
  api_token: not found`.
- The final image contains no trace of the token: not in `Config.Env`, not in `docker image history`,
  and not in any extracted layer. The artifact file that the step produced exists; the secret that
  produced it does not.

Secret mounts require the Dockerfile frontend syntax (`# syntax=docker/dockerfile:1`) and BuildKit,
which is the default builder for Docker Engine and Docker Desktop. With the legacy builder these
mounts are unavailable, which is itself a reason to check which builder a build system uses.

## What multi-stage builds do, and do not, prevent

Multi-stage builds remove whole stages from the final image. The official documentation describes the
result as leaving "behind everything you don't want in the final image", and the lesson on production
images already used that property to drop build tooling. The same property applies to secrets.

Reproduced pattern: a builder stage receives the token through `ARG` and `ENV`, and a final stage
copies out only a harmless artifact:

```dockerfile
FROM alpine:3.20 AS builder
ARG API_TOKEN
ENV API_TOKEN=${API_TOKEN}
RUN mkdir -p /out && printf 'built-by-stage\n' > /out/result.txt

FROM alpine:3.20
COPY --from=builder /out/result.txt /result.txt
```

Built with `--build-arg API_TOKEN=ms-token-444`, the final image is clean: no token in
`Config.Env`, no token in `docker image history` (the builder's instructions are not part of the
final image), and no token in the extracted layers. The token existed only in the builder stage.

Two limits matter, and both follow from how images and caches actually work:

1. **Multi-stage protects the distributed image, not your machine.** Builder-stage layers remain in
   the local build cache until pruned. A secret written into a builder layer is still on disk where
   the build ran. It is not published with the image; it is also not erased by the build.
2. **The final stage must not repeat the mistake.** If the final stage sets `ENV` from a secret, or
   `COPY`s a secret-bearing file instead of a clean artifact, the leak is back. Multi-stage is a
   boundary, not a magic eraser, and the official pattern pairs that boundary with secret mounts so
   the builder stage never stores the value in the first place.

So the honest summary of the third question in this lesson's title: multi-stage prevents secrets
from reaching the *final image that gets distributed*, which is true and valuable. It does not
prevent secrets from touching the build environment; only a secret mount does that.

## Runtime secrets do not belong in the image either

Once a container runs, the same plaintext logic applies one layer up. Environment variables passed
with `docker run --env` are visible to `docker inspect` on that container, readable by the
container's own processes, and inherited by every process the application starts. They are
convenient and they are not confidential. For real runtime secrets, prefer injection at deploy time:
an orchestrator secret, a secret manager, or a mounted secret file that the application reads and
does not log. The image should never archive the value in the first place.

## What to remember

1. `ENV` values are plaintext image configuration. They persist into the running container and are
   readable with `docker inspect` and `docker image history`.
2. `ARG` values are not embedded in the image configuration, but they are visible in build history
   and can be written into layers by any instruction in their stage. Never pass secrets as build
   arguments.
3. Deleting a file in a later layer only hides it; the secret remains in the immutable earlier
   layer. Cleanup is not a fix.
4. Build-time secrets belong in a secret mount (`RUN --mount=type=secret`), which never bakes the
   value into the image or the build cache.
5. Multi-stage builds keep secrets out of the distributed final image, but builder-stage content
   stays in the local build cache and the final stage must not re-introduce the secret.
6. Runtime secrets should be injected when the container starts, not archived in the image.

## Practice

Run these with throwaway tokens on a machine where you control the Docker daemon. The full
extraction step uses `docker save`; you can stop after `docker image history` if you only want the
metadata lesson.

1. Build the Demonstration 1 Dockerfile with a fake token and confirm the value appears in
   `docker image inspect` output and in `docker image history --no-trunc`.
2. Rebuild the same image without the `ENV` line, inspect `Config.Env` again, and observe that the
   history still shows the value from `--build-arg`.
3. Add a `RUN rm` of the settings file as a second layer and extract the image with `docker save` to
   find the file still present in the first layer.
4. Replace the value with a secret mount, build once without `--secret` (watch `required` fail the
   build) and once with it, then confirm neither `Config.Env`, the history, nor the saved layers
   contain the token.
5. Split the Dockerfile into a builder stage and a final stage, keep a fake token only in the
   builder, and verify the final image contains no trace of it.

## Check your understanding

- Why is `ENV` worse than `ARG` for secrets, and why is `ARG` still unsafe?
- Where does `docker image history` get the values it prints, and why does that matter for a token
  passed with `--build-arg`?
- Deleting a secret file in a later `RUN` step fails to remove it from the image. What is the
  mechanism behind that?
- What does `required` change for a secret mount, and what happens when the secret is missing?
- Multi-stage builds keep the token out of the final image in the demonstration. What do they not
  protect, and which instruction in the final stage would bring the leak back?

## Primary references

- [Dockerfile reference: `ENV` and `ARG`](https://docs.docker.com/reference/dockerfile/)
- [Build arguments and variables](https://docs.docker.com/build/building/variables/)
- [Docker build secrets](https://docs.docker.com/build/building/secrets/)
- [Dockerfile reference: `RUN --mount=type=secret`](https://docs.docker.com/reference/dockerfile/#run---mounttypesecret)
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [BuildKit](https://docs.docker.com/build/buildkit/)
- [Understanding image layers](https://docs.docker.com/get-started/docker-concepts/building-images/understanding-image-layers/)
- [Storage driver reference (whiteouts and read-only image layers)](https://docs.docker.com/storage/storagedriver/overlayfs-driver/)
- [`docker image history` reference](https://docs.docker.com/reference/cli/docker/image/history/)
- [`docker image inspect` reference](https://docs.docker.com/reference/cli/docker/image/inspect/)
