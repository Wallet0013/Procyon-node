FROM node:8.1.4-slim
MAINTAINER yojiro kondo



RUN apt-get update && \
	apt-get -y install git

WORKDIR /home

RUN	git clone https://github.com/Wallet0013/Procyon-node.git

WORKDIR /home/Procyon-node

RUN	npm install