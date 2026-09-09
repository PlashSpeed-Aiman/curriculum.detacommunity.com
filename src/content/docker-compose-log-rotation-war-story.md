## What this supplementary lesson adds

The Compose lessons so far describe stacks that work. This one describes a stack that quietly stopped
working in production, and it follows the investigation from the first alert to the lasting fix.

A client reported a server whose disk was completely full. The container that died first was a MongoDB
7.0 container started by Compose. By the end of this lesson, you should be able to:

- Explain why the default `json-file` logging driver can fill a disk when no rotation is configured.
- Configure per-service log rotation in a Compose file with the `logging` attribute.
- Recreate a container so new logging options actually take effect, and verify them with
  `docker inspect`.
- Describe how multiple `-f` Compose files merge, and why field edits to a live Compose file are risky.
- Explain MongoDB's `diagnostic.data` capture and why a full disk can stop `mongod` rather than only
  degrade it.

The server address and container identifiers from the original incident are omitted; the commands are
shown as they were run.

## The incident

The report arrived as a quiet message: "the disk is 99% full." One command on the server confirmed the
fear:

```
/dev/vda1  29G  29G  0  100% /
```

Zero bytes free on a 29 GB disk, and somewhere in that wreckage a MongoDB container was crashing.
The incident unfolded in four stages.

### Stage 1: find what ate the disk

`du` walked up the directory tree: `/var` → `/var/lib` → `/var/lib/docker` → `/var/lib/docker/containers`.
There was the smoking gun, a single container log file holding roughly 11 GB:

```
11123085312  .../containers/23ae300e8be1.../23ae300e8be1...-json.log
```

The file belonged to the `connex-mongodb` container, which ran `mongo:7`.

### Stage 2: understand why MongoDB was crashing

The log showed MongoDB repeatedly failing to write its diagnostic data capture:

```
"msg": "Writing fatal message",
"attr": {"message": "DBException::toString(): FileStreamFailed:
Failed to write to interim file buffer for full-time diagnostic
data capture: /data/db/diagnostic.data/metrics.interim.temp ..."}
```

The disk and the container were stuck in a cycle:

1. The disk filled up.
2. MongoDB could not write, crashed, and the container restarted.
3. Each crash produced more log output, which Docker appended to the same unbounded log file.
4. Repeat until the disk is 100% full and the container is crash-looping.

### Stage 3: the emergency fix

The immediate move freed the space in seconds:

```bash
sudo truncate -s 0 .../23ae300e8be1...-json.log
```

The disk went from 100% to roughly 65% used, and the database container recovered on its own:

```
connex-mongodb  Up 4 days (healthy)
```

### Stage 4: the lasting fix

Log rotation was added to the Compose file. The container was then recreated:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d mongodb
```

`docker inspect` confirmed the new configuration on the recreated container:

```json
"LogConfig": {
    "Type": "json-file",
    "Config": {
        "max-file": "3",
        "max-size": "50m"
    }
}
```

The log that had reached 11 GB was now capped at three files of 50 MB each.

## Why the default logging setup made this possible

Docker captures the standard output and standard error of every container and stores them in files.
By default the daemon uses the `json-file` logging driver, and that driver performs no log rotation
unless you configure it: `max-size` defaults to unlimited, and `max-file` is only effective when
`max-size` is also set. Every container is therefore a potential disk bomb by default. The official
guidance is blunt: the `json-file` driver can use a significant amount of disk space for containers
that generate much output, which can lead to disk exhaustion. This is not an exotic corner case; it is
the default behavior the incident ran into.

On a Linux host with the default data root, container logs live under `/var/lib/docker/containers/`,
but the exact layout is not something you should memorize. Ask Docker where the file is instead:

```bash
docker inspect --format '{{.LogPath}}' connex-mongodb
```

Two details made MongoDB fail first instead of merely degrading. Both are documented MongoDB behavior,
not bugs in the application code:

- With no logging configuration of its own, `mongod` sends all log output to standard output. In a
  container, standard output is exactly what Docker stores, so a crashing database writes directly
  into the container log.
- Full-Time Diagnostic Data Capture (FTDC) writes small files into a `diagnostic.data` directory
  under the database path, `/data/db/diagnostic.data` when the default `dbPath` is used. FTDC thread
  failures are treated as fatal: MongoDB documents that an FTDC thread failure stops the parent
  `mongod` process. On a full disk, the failure to write `metrics.interim.temp` was therefore not a
  warning — it was a shutdown signal.

That combination is why the container log grew without mercy: a database that cannot write its
diagnostics dies loudly, and every death is appended to the very log that is consuming the disk.
MongoDB overwrites older data as the `diagnostic.data` folder approaches its size limit, so the
folder itself is bounded — the unbounded part was the container's JSON log.

## Rotation belongs in the Compose file

The durable fix is a `logging` block on the service. Compose passes the driver and its options to the
container when it is created:

```yaml
services:
  mongodb:
    image: mongo:7
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "3"
```

Reading the block against the defaults makes the intent explicit:

| Option | Default | In this fix | Effect |
| --- | --- | --- | --- |
| `driver` | `json-file` | `json-file` | Where the daemon stores the container's stdout and stderr |
| `max-size` | unlimited (`-1`) | `50m` | Roll the active log when it reaches this size |
| `max-file` | `1` | `3` | Keep this many rotated files; only effective with `max-size` |

Setting `max-size` to `50m` and `max-file` to `3` means Docker keeps the current file plus two
rotated files, and removes older ones. The incident's 11 GB single file becomes at most 150 MB of
retained history.

Rotation is a property of the container, not of the Compose file. A container that already exists
keeps the logging options it was created with. That is why the fix ended with a recreate rather than
an edit: `docker compose up -d mongodb` recreated the service because its configuration had changed,
and only then did the `LogConfig` output above appear. Editing the file alone would have left the
running container unrotated.

If you manage a whole daemon rather than one project, the same options can be set globally in
`daemon.json` under `log-driver` and `log-opts`. Docker also ships a `local` driver that performs log
rotation by default and is recommended over `json-file` where backwards compatibility does not force
your hand. What you must not do is rely on the defaults in either place.

## An honest note about the emergency fix

The story's `truncate -s 0` saved the server, and truncating a file that a process keeps open is a
standard Unix way to reclaim space without restarting that process. It deserves one qualification
though: Docker documents `json-file` log files as files that are designed to be exclusively accessed
by the daemon, and warns that interacting with them with external tools may interfere with Docker's
logging and cause unexpected behavior. In this incident the truncation was a measured emergency move
on a server that had minutes of disk left; the supported, repeatable fix was the rotation
configuration above plus a container recreate. Reach for the emergency measure only when the disk is
already the incident, and treat rotation as the actual resolution.

## The trap that nearly bit the engineer

The fix itself was nearly lost while editing the Compose file over SSH. Quoting layers — PowerShell,
then `ssh`, then the remote shell, then a `sed` one-liner — mangled the intent three times:

- An escaped `\n` inserted a literal backslash-n into the YAML.
- A Python one-liner was rewritten by the local shell's parser.
- A Python script truncated the file before erroring, silently deleting the `neo4j` service and the
  `networks:` block mid-operation.

Two habits turned that around. First, a backup: `docker-compose.yml.bak` was a single `cp` away, and
`diff` confirmed the final file differed only in the intended logging block. Second, validation before
activation: `docker compose config` parses the merged model and prints it, which catches a corrupted
file before it reaches a running stack.

The deploy command is also worth reading closely:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d mongodb
```

