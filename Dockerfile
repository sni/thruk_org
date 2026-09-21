FROM debian:13

RUN apt-get update && \
	apt-get install -y \
		ruby \
		ruby-dev \
		ruby-bundler \
		nodejs \
		libmagickcore-dev \
		libmagickwand-dev \
		libreadline-dev \
		zlib1g-dev \
		git \
		g++ \
		gcc \
		make && \
	apt-get clean

WORKDIR /srv/jekyll
CMD ["make -C /srv/jekyll server"]
