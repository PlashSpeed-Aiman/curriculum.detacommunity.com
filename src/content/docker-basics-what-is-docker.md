## What this supplementary lesson adds

The setup lesson got Docker running. This lesson gets the idea across: what Docker is, which problem
it solves, and what is really happening under the hood when a container runs. It is deliberately
short, because it is a beginner module: the goal is an answer you could give a friend over coffee,
not a course in operating systems. The Docker deep-dive module later in this course goes properly
deep into the Linux machinery; here we stay at the level of a confident summary.

Every statement below was checked against Docker's own documentation or the Linux kernel
documentation before it was written.

By the end, you should be able to:

- Name the problem Docker solves without falling back on buzzwords.
- Give a one-sentence definition of an image, a container, and a registry.
- Explain, briefly and correctly, what Linux namespaces and cgroups contribute.
- Contrast a container with a virtual machine.
- Answer the question "what is Docker?" in one confident phrase.

## The problem Docker solves

Before Docker, running someone else's application usually meant collecting its dependencies by hand:
the right language runtime, the right libraries, the right configuration, the right operating system
version. The result was the classic complaint "it works on my machine": the application behaved on
the author's computer and misbehaved everywhere else, because the surroundings were never exactly the
same.

Docker packages the application together with everything it needs to run: code, runtime, system
tools, system libraries, and settings. Docker's own material describes this as a standardized unit of
software that isolates the application from its environment, and the effect is that the same package
works the same way on any computer that runs Docker. The "works on my machine" conversation does not
disappear, but it stops being about missing dependencies: the machine is now inside the package.

## What Docker actually is

Docker's overview page opens with a definition worth remembering, because it is precise and modest:

> Docker is an open platform for developing, shipping, and running applications. Docker enables you
> to separate your applications from your infrastructure so you can deliver software quickly.

Notice what the sentence does not say. Docker is not a programming language, not a cloud, and not a
new operating system. It is a platform with tooling around one idea: an application travels with its
environment, and runs in an isolated, repeatable way.

## The three words your friend will hear

| Word | Meaning, in one sentence |
| --- | --- |
| Image | A read-only package containing the application and everything it needs to run. |
| Container | A running, isolated process created from an image. |
| Registry | A place that stores and shares images; Docker Hub is the public default. |

The image is the artifact that moves. The container is what happens when an image runs: Docker's docs
describe containers as isolated processes that share the same kernel. A container is therefore not a
second computer inside your computer; it is an application process with its own private view of the
system and its own files.

## The two Linux primitives underneath

This is the part where most explanations go wrong, so keep it short on purpose. Containers are made
possible by two features of the Linux kernel, both older than Docker:

- **Namespaces** give a process its own view of the system. Docker's documentation says it directly:
  Docker uses namespaces to provide the isolated workspace called the container. One container may
  see its own process list, its own network interface, and its own filesystem, even though the real
  ones are shared with every other process on the computer.
- **Cgroups** (control groups) are the accounting and limit system. They organize processes into
  groups whose use of resources, such as CPU and memory, can be limited and monitored. A cgroup is
  why one container cannot silently consume the whole computer's memory.

The Linux man pages summarize it elegantly: namespaces make resources appear isolated to the
processes inside them, and one of their documented uses is implementing containers. If your friend
asks one follow-up question, answer that Docker does not invent its own isolation: it puts the Linux
kernel's isolation to work.

## Containers versus virtual machines

A common question is "so it is like a VM?" The honest short answer: containers and VMs both package
and isolate software, and they are different in where the boundary sits.

| | Virtual machine | Container |
| --- | --- | --- |
| What runs inside | A whole operating system with its own kernel | One or a few isolated processes |
| What is shared | Nothing; the guest does not share the host kernel | The host's Linux kernel |
| Weight | Heavy: a full OS per VM | Light: the kernel is already running |

