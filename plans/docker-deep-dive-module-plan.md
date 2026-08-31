# Plan: Docker Deep-Dive Module

Status: **draft outline, pre-research**. Nothing here is wired into the app. No `contentFile`
exists yet for any lesson below — per `lesson-contribution-guidelines.md`, a planned lesson stays
unavailable until its Markdown, metadata, and route are actually connected. Treat this file as the
reading/writing target, not as something to copy into `curriculum.ts` yet.

## Where this fits

Target: `docker` course → module `docker-deep-dive` (number `04`, slug `deep-dive`) in
`src/data/curriculum.ts`. That module record already exists with an empty `lessons: []`, following
directly after `docker-compose`. Its current title/summary:

- title: "Docker deep-dive (LXC, cgroups, namespaces)"
- summary: "Understand the Linux primitives that make containers possible."

Both still read fine against the outline below; revisit only if the final lesson set drifts from
"the primitives + runtime chain," e.g. if capabilities/seccomp end up core rather than
supplementary.

## Premise

Docker didn't invent isolation — it packaged kernel primitives (namespaces, cgroups) that LXC was
already driving, added a layered image format and a friendlier daemon/CLI/API on top, and later
handed the runtime layer to open standards (OCI, runc, containerd). This module's job is to make
that chain visible, using the existing course as scaffolding: `docker-basics` already showed
*running* a container, `dockerfiles` already showed *building* an image and diffing its layers,
`docker-compose` already showed multi-container networking/volumes from the outside. This module
goes underneath all three.

## Draft lesson sequence (core)

Ordered as the required path. Each should end up with one primary outcome per
`lesson-contribution-guidelines.md`.

1. **Namespaces: the isolation primitive**
   id: `docker-deep-dive-namespaces` · category: `Docker / deep dive`
   Outcome: explain what each Linux namespace (PID, mount, network, UTS, IPC, user, cgroup) isolates,
   and observe them on a real running container.
   Research before writing: `namespaces(7)` man page as primary source; verify with `lsns`,
   `nsenter`, `docker inspect` (or `/proc/<pid>/ns/`) against an actual running container rather than
   asserting behavior from memory.

2. **Cgroups: the resource-limiting primitive**
   id: `docker-deep-dive-cgroups` · category: `Docker / deep dive`
   Outcome: explain cgroups v1 vs v2 (unified hierarchy) and trace a `docker run --memory=...` flag to
   the actual cgroup file it writes.
   Research: `cgroups(7)`, the controllers that matter here (cpu, memory, pids, io), and which
   version the learner's Docker install actually uses by default — this has changed across distro/
   Docker versions, verify rather than assume.

3. **Layered filesystems: how an image becomes a container**
   id: `docker-deep-dive-overlayfs` · category: `Docker / deep dive`
   Outcome: explain OverlayFS (lowerdir/upperdir/merged) and connect it to the layer mechanics
   already taught in `dockerfiles-image-layers-deep-dive` (supplementary lesson in the `dockerfiles`
   module) — this lesson should build on that one, not re-teach it.
   Research: OverlayFS kernel docs, `docker inspect` GraphDriver output on a real image.

4. **Build a container by hand**
   id: `docker-deep-dive-build-by-hand` · category: `Docker / deep dive`
   Outcome: hand-assemble an isolated process with `unshare`, `pivot_root`, and manual cgroup limits —
   no `docker` binary involved — to make lessons 1–3 concrete.
   Research: Liz Rice's "Containers From Scratch" talk is the canonical walkthrough; cross-check
   commands against `unshare(1)` and `pivot_root(2)`. Flag explicitly in the lesson that this needs a
   real or virtualized Linux kernel — it will not work the same way through Docker Desktop's VM on
   macOS/Windows. Confirm that caveat before writing it; don't assert it from memory.

5. **From LXC to Docker: the runtime chain**
   id: `docker-deep-dive-runtime-chain` · category: `Docker / deep dive`
   Outcome: explain what LXC provided, what Docker added on top of it, and trace `docker run` through
   `dockerd` → `containerd` → `containerd-shim` → `runc`, naming where the OCI runtime-spec and
   image-spec constrain each hop.
   Research: OCI `runtime-spec`/`image-spec` repos, containerd architecture docs, runc README/docs,
   Docker Engine architecture docs. This is the lesson most likely to contain version-specific claims
   (component names/versions have shifted since Docker's 2017 containerd donation) — verify current
   architecture from primary docs before writing, per the agent guidance against inventing
   version-specific detail.

## Draft lesson sequence (supplementary)

Optional deep dives below the required sequence, per the `supplementaryLessons` pattern.

6. **Capabilities and seccomp: shrinking root**
   id: `docker-deep-dive-capabilities-seccomp` · category: `Docker / deep dive`
   Outcome: explain Linux capabilities and seccomp, and read/modify a container's capability set and
   seccomp profile.
   Research: `capabilities(7)`, Docker's default seccomp profile (verify current source rather than
   quoting an old version), `--cap-drop`/`--cap-add`/`--security-opt` flags.

7. **Container networking internals**
   id: `docker-deep-dive-networking-internals` · category: `Docker / deep dive`
   Outcome: explain how a bridge network is actually built — network namespaces, veth pairs,
   iptables/nftables rules — as the "under the hood" companion to the already-published
   `docker-compose-networking` lesson. Build on that lesson's vocabulary; don't re-teach Compose
   usage here.
   Research: `veth(4)`, Linux bridging docs, and hands-on inspection with `docker network inspect` +
   `ip link` + `iptables -L` (or `nft list ruleset`) against a real bridge network.

## Explicit non-goals for this module

Keeping scope tight per `AGENTS.md` ("keep the first release focused"). Do not fold these in without
a deliberate scope decision recorded here first:

- Orchestration (Swarm, Kubernetes vocabulary) — belongs in a later module/course, not this one.
- Runtime landscape (Podman, gVisor, Kata, WASM/WASI) — interesting context, not this module's job.
- Registry internals, image signing/SBOM — security-adjacent but a different focus than "how does a
  running container work."

## Open questions to settle after your reading pass

- Does "build a container by hand" (lesson 4) land better *before* the individual namespaces/cgroups
  lessons (motivate first, then explain) or after (explain first, then prove it)? Current draft:
  after.
- Should capabilities/seccomp or networking internals be promoted to core instead of supplementary?
  Current call: both supplementary, since neither blocks understanding the other core lessons.
- Confirm the module title/summary still fit once the lesson set is final — current title already
  names LXC, cgroups, namespaces, which still tracks.

## Definition of done for this plan

This file is done being a *plan* when each lesson above has: a confirmed outcome statement, a
research source list you've actually read (not just named), and a yes/no on core vs. supplementary.
Turning it into real content is a separate pass that follows `lesson-contribution-guidelines.md` in
full — Markdown file, `CurriculumLesson` record, raw import + `markdownByFile` entry, route
verification, and `npm run build`.
