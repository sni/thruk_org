FROM jekyll/jekyll:3.8

RUN apk add --update \
	imagemagick-dev \
	imagemagick \
	libpng \
	libpng-dev
