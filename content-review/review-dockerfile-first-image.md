# Review: dockerfile-first-image.md

Built and ran the exact Dockerfile and commands from the lesson.

## Reproducibility risk: `docker build --tag` may not tag the image (shared across the Dockerfile lessons)

`src/content/dockerfile-first-image.md:64-70`

Same issue found in the image-layers deep dive review
(`content-review/review-dockerfile-image-layers-deep-dive.md`): on a `docker-container` buildx
builder — common for anyone set up for multi-platform builds — plain `docker build --tag ...`
does not add the image to the local store (`docker image ls` comes back empty) unless `--load` is
added. Reproduced directly here with this lesson's own Dockerfile and command. Every later command
in the lesson (`docker run`, `docker image inspect`, `docker history`) depends on the image being
tagged locally, so this is worth a single callout in the lesson (or in whichever lesson introduces
`docker build` first), e.g.: "If `docker image ls` doesn't show your tag after building, your
builder needs `docker build --load ...`."

## Verified correct

- The `Dockerfile` builds successfully and produces the expected image (`FROM` / `COPY` / `EXPOSE`,
  lines 44-50).
- `docker image inspect ... --format '{{.Config.ExposedPorts}}'` returns `map[80/tcp:{}]`, matching
  the "documents the port... does not publish it" explanation (lines 58-59, 92-95).
- `docker history` shows the base image layers followed by the `COPY site/ ...` layer and the
  `EXPOSE` metadata-only entry (0 bytes), consistent with the lesson's description (lines
  101-111).
- Serving the page via `--publish 8080:80` and fetching it with curl worked correctly before the
  review sandbox's container-lifetime limit was hit on a later run (see
  `review-docker-basics.md`) — this is standard, well-established `docker run --publish` behavior,
  not something specific to this lesson.

No content or explanation errors found.
