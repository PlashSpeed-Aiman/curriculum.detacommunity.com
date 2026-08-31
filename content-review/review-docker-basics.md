# Review: docker-basics.md

No Dockerfile or build step here, so this lesson is unaffected by the `--load` issue found in the
other Dockerfile lessons (see below). Commands and the image/container mental model were checked
against current Docker CLI behavior and documentation.

## Verified correct

- `docker run --name curriculum-web --publish 8080:80 nginx` (no `--detach`) does run in the
  foreground and blocks the terminal, matching the instruction to "open another terminal" for
  `docker ps` (lines 19-42).
- `docker stop` / `docker ps --all` / `docker rm` sequence and behavior (lines 44-60).
- The image vs. container mental model (lines 62-66) is accurate.

## Not independently re-verified

Could not keep a long-running detached container alive in this review sandbox specifically
(`can't fork: Resource temporarily unavailable` — a resource limit of the review environment, not
Docker or the lesson) so the "Nginx welcome page opens in the browser" claim on line 34 was not
re-confirmed by a live fetch. This is completely standard, well-documented `docker run --publish`
behavior and not a novel or version-sensitive claim, so it was not treated as a risk.

## No issues found.
