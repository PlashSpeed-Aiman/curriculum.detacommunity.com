## What this deep dive shows

An image is not one giant filesystem copy. It is an ordered stack of mostly immutable filesystem
layers. A container adds one writable layer on top of that stack.

The first Dockerfiles lesson showed the instructions that make an image. This deep dive makes the
result visible. You will build three small image snapshots, compare their merged filesystems, then
inspect the layer archives that make those snapshots possible.

By the end, you should be able to explain:

- Which Dockerfile steps add filesystem changes.
- Why a later layer can hide or replace a file from an earlier layer.
- Why deleting a file in a later layer does not necessarily make the image smaller.
- How `docker diff` differs from comparing image build layers.

The archive inspection uses [`jq`](https://jqlang.org/) to read `manifest.json` without relying on
layer filenames or directory sorting. Install it before starting the lab, or use another JSON parser
that preserves the order of the `Layers` array.

## Create a layer lab

Create a fresh directory and add this `Dockerfile`:

```dockerfile
FROM alpine:3.21 AS step-one

RUN mkdir -p /opt/layer-lab \
    && printf 'one\n' > /opt/layer-lab/first.txt

FROM step-one AS step-two

RUN printf 'two\n' > /opt/layer-lab/second.txt

FROM step-two AS step-three

RUN rm /opt/layer-lab/first.txt \
    && printf 'updated\n' > /opt/layer-lab/second.txt
```

The stages are intentionally small:

1. `step-one` creates the directory and `first.txt`.
2. `step-two` inherits step one and adds `second.txt`.
3. `step-three` inherits step two, deletes `first.txt`, and replaces the contents of `second.txt`.

There is no application process in this lab. That is useful here because the filesystem changes are
the subject of the experiment.

## Step 1: build each snapshot

Run these commands from the directory containing the Dockerfile:

```bash
docker build --no-cache --target step-one --tag layer-lab:step-1 .
docker build --no-cache --target step-two --tag layer-lab:step-2 .
docker build --no-cache --target step-three --tag layer-lab:step-3 .
```

The `--target` option stops at a named stage and gives that stage its own image tag. Building three
tags gives us three points in time that can be compared without guessing what changed.

Confirm that the tags are in the local image store before continuing:

```bash
docker image ls layer-lab
```

Some `docker-container` builders keep a tagged result only in the build cache. If the command above
does not list the three images, repeat the builds with `docker buildx build --load` in place of
`docker build`. The `--load` option imports each single-platform result into the local image store so
that `docker create`, `docker run`, and `docker save` can use it.

## Step 2: read the build history

Start with the high-level view:

```bash
docker history --no-trunc layer-lab:step-3
```

The history is displayed newest first. You should find the three `RUN` commands from the Dockerfile,
followed by history inherited from `alpine`. The exact sizes depend on the Docker version and base
image, but the order should reflect the build graph.

Now inspect the filesystem layer identifiers:

```bash
docker image inspect layer-lab:step-3 --format '{{json .RootFS.Layers}}'
```

The `RootFS.Layers` array identifies filesystem layers from the base toward the top. The `RUN`
instructions in this lab add the final three filesystem changes. Instructions such as `CMD`, `ENV`,
and `EXPOSE` can add image configuration without adding a filesystem diff; do not treat every history
row as a new set of files.

`docker history` tells you which instruction produced a layer and its approximate size. It does not
show every path that changed. For that, inspect the image archive.

## Step 3: compare the visible files

First compare the merged filesystem that a container would see at each point. `docker export` flattens
the layers into a tar stream, so this is a view of the result rather than the layer deltas:

```bash
for step in 1 2 3; do
  container="layer-lab-snapshot-$step"
  docker create --name "$container" "layer-lab:step-$step" >/dev/null
  docker export "$container" | tar -tf - | sort > "step-$step-files.txt"
  docker rm "$container" >/dev/null
done
```

Compare the snapshots:

```bash
diff -u step-1-files.txt step-2-files.txt
diff -u step-2-files.txt step-3-files.txt
```

The first diff shows `second.txt` appearing. The second diff shows `first.txt` disappearing from the
visible filesystem. It does not show how Docker made that disappearance happen, because export has
already applied and flattened the layers.

The contents can be checked directly as well:

```bash
docker run --rm layer-lab:step-1 cat /opt/layer-lab/first.txt
docker run --rm layer-lab:step-2 cat /opt/layer-lab/second.txt
docker run --rm layer-lab:step-3 cat /opt/layer-lab/second.txt
```

The outputs should be `one`, `two`, and `updated` respectively.

## Step 4: export the image layers

Save the image as an archive and unpack it:

```bash
docker save --output layer-lab.tar layer-lab:step-3
mkdir -p layer-lab-archive
tar -xf layer-lab.tar --directory layer-lab-archive
jq -r '.[0].Layers[]' layer-lab-archive/manifest.json
```

The archive contains a `manifest.json`, an image configuration file, and layer payload files. Some
Docker save formats also include a legacy per-directory representation. The `Layers` array in
`manifest.json` is the authoritative bottom-to-top order. Use the paths it prints directly; do not
sort filenames or search for `layer.tar` files, because sorting the legacy directories does not
identify build order.

This lab has base-image layers followed by the three layers created by its `RUN` instructions. Bind
the final three manifest entries to variables in their correct order:

```bash
layer_one="layer-lab-archive/$(jq -r '.[0].Layers | .[-3]' layer-lab-archive/manifest.json)"
layer_two="layer-lab-archive/$(jq -r '.[0].Layers | .[-2]' layer-lab-archive/manifest.json)"
layer_three="layer-lab-archive/$(jq -r '.[0].Layers | .[-1]' layer-lab-archive/manifest.json)"

printf '%s\n' "$layer_one" "$layer_two" "$layer_three"
```

The three variables now point to the `RUN` layer archives for steps one, two, and three. The base
image layers remain in the archive, but they are not part of this lab's three application changes.

## Step 5: diff the layer contents

List the entries in each of the three application layers:

```bash
tar -tf "$layer_one" | sort > app-layer-1.txt
tar -tf "$layer_two" | sort > app-layer-2.txt
tar -tf "$layer_three" | sort > app-layer-3.txt

diff -u app-layer-1.txt app-layer-2.txt
diff -u app-layer-2.txt app-layer-3.txt
```

The paths will include the directory entries, but the meaningful changes are:

| Layer | Meaningful entries | What they mean |
| --- | --- | --- |
| Step one | `opt/layer-lab/first.txt` | Adds the first file. |
| Step two | `opt/layer-lab/second.txt` | Adds the second file. |
| Step three | `opt/layer-lab/.wh.first.txt` and `opt/layer-lab/second.txt` | Hides the first file and replaces the second file. |

The `.wh.first.txt` entry is a whiteout. It is a marker in the layer format that says the file with
the matching name from a lower layer should not appear in the merged filesystem. Docker does not need
to rewrite the lower layer.

The new `second.txt` in step three shadows the file from step two. The lower file is still present in
the lower layer; the merged view reads the newer entry.

Inspect the two versions directly from their layer archives:

```bash
tar -xOf "$layer_two" opt/layer-lab/second.txt
tar -xOf "$layer_three" opt/layer-lab/second.txt
```

The commands print `two` and `updated`. This is the central rule for reading layers: apply them in
order, let newer files replace older paths, and let whiteouts hide paths below them.

## Step 6: compare a container's writable layer

`docker diff` answers a related but different question. It reports changes made after a container was
created, in the container's writable layer. It does not compare the `RUN` layers that built the image.

Start a temporary container from the final image and make two runtime changes:

```bash
docker run --detach --name layer-diff-container layer-lab:step-3 sh -c 'while :; do sleep 3600; done'
docker exec layer-diff-container sh -c 'printf "runtime\n" > /opt/layer-lab/runtime.txt && rm /opt/layer-lab/second.txt'
docker diff layer-diff-container
docker rm --force layer-diff-container
```

The output uses letters such as:

- `A` for an added path, such as `runtime.txt`.
- `D` for a deleted path, such as `second.txt`.
- `C` for a changed directory or file.

Those changes disappear when the container is removed. The image's build layers are unchanged. Use
the layer archives named in `manifest.json` to study image build layers and `docker diff` to study
one container's runtime changes.

## What this means for Dockerfiles

The experiment gives a few practical rules:

- Removing a large file in a later `RUN` does not remove its bytes from an earlier layer. If the file
  should never be part of the image, do not copy it into the build or remove it in the same layer that
  creates it.
- Combining commands can keep temporary files out of the final layer, but it can also reduce cache
  reuse. Combine steps when the operations form one coherent unit, not automatically.
- Copy stable dependency manifests before frequently changing source files when that ordering is
  correct. This lets Docker reuse expensive dependency layers.
- Use multi-stage builds when build tools and source files are not needed at runtime.
- A smaller layer diff is not the only goal. A clear dependency boundary, a useful cache, and a
  repeatable build matter too.

## Practice

Extend the lab without changing the existing steps:

1. Add a fourth stage that creates `third.txt`.
2. Build a `layer-lab:step-4` image with `--target`.
3. Export the visible file list and diff it against step three.
4. Save step four and find the new layer in `manifest.json`.
5. Change `second.txt` again and inspect whether the new layer contains the replacement file rather
   than the original contents.

For a second experiment, add a large temporary file and delete it in a later `RUN`. Compare the image
size and layer listings. Then move creation and deletion into the same `RUN` and compare again.

## Check your understanding

- Why does the final filesystem no longer show `first.txt` even though the first layer added it?
- What is the purpose of a whiteout entry?
- Why can replacing a file increase image size even when the final file is small?
- When should you use `docker diff` instead of inspecting `layer.tar` files?
- How would a multi-stage build prevent build-only files from reaching the runtime image?
