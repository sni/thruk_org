GEM=gem1.9.1
GEM_HOME=.gem
JEKYLL=.gem/bin/jekyll
TESTPORT=4001

quick: .gem
	GEM_HOME=$(GEM_HOME) NOCLEAN=1 $(JEKYLL) build --trace --limit_posts=5 --no-watch

build: .gem
	GEM_HOME=$(GEM_HOME) $(JEKYLL) build --trace

server: .gem
	GEM_HOME=$(GEM_HOME) $(JEKYLL) serve --host=\* --trace --watch

.gem:
	# apt-get install libmagickcore-dev libmagickwand-dev
	GEM_HOME=$(GEM_HOME) $(GEM) install jekyll
	GEM_HOME=$(GEM_HOME) $(GEM) install rmagick
	GEM_HOME=$(GEM_HOME) $(GEM) install jekyll-asciidoc --pre

test: .gem
	GEM_HOME=$(GEM_HOME) NOCLEAN=1 $(JEKYLL) serve --port=$(TESTPORT) & SPID=$$!;  \
		for i in $$(seq 100); do if lsof -i:$(TESTPORT) >/dev/null 2>&1; then break; else sleep 0.3; fi done; \
		TESTEXPECT=Thruk TESTTARGET=http://localhost:$(TESTPORT) PERL_DL_NONLAZY=1 perl -MExtUtils::Command::MM -e "test_harness(0)" t/*.t; \
		RC=$$?; \
		kill -9 $$SPID; \
		exit $$RC

localtest: _site
	TESTEXPECT=Thruk TESTTARGET=file://$(shell pwd)/_site/ PERL_DL_NONLAZY=1 perl -MExtUtils::Command::MM -e "test_harness(0)" t/*.t

update: clean_env
	cd _submodules/thruk && git checkout master && git pull
	git pull --rebase --recurse-submodules=yes
	cp _submodules/thruk/Changes src/_includes/Changes.html
	-git commit -am 'changelog update'
	make api_update

api_update: clean_env
	./api_update.pl _submodules/thruk/ perl5/
	-git commit -am 'automatic api update'

clean_env:
	git submodule init
	git submodule update
	@if [ $$(git status 2>&1 | grep -c "working directory clean") -ne 1 ]; then \
	    git status >&2; \
	    echo "cannot run update" >&2; \
	    exit 1; \
	fi
