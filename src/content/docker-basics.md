## What Docker gives you

Docker gives an application a repeatable place to run. Instead of asking every computer to have the same runtime, packages, and configuration, you describe those requirements and run them in a container.

This first lesson keeps the goal small: install Docker, confirm it works, and run a tiny web server.

## 1. Install Docker

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) for macOS or Windows, or install Docker Engine through your Linux distribution's instructions.

Once Docker is running, check that the command-line client can reach the daemon:

```bash
docker version
```

You should see both a **Client** and a **Server** section. The client is the command you type; the server, or daemon, is the long-running process that creates and manages containers.

## 2. Run a first container

The quickest way to see Docker working is to run the official Nginx image:

```bash
docker run --name curriculum-web --publish 8080:80 nginx
```

The command asks Docker to:

- Download the `nginx` image if it is not already available locally.
- Create a container named `curriculum-web`.
- Connect port `8080` on your computer to port `80` in the container.
- Start the Nginx web server in the foreground.

Open [http://localhost:8080](http://localhost:8080) in a browser. You should see the Nginx welcome page.

## 3. Inspect and stop it

Open another terminal and list the running containers:

```bash
docker ps
```

Stop the container when you are finished:

```bash
docker stop curriculum-web
```

The container still exists, but it is no longer running. List stopped containers with:

```bash
docker ps --all
```

Remove it when you no longer need it:

```bash
docker rm curriculum-web
```

## A useful mental model

An **image** is a packaged, read-only starting point. A **container** is a running instance of that image. The image can be reused to create many isolated containers, each with its own process and configuration.

For now, focus on the relationship between the image, the container, and the port mapping. Dockerfiles, Compose, storage, networking, and Linux isolation primitives will build on this foundation.

## Practice

Run the container again with a different host port, such as `8081`, then stop and remove it. Being able to start, inspect, stop, and clean up a container is the foundation for everything that follows.
