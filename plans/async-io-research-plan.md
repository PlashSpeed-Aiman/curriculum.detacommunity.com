# Plan: Async I/O — Research & Reading

Status: **draft outline, pre-research**. Nothing here is wired into the app. No course, module, or
`contentFile` exists yet for this topic — per `lesson-contribution-guidelines.md`, a planned lesson
stays unavailable until its Markdown, metadata, and route are actually connected. Treat this file as
the reading/writing target, not as something to copy into `curriculum.ts` yet.

## Where this fits

Not yet decided. Two live candidates in `src/data/curriculum.ts`:

- Course `05` **Operating systems** (currently no modules) — Async I/O as kernel primitives:
  descriptors, blocking vs. non-blocking, `select`/`poll`/`epoll`, io_uring.
- Course `03` **Backend development** (currently has 7 empty modules) — Async I/O as an applied
  runtime concern: `async`/`await`, thread-pool starvation, why it lets a web server scale.

Both stay open until after the reading pass (see "Open questions" below). This plan is written so
either destination — or both, OS as primitives / Backend as an applied follow-on, the way
`docker-deep-dive` builds on `docker-basics` — can consume it without rewriting it.

## Premise

"Async I/O" is usually taught starting from `async`/`await`, which explains the syntax but skips the
question it exists to answer: what does a thread do while it waits, and why does that matter at
scale? The ladder below starts underneath the keyword, at the syscall boundary, and only reaches
`async`/`await` at the end — once there's a concrete mechanism for it to compile onto.

## Topic ladder (research sequence)

Each rung is one question; the answer motivates the next rung. Start at rung 1.

1. **What I/O actually is**
   Outcome: explain the `read`/`write` syscall boundary, kernel buffers, what "blocked" means to the
   scheduler, and the real cost of a syscall + context switch.
   Research: `read(2)`, `write(2)`; CS:APP Ch. 10.

2. **Thread-per-connection, and where it breaks**
   Outcome: explain the naive threaded-server model and quantify why it stops scaling — stack memory
   per connection, scheduler pressure, context-switch cost. This is the C10K framing.
   Research: Dan Kegel, "The C10K Problem"; CS:APP Ch. 12 (thread-based version of its echo server).

3. **Non-blocking descriptors**
   Outcome: explain `O_NONBLOCK`, `EAGAIN`/`EWOULDBLOCK`, and why naive polling in a loop burns a
   core — motivating multiplexing.
   Research: `fcntl(2)`, TLPI Ch. 5.

4. **Readiness multiplexing**
   Outcome: explain `select` → `poll` → `epoll`/`kqueue`; why the first two are O(n) in watched
   descriptors, what `epoll` changes, level- vs. edge-triggered notification.
   Research: `select(2)`, `poll(2)`, `epoll(7)`, `kqueue(2)` (BSD/macOS manual); UNIX Network
   Programming Vol. 1 Ch. 6; TLPI Ch. 63; Lemon, "Kqueue" (USENIX 2001).

5. **Readiness vs. completion**
   Outcome: state the two models explicitly. Why POSIX AIO disappointed, what Linux `libaio` could
   and couldn't do, and IOCP on Windows as the completion archetype.
   Research: `aio(7)`; libuv design-overview docs (how one library reconciles `epoll`, `kqueue`, and
   IOCP behind one API — that reconciliation *is* this rung); *Windows Internals* Part 2 for IOCP,
   reference only.

6. **io_uring**
   Outcome: explain the shared submission/completion ring buffers, why it removes the
   syscall-per-operation tax, registered buffers/files, and the current security/adoption caveats.
   Research: `io_uring(7)`, `io_uring_setup(2)`, `io_uring_enter(2)`, `liburing` repo; Jens Axobe,
   "Efficient IO with io_uring" (the design doc from its author — most load-bearing source for this
   rung); LWN.net's io_uring coverage from the 2019 introduction onward. Most version-sensitive rung
   in the ladder — confirm current feature surface and distro security posture from primary sources,
   don't assert from memory or a secondary article.

7. **Above the syscall: event loops and `async`/`await`**
   Outcome: explain the event loop (reactor vs. proactor pattern), and how coroutines and
   `async`/`await` compile down onto it. "There is no thread." Function color. Structured
   concurrency.
   Research: OSTEP "Event-based Concurrency (Advanced)"; Redis `ae.c` (a complete, small event loop
   with `select`/`epoll`/`kqueue` backends); Stephen Cleary, "There Is No Thread"; Bob Nystrom,
   "What Color Is Your Function?"; Nathaniel J. Smith, "Notes on Structured Concurrency."

## Reading spine — direct answer to "which CS fundamentals books"

Four items, in this order. Read these first; everything below is optional depth.

1. **Operating Systems: Three Easy Pieces** — Arpaci-Dusseau & Arpaci-Dusseau (free online). Read
   the Concurrency section, then "Event-based Concurrency (Advanced)." Cheapest entry point, and it
   gives the mental model before any syscall detail. Supports rungs 1–2, 7.
2. **Computer Systems: A Programmer's Perspective**, 3rd ed. — Bryant & O'Hallaron. Ch. 10
   "System-Level I/O" and Ch. 12 "Concurrent Programming," which builds the same echo server three
   ways: process-based, I/O-multiplexing-based, thread-based. The single best fundamentals answer to
   this question. Supports rungs 1–4.
3. **UNIX Network Programming, Vol. 1**, 3rd ed. — Stevens, Fenner, Rudoff. Ch. 6 "I/O
   Multiplexing." Its five-I/O-models taxonomy (blocking, non-blocking, multiplexing, signal-driven,
   asynchronous) is the vocabulary every later article assumes you already have. Dated on APIs,
   still the canonical framing. Supports rungs 3–5.
