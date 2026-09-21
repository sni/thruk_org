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
RUN git config --global --add safe.directory /srv/jekyll

WORKDIR /srv/jekyll
CMD ["make -C /srv/jekyll server"]
