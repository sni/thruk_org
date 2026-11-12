SHELL=bash
PWD=$(shell pwd)
# Canonical docs and logos come from an external Thruk checkout.
export THRUK_SOURCE

DOCKERRUN=docker run \
	--rm -it \
	-p 5173:5173 \
	--name=thruk-docs \
	-e THRUK_SOURCE=/opt/thruk \
	-v "$(THRUK_SOURCE):/opt/thruk:ro" \
	-v $(PWD):/opt/node_app/app \
	-v /opt/node_app/node_modules/ \
	-v /opt/node_app/app/.vitepress/cache \
	-v /opt/node_app/app/.vitepress/dist \
	-v $(PWD)/package.json:/opt/node_app/package.json \
	thruk/docs:latest

.PHONY: build server preview check docker-build docker-server clean test localtest check-source

build: check-source node_modules
	npm run docs:build

server: check-source node_modules
	npm run docs:dev

preview: check-source node_modules
	npm run docs:preview

check: check-source node_modules
	npm run check:docs

node_modules: package-lock.json
	npm ci --include=dev

check-source:
	@test -n "$(THRUK_SOURCE)" || { echo 'THRUK_SOURCE is required. Set it to the Thruk repository root.' >&2; exit 1; }
	@test -d "$(THRUK_SOURCE)/docs" || { echo 'THRUK_SOURCE must contain the Thruk docs directory.' >&2; exit 1; }

docker-build: check-source
	docker build -t thruk/docs .
	$(DOCKERRUN) npm run docs:build

docker-server: check-source
	docker build -t thruk/docs .
	$(DOCKERRUN)

test: build check
	npm run test

localtest:
	npx vitest run

clean:
	rm -rf node_modules
	rm -rf .vitepress/dist/
	rm -rf .vitepress/cache/
	rm -rf .build/