Docker's documentation puts the contrast in one line: a virtual machine is an entire operating system
with its own kernel, while a container is an isolated process with the files it needs. That shared
kernel is exactly why containers start in seconds and why they are efficient: there is no second
operating system to boot. The trade-off deserves one honest sentence too: because containers share
the host kernel, their isolation is process-level, not the full-machine boundary of a VM. For
packaging an application, that is usually exactly the right tool; it is a packaging story first, and
the course returns to the boundaries later.

## Docker on macOS and Windows

One subtlety your friend may hit: Docker containers are Linux processes, so how do they run on a
Mac or a Windows laptop? They run inside a Linux environment that Docker Desktop manages. On
Windows, Docker Desktop runs inside WSL 2, which Microsoft built as a full Linux kernel; on macOS,
Docker Desktop provides the Linux environment the containers need. The container itself is still a
Linux process either way; Docker arranges the Linux it runs on.

## A short, honest history

Keep the history to three sentences, all of them checkable:

1. Docker launched in 2013 and quickly popularized application containers.
2. It did not invent the underlying ideas: it built on Linux primitives, namespaces and cgroups,
   that existed before it.
3. Early Docker used the LXC project as an execution driver, and Docker's own blog records how a
   replacement called libcontainer became the default in Docker 0.9, with LXC kept as an option.

If the friend is still curious after that, point them at the deep-dive module of this course, which
spends real time on LXC, cgroups, and namespaces.

## So to answer your friend, Docker is ...

Here is the whole lesson in one phrase. It is written to be said out loud, and every clause in it was
explained above:

> Docker is a tool that packages an application with everything it needs to run, and then runs that
> package as an isolated, lightweight process that behaves the same on any computer running Docker.

If saying that feels too long, the phrase survives being cut down. What matters is that the sentence
does not contain a single unexplained claim:

- "Packages an application with everything it needs to run" is the image: code, runtime, libraries,
  and settings travel together.
- "Runs that package as an isolated process" is the container, and the isolation comes from Linux
  namespaces giving the process its own view of the system.
- "Lightweight" is the contrast with virtual machines: no second operating system is booted, because
  the container shares the kernel of the computer it runs on, and cgroups keep its resource use in
  check.
- "Behaves the same on any computer running Docker" is the payoff: the image is a fixed artifact,
  shared through a registry, and the platform runs it consistently. The one honest caveat, for
  advanced friends only: "any computer" assumes an architecture the image supports, which is why
  multi-architecture images exist.

## Practice

1. Say the phrase out loud twice. The second time, do not look at the screen.
2. Write your own version in exactly two sentences. Compare each word against the sections above and
   strike anything you cannot defend.
3. Explain to someone else why a container is not a small virtual machine.
4. Open the "What is Docker?" page in Docker's documentation and find the three words: platform,
   separate, deliver.

## Check your understanding

- What problem does packaging an application with its dependencies solve?
- What is the difference between an image, a container, and a registry?
- Which Linux primitives make containers possible, and what does each one contribute?
- Why does a container start faster than a virtual machine, and what does the container give up in
  exchange?
- Where do containers run on a Windows laptop that has Docker Desktop installed?

## Primary references

- [What is Docker? (Docker documentation overview)](https://docs.docker.com/get-started/docker-overview/)
- [What is a container?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/)
- [What is an image?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/)
- [What is a registry?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-registry/)
- [What is a container? (Docker Inc. explainer)](https://www.docker.com/resources/what-container/)
- [Why Docker](https://www.docker.com/why-docker/)
- [Linux namespaces (man page)](https://man7.org/linux/man-pages/man7/namespaces.7.html)
- [Linux cgroups (man page)](https://man7.org/linux/man-pages/man7/cgroups.7.html)
- [Docker Desktop and WSL 2](https://docs.docker.com/desktop/features/wsl/)
- [Docker 0.9: execution drivers and libcontainer (Docker blog)](https://www.docker.com/blog/docker-0-9-introducing-execution-drivers-and-libcontainer/)
