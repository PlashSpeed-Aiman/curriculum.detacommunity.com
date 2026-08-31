# Review: dockerfile-multi-stage-production.md

Built the lesson's multi-stage `Dockerfile` against a stub Vite-like project (a `package.json`
whose `build` script writes a `dist/index.html`), then inspected the resulting image directly.

## Reproducibility risk: same `--load` gap as the other Dockerfile lessons

`src/content/dockerfile-multi-stage-production.md:41-72`

Same issue as the other three Dockerfile lessons (see
`review-dockerfile-first-image.md`): `docker build --tag ...` needs `--load` under a
`docker-container` buildx builder or the image never reaches `docker image ls`. Confirmed with this
lesson's own build and `--target build` commands too.

## Verified correct

- **The runtime stage excludes build-only content** (lines 34-36, 62): unpacked the final image
  with `docker save` and inspected the layer added by `COPY --from=build /app/dist
  /usr/share/nginx/html` directly — it contained exactly one file, `usr/share/nginx/html/index.html`.
  No `node_modules`, no source files, no Node binaries anywhere in the final image's layers.
- **Size difference between stages** (implied by "reduce the runtime surface", lines 74-76): the
  `production` image (`--target` unset, final stage) was 49.7MB; building with `--target build`
  produced a 169MB image containing the full Node toolchain. Confirms the pattern is doing real
  work, not just relabeling.
- **`docker history` on the final image** (lines 58-59): shows the Nginx base layers, the
  `COPY /app/dist ...` layer, and `EXPOSE`/`CMD` metadata — no trace of the `npm ci` or build-stage
  layers, consistent with "The final image should contain the Nginx runtime and built files, not
  the Node dependency tree."
- **`docker build --target build`** (lines 68-70) correctly stops at the named stage and produces a
  separate, larger image, as described.

No content or explanation errors found beyond the shared `--load` note above.
