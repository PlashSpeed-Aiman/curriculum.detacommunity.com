## Why write a Dockerfile?

In the previous lesson, Docker downloaded an image and ran it. That is useful, but the application
was still someone else's package. A `Dockerfile` lets you describe your own image as a repeatable
recipe.

This lesson keeps the application deliberately small. You will package a static web page with Nginx,
build an image from the recipe, and run a container from the image.

## Create a small site

Create a working directory with a `site` folder. Add an `index.html` file inside it:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Containerized site</title>
  </head>
  <body>
    <h1>Built from a Dockerfile</h1>
    <p>This page is running from a custom image.</p>
  </body>
</html>
```

The directory should now look like this:

```text
dockerfile-example/
|- site/
|  `- index.html
```

The Docker build context will be this directory. The final `.` in the build command will tell Docker
to send it to the builder.

## Write the Dockerfile

Create a file named `Dockerfile` next to the `site` directory:

```dockerfile
FROM nginx:1.27-alpine

COPY site/ /usr/share/nginx/html/

EXPOSE 80
```

Read the file from top to bottom:

- `FROM` selects a starting image. The Nginx image already contains a web server and its default
  startup command.
- `COPY` transfers files from the build context into the image. Here, the site is copied to the
  directory Nginx serves by default.
- `EXPOSE` documents the port the container is intended to listen on. It does not publish that port
  to your computer by itself.

The file is a recipe, not a running process. Nothing starts until you build an image and create a
container from it.

## Build the image

Run this command from the directory containing `Dockerfile`:

```bash
docker build --tag curriculum-site:dev .
```

The `--tag` option gives the image a readable name and tag. During the build, Docker pulls the base
image if it is not available locally, sends the build context, and executes each instruction.

List the image after the build:

```bash
docker image ls curriculum-site
```

The image is a static artifact. You can use it to create more than one container without rebuilding
it.

## Run the container

Create a container and publish its port:

```bash
docker run --rm --name curriculum-site --publish 8080:80 curriculum-site:dev
```

The two port numbers have different meanings:

- `8080` is the port on your computer.
- `80` is the port inside the container where Nginx listens.

Open [http://localhost:8080](http://localhost:8080). You should see the page from `site/index.html`.
Stop the server with `Ctrl+C`. Because the command used `--rm`, Docker removes the stopped container
automatically.

## Inspect what you built

Docker can show the metadata and the instructions that created the image:

```bash
docker image inspect curriculum-site:dev --format '{{.Config.ExposedPorts}}'
docker history curriculum-site:dev
```

The first command shows the documented port. The second command shows the image layers, including the
base image and the copied site files.

Changing the HTML and rebuilding will create a new image result. The next lesson explains why Docker
can reuse some build steps and when it must run them again.

## Practice

Change the heading and paragraph in `site/index.html`. Build the image with a new tag and run it on a
second host port:

```bash
docker build --tag curriculum-site:practice .
docker run --rm --name curriculum-site-practice --publish 8081:80 curriculum-site:practice
```

Visit [http://localhost:8081](http://localhost:8081), then stop the container. Check that both image
tags remain available with `docker image ls curriculum-site`.

## Check your understanding

- Which instruction chooses the base image?
- Why does `--publish 8080:80` contain two ports?
- What is the difference between an image and the container created from it?
- Where would you change the Dockerfile if the web server needed a different document root?
