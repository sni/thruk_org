GEM=gem2.1
GEM_HOME=.gem
JEKYLL=jekyll
TESTPORT=4001
GEMENV=GEM_HOME=$(GEM_HOME)/ruby/2.1.0 GEM_PATH=$(GEM_HOME)/ruby/2.1.0 PATH=$(GEM_HOME)/ruby/2.1.0/bin:$$PATH

build: .gem
	$(GEMENV) $(JEKYLL) build --trace

quick: .gem
	$(GEMENV) NOCLEAN=1 $(JEKYLL) build --trace --limit_posts=5

server: .gem
	$(GEMENV) $(JEKYLL) serve --host=\* --trace --watch

.gem:
	# sudo apt-get install nodejs libmagickcore-dev libmagickwand-dev
	bundler install --path $(GEM_HOME)
	#$(GEMENV) $(GEM) install jekyll
	#$(GEMENV) $(GEM) install rmagick
	#$(GEMENV) $(GEM) install jekyll-asciidoc

test: .gem
	$(GEMENV) NOCLEAN=1 $(JEKYLL) serve --port=$(TESTPORT) & SPID=$$!; \
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
	cd _submodules/thruk && git checkout master && git pull
	git pull --rebase --recurse-submodules=yes
	cp _submodules/thruk/Changes src/_includes/Changes.html
	-git commit -am 'changelog update'

api_update:
	./api_update.pl _submodules/thruk/ perl5/
	-git add src/api
	-git commit -am 'automatic api update'

clean_env:
	git submodule init
	git submodule update
	@if [ $$(git status 2>&1 | grep -c "working directory clean") -ne 1 ]; then \
	    git status >&2; \
	    echo "cannot run update" >&2; \
	    exit 1; \
	fi
