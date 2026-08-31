# Review: dockerfile-image-layers-deep-dive.md

Reviewed against a live Docker install (Docker 5.8.1 / BuildKit) by actually running the lab end
to end, not just reading it.

## Confirmed bug: Step 4/5's "use the manifest order" instruction doesn't work

`src/content/dockerfile-image-layers-deep-dive.md:120-181`

Built the three-stage lab, ran `docker save`, and unpacked the archive. On current Docker
(BuildKit-produced saves), the archive contains two unrelated layer representations:

- `manifest.json`'s `Layers` array lists flat top-level files like `7211d01a....tar`,
  `33fb1ebb....tar`, etc. — correctly ordered bottom-to-top.
- Separate legacy per-directory entries (`<v1-id>/layer.tar`, `<v1-id>/json`, `<v1-id>/VERSION`) —
  the format `find -name layer.tar` (line 138) actually finds.

These two sets use completely different hash namespaces for the same content — the manifest's
digests never appear as directory names, so there is no way to "use the manifest order to
identify those final three archives" (line 142-143) among the `find` results as instructed.
Worse, sorting the `find` output alphabetically (as literally shown) does not reflect build order
— in the test run it came out step-two, step-one, step-three, base-image (base sorted last, not
first). A learner following the lesson literally would mislabel `<layer-two>` as the step-three
layer and `<layer-three>` as the alpine base layer, then get nonsense/huge output from the Step 5
diffs and `tar -xOf` commands.

**Fix**: parse `manifest.json`'s `Layers` array directly (e.g.
`jq -r '.[0].Layers[]' <(tar -xOf layer-lab.tar manifest.json)`) to get the correctly ordered flat
tar filenames, and operate on `layer-lab-archive/<hash>.tar` directly — drop the
`find -name layer.tar` step, or explicitly note it surfaces an unrelated legacy structure not
usable for ordering.

## Reproducibility risk: Step 1 build may not tag the image

`src/content/dockerfile-image-layers-deep-dive.md:50-58`

On a `docker-container` buildx builder — common for anyone set up for multi-platform builds —
`docker build --tag ...` prints "Build result will only remain in the build cache" and does not
add the image to the local store. Reproduced directly: `docker image ls | grep layer-lab` came
back empty after following the lesson's exact commands, which would make every later
`docker create`/`docker run`/`docker save` fail with "No such image," with no explanation in the
lesson.

**Fix**: add one line, e.g. "If `docker image ls layer-lab` is empty, your builder needs
`docker build --load ...`."

## Verified correct

- `docker history --no-trunc` output and ordering (lines 63-69).
- `docker image inspect ... RootFS.Layers` ordering (lines 73-80).
- The export/diff comparison of visible files across step-1/2/3 (lines 90-108) — exact match to
  observed output.
- The `docker run ... cat` content checks (lines 112-118).
- The whiteout explanation and the `.wh.first.txt` mechanism (lines 165-171) — verified
  byte-for-byte against the actual layer archive.
- The layer-content table (lines 160-164).
- `docker diff` letter codes and general mechanics (lines 183-205) — command syntax and semantics
  are correct; the detached long-running container could not be kept alive in the review sandbox
  to fully re-verify output, which looks like a sandbox limitation rather than a lesson issue.