The stack ran from two files. Compose merges files in the order they appear on the command line, and
later files may override or add to earlier ones: for a single-value option such as `image`, the later
value replaces the earlier one, while multi-value fields merge with local values taking precedence.
File order is therefore part of the configuration. A stray edit to the wrong file can silently change
which settings win, which is another reason the backup and the `docker compose config` check mattered.

## What to remember

1. **A full disk is a cascade, not an event.** The first casualty is usually not whatever filled the
   disk — it is the process that cannot write anymore, and its failure output makes the disk fuller.
2. **The default Docker logging setup is ungoverned.** `json-file` stores stdout and stderr without
   rotation unless you configure `max-size` and `max-file`. Cap logs before a container becomes a
   disk bomb, in the Compose file or in `daemon.json`.
3. **New logging options need a new container.** Editing a Compose file changes the recipe; the
   running container keeps its old behavior until it is recreated. Verify with `docker inspect`.
4. **MongoDB is loud when its diagnostics fail.** FTDC write failures are fatal to `mongod`, and
   `mongod` logs to stdout by default, so a full disk turns a database into a log generator.
5. **Back up config before editing it in the field.** Quoting layers corrupt intent eventually. A
   `.bak` file and a `docker compose config` check separate a five-minute fix from a restoration
   project.

## Practice

Run through the mechanics locally with disposable containers. Never practice the emergency part on a
server you cannot afford to interrupt.

1. Check the daemon's default logging driver: `docker info --format '{{.LoggingDriver}}'`.
2. Start a small container that prints repeatedly, then read its host log path with
   `docker inspect --format '{{.LogPath}}' <name>`. On Linux, inspect the file's size growth on the
   host (reading `/var/lib/docker` usually needs root).
3. Add a `logging` block with `max-size: "1m"` and `max-file: "2"` to a service in a scratch Compose
   project, run `docker compose up -d`, and compare `HostConfig.LogConfig` before and after the
   recreate with `docker inspect`.
4. Generate more output than the cap and confirm that the log directory rotates files instead of
   growing without bound.
5. Create `compose.base.yml` with a service whose `image` and `max-size` differ from
   `compose.override.yml`, then run `docker compose -f compose.base.yml -f compose.override.yml config`
   and observe which values win. Swap the file order and observe the difference.

## Check your understanding

- Why can the default `json-file` driver exhaust a disk even when the application writes few logs?
- What is the role of `max-file`, and why is it ignored without `max-size`?
- Why did the running container keep its old logging behavior after the Compose file was edited?
- Why did MongoDB crash on a full disk instead of continuing with reduced diagnostic data?
- In `docker compose -f a.yml -f b.yml`, which file wins when both define the same single-value
  option, and where does the compose file's merging order come from?
- When is truncating a container log file an acceptable move, and what does Docker's documentation
  say about touching these files from outside the daemon?

## Primary references

- [JSON File logging driver](https://docs.docker.com/config/containers/logging/json-file/)
- [Configure logging drivers](https://docs.docker.com/config/containers/logging/configure/)
- [Compose service reference: `logging`](https://docs.docker.com/reference/compose-file/services/#logging)
- [Use multiple Compose files](https://docs.docker.com/compose/how-tos/multiple-compose-files/)
- [Merge rules for multiple Compose files](https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/)
- [Full-Time Diagnostic Data Capture (MongoDB 7.0)](https://www.mongodb.com/docs/v7.0/administration/full-time-diagnostic-data-capture/)
- [MongoDB `systemLog` configuration options](https://www.mongodb.com/docs/manual/reference/configuration-options/)
- [Official MongoDB Docker image](https://hub.docker.com/_/mongo)
