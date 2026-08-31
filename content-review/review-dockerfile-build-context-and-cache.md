# Review: dockerfile-build-context-and-cache.md

Built the lesson's example Node Dockerfile and reproduced its cache claims with
`docker build --progress=plain`, run twice with different kinds of changes.

## Reproducibility risk: same `--load` gap as the other Dockerfile lessons

`src/content/dockerfile-build-context-and-cache.md:62-79`

The `docker build --progress=plain --tag cache-example:dev .` commands have the same issue
documented in `review-dockerfile-first-image.md` and
`review-dockerfile-image-layers-deep-dive.md`: on a `docker-container` buildx builder, the image is
not loaded into the local store without `--load`. Confirmed here too. Same fix: a one-line note
about `--load` when the image doesn't show up in `docker image ls`.

## Verified correct

- **Cache reuse on source-only change** (lines 30-56, 66-67): built the example once, changed only
  the application source file, rebuilt with `--progress=plain` — `COPY package.json
  package-lock.json ./` and `RUN npm ci` were both reported `CACHED`, and only the final `COPY . .`
  step re-ran. Matches the lesson's claim exactly.
- **Cache invalidation on lockfile change** (lines 69-70): changed `package-lock.json` only and
  rebuilt — `RUN npm ci` correctly re-ran (no longer cached), while `WORKDIR` stayed cached. Matches
  "Docker correctly reruns the dependency installation."
- **`.dockerignore` behavior** (lines 13-24): added a `node_modules` entry to `.dockerignore` and a
  real `node_modules/marker.txt` file, then built a Dockerfile that runs `RUN ls -la /app` — the
  ignored directory did not appear in the build context or the resulting layer. Matches "This file
  changes what Docker sends as build context."

## No content or explanation errors found beyond the shared `--load` note above.
