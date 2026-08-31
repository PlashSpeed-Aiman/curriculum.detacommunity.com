## What you will learn

By the end of this lesson, you should be able to:

- Explain why a container's writable layer is not a database persistence plan.
- Declare and mount a named volume at MySQL's data directory.
- Distinguish named volumes from bind mounts.
- Predict what `docker compose down` and `docker compose down -v` do to data.
- Make a deliberate, logical backup instead of treating a volume as a backup file.

Containers are replaceable units. A service can be recreated after a configuration change, image update,
or failed deployment. Database files need a lifecycle that is separate from that replaceable container.
Docker volumes provide that boundary.

## Add a named volume

Update the `compose.yaml` in `compose-lab` so the database mounts a named volume at the data directory
used by the [official MySQL image](https://hub.docker.com/_/mysql):

```yaml
services:
  web:
    image: nginx:1.27-alpine
    ports:
      - "127.0.0.1:8080:80"
  db:
    image: mysql:8.4.11
    environment:
      MYSQL_ROOT_PASSWORD: "local-root-password"
      MYSQL_DATABASE: curriculum
      MYSQL_USER: curriculum_app
      MYSQL_PASSWORD: "local-app-password"
    volumes:
      - db-data:/var/lib/mysql

volumes:
  db-data:
```

The `db-data` entry under the service is a mount. Its left side is the Compose volume name; its right
side is the path inside the container. The top-level `volumes` mapping declares that `db-data` is a
named volume managed by Docker. Compose will usually give the actual Docker volume a project-scoped
name such as `compose-lab_db-data`.

This is different from a path such as `./mysql-data:/var/lib/mysql`. The latter is a bind mount from a
directory on the host. Both forms persist files beyond the lifetime of a container, but their ownership,
portability, permissions, and backup workflows differ.

| Mount type | Source | Useful for | Boundary to remember |
| --- | --- | --- | --- |
| Named volume | Docker-managed name such as `db-data` | Databases and service data managed by Docker | It is still local state, not an automatic backup or encryption layer. |
| Bind mount | An explicit host path such as `./mysql-data` | Source code, configuration, or files the host must edit directly | The container can read or change the selected host path. |

For a database, do not casually switch between a named volume and a bind mount. MySQL owns a data
directory with permissions and internal files; use one storage strategy consistently for a given
container. A bind mount can also behave differently across Linux, macOS, and Windows Docker setups.

## Start and create data

Reconcile the project from `compose-lab`:

```bash
docker compose config --quiet
docker compose up -d
docker compose ps
```

The first start creates `db-data` if it does not exist. Wait for MySQL's initialization to finish, then
connect with the local application account:

```bash
docker compose exec db \
  mysql --protocol=tcp --host=127.0.0.1 --user=curriculum_app --password curriculum
```

The `--password` option prompts for the fake local password. At the MySQL prompt, create a small table
and row:

```sql
CREATE TABLE IF NOT EXISTS notes (
  id INT PRIMARY KEY,
  body VARCHAR(255) NOT NULL
);

INSERT INTO notes (id, body) VALUES (1, 'volume-survives');
SELECT id, body FROM notes;
```

Type `exit` when finished. These values are for the lab only. Never put a real password in a lesson
command, source repository, or shared shell history.

Inspect the volume and the database container's mount:

```bash
docker volume ls --filter name=compose-lab
docker volume inspect compose-lab_db-data
docker inspect "$(docker compose ps -q db)" \
  --format '{{json .Mounts}}'
```

If you selected a different project name, replace `compose-lab_db-data` with the volume name shown by
`docker volume ls`. Do not depend on the host filesystem path shown by `docker volume inspect`; access
the volume through Docker or a database-aware tool.

## Container and volume lifecycles

A stopped or removed container does not imply that a named volume is removed. Try the non-destructive
cycle first:

```bash
docker compose down
docker volume ls --filter name=compose-lab
docker compose up -d
```

After MySQL is ready, run the query again:

```bash
docker compose exec db \
  mysql --protocol=tcp --host=127.0.0.1 --user=curriculum_app --password curriculum \
  -e 'SELECT id, body FROM notes;'
```

The row should still exist because `down` removed the service containers and the project network but
left the project-managed named volume. The volume is the durable state; the `db` container is a
replaceable process around it.

The destructive cleanup form is explicit:

```bash
docker compose down -v
```

The `-v` or `--volumes` option removes named volumes declared by this Compose project, including
`db-data`. It deletes the database files. Re-running `docker compose up -d` creates an empty volume and
the MySQL image performs first-run initialization again. Use this only when the local data is disposable.
An external volume is a separate case and is not removed by Compose; always check the volume declaration
before cleanup.

These commands have different effects:

| Command | Containers | Project network | `db-data` |
| --- | --- | --- | --- |
| `docker compose stop` | Stops them | Keeps it | Keeps it |
| `docker compose down` | Removes them | Removes the default network | Keeps it |
| `docker compose down -v` | Removes them | Removes the default network | Removes it |

Changing `MYSQL_ROOT_PASSWORD` or the other MySQL initialization variables does not rewrite an already
initialized volume. The official image uses those values when the data directory is empty. If you need
a clean credential experiment, use a disposable new volume or intentionally remove the old one after
confirming that its data is not needed.

## Backup is a separate responsibility

A named volume is persistence, not a backup. It can be deleted, corrupted, or lost with the Docker host.
For a small MySQL lab, create a logical dump while the database is running:

```bash
docker compose exec -T db \
  sh -c 'mysqldump --no-tablespaces --protocol=tcp --user="$MYSQL_USER" --password="$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  > curriculum.sql
```

The `-T` option disables the pseudo-terminal so the SQL stream can be redirected to a file on the host.
The `--no-tablespaces` option lets the database-scoped exercise account create this dump without the
extra `PROCESS` privilege required for tablespace metadata. The shell expands the local exercise
password into the client command, so this is a disposable lab technique, not a secret-safe production
backup command. Treat `curriculum.sql` as sensitive: it contains application data, add it to your local
ignore rules, and do not publish it.

Restore a dump only when you understand that its statements change the target database:

```bash
docker compose exec -T db \
  sh -c 'mysql --protocol=tcp --user="$MYSQL_USER" --password="$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  < curriculum.sql
```

For production systems, choose a documented backup and restore process with tested retention, access
control, encryption, and recovery checks. Do not copy a live database volume's internal files as if that
were automatically a consistent backup. A bind mount also does not create a backup; it only gives the
container access to a host directory.

## Practice

1. Add the named volume declaration and mount shown above.
2. Create the `notes` table and row, then run `docker compose down`.
3. Start the project again and verify the row remains.
4. Create `curriculum.sql` with the logical dump command and inspect it without sharing it.
5. If the data is disposable, run `docker compose down -v`, start again, and verify that the table is gone.
6. Compare the named-volume form with a bind mount form, but use only one form at a time for MySQL.

If DBeaver is part of your workflow, you may add this host publication while keeping the volume:

```yaml
ports:
  - "127.0.0.1:3307:3306"
```

DBeaver still connects to `127.0.0.1:3307`; the database still stores files at `/var/lib/mysql` in the
container's mounted volume.

## Check your understanding

- What does the left side and right side of `db-data:/var/lib/mysql` mean?
- Why does `docker compose down` preserve the row but `docker compose down -v` remove it?
- Is a named volume a backup? What additional process is needed?
- When would a bind mount be more appropriate than a named volume?
- Why do changed MySQL initialization variables not change accounts in an existing volume?

## Primary references

- [Docker volumes](https://docs.docker.com/engine/storage/volumes/)
- [Docker bind mounts](https://docs.docker.com/engine/storage/bind-mounts/)
- [Compose volumes](https://docs.docker.com/reference/compose-file/volumes/)
- [Official MySQL image documentation](https://hub.docker.com/_/mysql)
