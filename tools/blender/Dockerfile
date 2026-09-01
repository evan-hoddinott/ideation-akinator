FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        blender \
        ca-certificates \
        libegl1 \
        libgl1-mesa-dri \
        libglx-mesa0 \
        python3-numpy \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /work

ENTRYPOINT ["blender", "--background"]
