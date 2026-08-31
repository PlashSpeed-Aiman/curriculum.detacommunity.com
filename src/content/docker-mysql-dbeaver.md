## What this supplementary lesson adds

The first Docker lesson ran a web server. This exercise runs a database server instead, then uses
[DBeaver](https://dbeaver.io/) as a desktop client to inspect and query it. You will keep the database
files in a named Docker volume so that removing the container does not automatically remove the data.

By the end, you should be able to:

- Start the [official MySQL image on Docker Hub](https://hub.docker.com/_/mysql) with a named volume.
- Tell when MySQL has finished its first-run initialization.
- Connect to the server from DBeaver through a published local port.
- Use an initialized database and table, insert a row, and read it with SQL.
- Explain what happens to the data and the root password when the container is stopped, removed, or recreated.

## Why MySQL here instead of PostgreSQL?

Both MySQL and PostgreSQL are capable relational databases, and either can be a production-ready choice.
This lesson uses MySQL as a pragmatic quick-start choice: the official image has a straightforward
first-run setup where you provide a root password, mount `/var/lib/mysql`, and publish the database
port. That gives a small application a short path from local development to a production-shaped
database workflow without adding a separate pooler on day one. It is a choice for this exercise, not a
claim that MySQL is universally easier.

PostgreSQL does not require PgBouncer in order to be production-ready. An application can connect
directly to PostgreSQL, especially for a local setup or a workload that fits that model. PgBouncer is
an optional connection pooler that can help with connection churn or pressure on the number of backend
connections; it is not a mandatory prerequisite for PostgreSQL. Choose a database and any pooling layer
later based on the application's features, team experience, deployment environment, and connection
workload.

## Before you start

You need Docker running and DBeaver installed. This walkthrough assumes DBeaver is running on the same
computer as Docker. Port `3307` should be available on that computer; it is the host port used to avoid
colliding with another MySQL server that may already use host port `3306`.

The passwords in the next command are example placeholders. Replace them with private passwords for
your local exercise. Do not put real credentials in lesson notes, source control, or a command you
plan to share.

## 1. Create a named volume

Create a volume before starting the container:

```bash
docker volume create curriculum-mysql-data
```

A named volume is managed by Docker and has its own name. We will mount it at `/var/lib/mysql`, the
directory where this image stores its database files. The volume has a lifecycle separate from the
container: stopping or removing the container will not remove this volume.

## 2. Start the official MySQL image

Run MySQL in the background:

```bash
docker run --name curriculum-mysql \
  --detach \
  --publish 127.0.0.1:3307:3306 \
  --env MYSQL_ROOT_PASSWORD='replace-this-with-a-local-password' \
  --env MYSQL_DATABASE=curriculum_lab \
  --env MYSQL_USER=curriculum_user \
  --env MYSQL_PASSWORD='replace-this-with-a-local-user-password' \
  --volume curriculum-mysql-data:/var/lib/mysql \
  mysql:8.4.11
```

The important parts are:

- `mysql:8.4.11` is a pinned tag of the official MySQL image. Read its [Docker Hub documentation](https://hub.docker.com/_/mysql) for supported tags and image configuration.
- `MYSQL_ROOT_PASSWORD` is required when the mounted data directory is empty. It sets the password for the `root` administrator account during initialization.
- `MYSQL_DATABASE`, `MYSQL_USER`, and `MYSQL_PASSWORD` create a database and an account with privileges for that database during first-run initialization.
- `--volume curriculum-mysql-data:/var/lib/mysql` keeps database files in the named volume instead of only in the container's writable layer.
- `--publish 127.0.0.1:3307:3306` maps host port `3307` to MySQL's container port `3306`, and binds it to this computer's loopback address. DBeaver will use the host side of this mapping.
- `--detach` returns control of the terminal while the server continues to start.

These example credentials are visible in the container metadata when passed with `--env`. That is
acceptable for a disposable local exercise, but use a secret-management mechanism for shared or
production deployments.

The image may download first. The first start also initializes system tables, so the container can be
running before MySQL is ready to accept connections.

## 3. Wait for MySQL to be ready

Check that the container is running and follow its startup log for diagnostic information:

```bash
docker ps --filter name=curriculum-mysql
docker logs --follow curriculum-mysql
```

Press `Ctrl+C` to stop following the log; this does not stop the container. Do not use the log line
`ready for connections` as the readiness gate: the image can start a temporary server during first-run
initialization that emits a similar message before the final server is available.

You can also ask the server directly from inside the container:

```bash
docker exec -it curriculum-mysql \
  mysqladmin ping --protocol=tcp --host=127.0.0.1 --user=root --password
```

Enter the local root password when prompted. Use this TCP check as the readiness gate and retry it until
the server reports `mysqld is alive`. The official image does not accept normal incoming connections
until first-run initialization is complete.

## 4. Connect with DBeaver

In DBeaver, create a new **MySQL** connection. Use these values:

| Setting | Value |
| --- | --- |
| Server host | `127.0.0.1` |
| Port | `3307` |
| Username | `curriculum_user` |
| Password | The local value used for `MYSQL_PASSWORD` |
| Database | `curriculum_lab` |

Select **Test Connection**, allow DBeaver to download the MySQL driver if it asks, and save the
connection after the test succeeds. The container name `curriculum-mysql` is useful to Docker, but
DBeaver is connecting from the host, so it uses the published host address and port instead.

Open a SQL editor for the connection. The `curriculum_lab` database is ready for the first table, while
the account you use in DBeaver does not need global administrator privileges.

## 5. Run your first SQL

Run this script in DBeaver:

```sql
SHOW DATABASES;

USE curriculum_lab;

CREATE TABLE IF NOT EXISTS notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  body VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO notes (body) VALUES ('first query from DBeaver');

SELECT id, body, created_at
FROM notes
ORDER BY id;
```

The script demonstrates a small application-shaped workflow: select a database, define a table, insert
data, and read it back. The final `SELECT` should show the row you inserted. If you run the script again,
the `INSERT` adds another row; that is a useful reminder that SQL statements change real stored data.

## Persistence and credentials

The container and the volume have different jobs:

- `docker stop curriculum-mysql` stops the MySQL process but keeps both the container and the volume.
- `docker rm curriculum-mysql` removes the container but leaves `curriculum-mysql-data` in place.
- `docker volume rm curriculum-mysql-data` deletes the stored database files and cannot be undone through Docker.

`MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, and `MYSQL_PASSWORD` are initialization settings,
not commands that update an existing database. The official image uses them when `/var/lib/mysql` is
empty. If you later start MySQL with the same named volume, the existing database and accounts are left
intact; changing any of those environment values on a later start does not change the root password,
database, username, or application password. Keep the local credentials available while you work, and
use the database-scoped development user rather than the root account when connecting an actual
application.

## 6. Clean up

When you want to stop the exercise but keep its data for another session:

```bash
docker stop curriculum-mysql
```

To remove the container while keeping the named volume:

```bash
docker rm curriculum-mysql
```

To remove the database files as well, first remove the container and then remove the volume:

```bash
docker volume rm curriculum-mysql-data
```

Only run the last command when you no longer need the database. To use the data again after removing
the container, create a new MySQL container with the same volume and use the original root password;
the initialization environment variables are not reapplied to an existing database.

## Practice

Stop the container, start it again with `docker start curriculum-mysql`, and run the final `SELECT` in
DBeaver. Then remove only the container, recreate it with the same named volume, and verify that the
row is still present.

## Check your understanding

- Which part of `127.0.0.1:3307:3306` is the host port, and which part is the container port?
- Why does removing the container not remove the rows in `curriculum_lab`?
- Why does changing `MYSQL_ROOT_PASSWORD` not change the root password after the volume has been initialized?
- What problem can PgBouncer help with, and why is it not required for PostgreSQL in this lesson?
