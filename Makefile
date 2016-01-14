COMPONENT := $(notdir $(CURDIR))
PKG_RELEASE ?= 1
PKG_VERSION ?= $(shell node -e "console.log(require('./package.json').st2_version)")
PREFIX ?= /opt/stackstorm/static/webui

ifneq (,$(wildcard /etc/debian_version))
	DEBIAN := 1
	DESTDIR ?= $(CURDIR)/debian/$(COMPONENT)
else
	REDHAT := 1
endif

.PHONY: all build clean install
all: build

build:
	node_modules/.bin/gulp production

clean:
	rm -Rf build/
	mkdir -p build/

install: changelog
	mkdir -p $(DESTDIR)$(PREFIX)
	cp -R $(CURDIR)/build/* $(DESTDIR)$(PREFIX)

changelog:
ifeq ($(DEBIAN),1)
	debchange -v $(PKG_VERSION)-$(PKG_RELEASE) -M ""
endif
