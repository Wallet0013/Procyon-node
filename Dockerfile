FROM node:8.1.4-slim
MAINTAINER yojiro kondo

RUN apt-get update && \
	apt-get -y install git python make traceroute build-essential \
	libssl-dev zlib1g-dev libbz2-dev wget curl llvm \
	libncurses5-dev libncursesw5-dev libpng-dev

WORKDIR /home

ADD dummy7 /data/
RUN	git clone https://github.com/Wallet0013/Procyon-node.git

WORKDIR /home/Procyon-node

RUN	npm install