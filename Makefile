GEM_HOME=.gem
TESTPORT=4001

.PHONY: .gem

build: .gem _submodules/thruk/documentation
	bundle exec jekyll build --trace

quick: .gem _submodules/thruk/documentation
	bundle exec jekyll build --trace --limit_posts=5

server: .gem _submodules/thruk/documentation
	bundle exec jekyll serve --trace --watch

.gem:
	# sudo apt-get install ruby ruby-dev ruby-bundler nodejs libmagickcore-dev libmagickwand-dev libreadline-gplv2-dev zlib1g-dev
	bundle config set path '.gem'
	bundler install --path $(GEM_HOME)
	bundler update

test: .gem
	NOCLEAN=1 bundle exec jekyll serve --port=$(TESTPORT) & SPID=$$!; \
		for i in $$(seq 100); do if lsof -i:$(TESTPORT) >/dev/null 2>&1; then break; else sleep 0.3; fi done; \
		TESTEXPECT=Thruk TESTTARGET=http://localhost:$(TESTPORT) PERL_DL_NONLAZY=1 perl -MExtUtils::Command::MM -e "test_harness(0)" t/*.t; \
		RC=$$?; \
		kill -9 $$SPID; \
		exit $$RC

citest: .gem
	NOCLEAN=1 bundle exec jekyll serve --port=$(TESTPORT) & SPID=$$!;  \
		for i in $$(seq 100); do if lsof -i:$(TESTPORT) >/dev/null 2>&1; then break; else sleep 0.3; fi done; \
		TESTEXPECT=Thruk TESTTARGET=http://localhost:$(TESTPORT) PERL_DL_NONLAZY=1 perl -MExtUtils::Command::MM -e "test_harness(0)" t/*.t; \
		RC=$$?; \
		kill -9 $$SPID; \
		exit $$RC

localtest: _site
	TESTEXPECT=Thruk TESTTARGET=file://$(shell pwd)/_site/ PERL_DL_NONLAZY=1 perl -MExtUtils::Command::MM -e "test_harness(0)" t/*.t

update: clean_env changelog_update api_update build
	git push

changelog_update:
	git reset --hard --recurse-submodule
	cd _submodules/thruk && git checkout master && git pull && git checkout $$(git describe --tags `git rev-list --tags --max-count=1`)
	cp _submodules/thruk/Changes src/_includes/Changes.html
	-git commit -am 'changelog update'

_submodules/thruk/documentation:
	git submodule update --init --recursive

api_update:
	./api_update.pl _submodules/thruk/ perl5/
	-git add src/api
	-git commit -am 'automatic api update'

clean_env:
	git submodule init
	git submodule update
	@if [ $$(git status 2>&1 | grep -c "working \(tree\|directory\) clean") -ne 1 ]; then \
	    git status >&2; \
	    echo "cannot run update" >&2; \
	    exit 1; \
	fi