4. **The Linux Programming Interface** — Kerrisk. Ch. 63 "Alternative I/O Models" is the
   reference-grade treatment of `select`/`poll`/`epoll` and signal-driven I/O; Ch. 5 for
   `O_NONBLOCK`; sockets chapters for context. Supports rungs 3–5.

No book covers rung 6 well — io_uring is younger than all four. That rung is read from primary
sources below, not from a book.

## Extended reading list, by type

### Books (beyond the spine)

- *Advanced Programming in the UNIX Environment*, 3rd ed. — Stevens & Rago. Ch. 14 "Advanced I/O."
  Heavy overlap with TLPI; pick one, not both.
- *Systems Performance*, 2nd ed. — Brendan Gregg. Not for the model, for proving claims — read it
  when you want to *measure* the difference between models rather than assert it.
- *Concurrency in C# Cookbook*, 2nd ed. — Stephen Cleary. If this lands in the Backend course, this
  plus Cleary's "There Is No Thread" is the applied `async`/`await` layer. Rung 7.
- *Node.js Design Patterns* — Casciaro & Mammino. The reactor pattern and event loop from the
  application side. Rung 7.
- *Windows Internals*, Part 2 — Russinovich et al. The I/O system and completion ports, for the
  completion-model half of rung 5. Reference only, don't read cover to cover.

### Primary specs & man pages (read these directly, not summaries)

- man7.org: `select(2)`, `poll(2)`, `epoll(7)`, `fcntl(2)`, `aio(7)`, `eventfd(2)`, `signalfd(2)`,
  `timerfd_create(2)`, `socket(7)`, `tcp(7)` — same author as TLPI, canonical reference for rungs
  1, 3, 4, 5.
- `io_uring(7)`, `io_uring_setup(2)`, `io_uring_enter(2)`, `liburing` repo — rung 6.
- `kqueue(2)` in the FreeBSD/macOS manual — the BSD counterpart to `epoll`. Rung 4.
- Jens Axboe, "Efficient IO with io_uring" — rung 6.

### Papers

- Lauer & Needham, "On the Duality of Operating System Structures" (1979). Threads and events are
  duals — the argument that keeps resurfacing. Rung 7.
- Pai, Druschel & Zwaenepoel, "Flash: An Efficient and Portable Web Server" (USENIX ATC 1999). The
  canonical writeup of the event-driven-server architecture.
- Lemon, "Kqueue: A Generic and Scalable Event Notification Facility" (USENIX 2001). Rung 4.
- Welsh, Culler & Brewer, "SEDA: An Architecture for Well-Conditioned, Scalable Internet Services"
  (SOSP 2001). The staged middle ground.
- von Behren, Condit & Brewer, "Why Events Are a Bad Idea (for High-Concurrency Servers)"
  (HotOS 2003). Read directly against SEDA — the disagreement is the lesson.

### Long-form articles

- Dan Kegel, "The C10K Problem." Framing document for rung 2.
- LWN.net's io_uring coverage (Corbet's articles, 2019 introduction onward). Rung 6.
- Stephen Cleary, "There Is No Thread." Clearest correction of the most common misconception about
  `async`/`await`. Rung 7.
- Bob Nystrom, "What Color Is Your Function?" (2015). Standard critique of the async/sync split.
- Nathaniel J. Smith, "Notes on Structured Concurrency, or: Go Statement Considered Harmful" (2018).

### Readable source code

Worth more than another article at rungs 4 and 7.

- Redis `ae.c` — a complete, small event loop with `select`/`epoll`/`kqueue` backends.
- libuv's design-overview docs — how one library reconciles `epoll`, `kqueue`, and IOCP behind one
  API. That reconciliation *is* rung 5.

No live URLs are recorded here since none were fetched and verified in this session — search each
title/author against man7.org, LWN.net, USENIX, or the named repo rather than trusting a pasted link
found elsewhere.

## Hands-on track

Reading alone doesn't make this topic stick. Write one echo server, rewritten five times against the
same protocol and measured under the same load:

1. thread-per-connection
2. non-blocking busy-loop
3. `select`
4. `epoll`
5. `io_uring`

Rungs 1–6 become observable instead of asserted, and the measurements become material for the
writing itself. CS:APP Ch. 12 supplies the first three versions almost directly, which is a large
part of why it's in the spine.

## Explicit non-goals for this pass

- Windows IOCP as a hands-on target — named at rung 5 for the completion-model contrast, not built.
  The repo's existing Docker material is Linux-centric; revisit only if Backend/ASP.NET Core
  placement makes Windows-side behavior load-bearing.
- Language runtimes' internal scheduler implementations (e.g., Go's netpoller, Tokio's reactor) —
  interesting, but a different, narrower module than this one.

## Open questions to settle after the reading pass

- Placement: OS course (primitives) vs. Backend course (applied `async`/await in ASP.NET Core) vs.
  both, with the OS module as prerequisite to a shorter Backend follow-on. Deferred — revisit once
  the ladder has been read and the natural split is obvious.
- Language for the hands-on track: C keeps it closest to the syscalls and matches every book in the
  spine; C# matches the existing Backend course. Splitting rungs 1–6 in C and rung 7 in C# is the
  likely answer but shouldn't be fixed yet.
- Whether rung 7 (`async`/`await`, function color, structured concurrency) is the tail of this module
  or the head of a separate one.

## Definition of done for this plan

This file is done being a *plan* when each rung above has: a confirmed outcome statement, a research
source list you've actually read (not just named), and a working program in the hands-on track for
rungs 1–6. Turning it into real content is a separate pass that follows
`lesson-contribution-guidelines.md` in full — Markdown file, `CurriculumLesson` record, raw import +
`markdownByFile` entry, route verification, and `npm run build`.
