COMPONENT := $(notdir $(CURDIR))
PKG_RELEASE ?= 1
PKG_VERSION ?= $(shell node -e "console.log(require('./package.json').st2_version)")
PREFIX ?= /opt/stackstorm/static/webui
CHANGELOG_COMMENT ?= "automated build, version: $(PKG_VERSION)"
#DEB_EPOCH := $(shell echo $(PKG_VERSION) | grep -q dev || echo '1')
DEB_DISTRO := $(shell (echo $(PKG_VERSION) | grep -q dev) && echo unstable || echo stable)

.PHONY: all build clean install deb rpm
all: build

build:
	npm run build

clean:
	rm -Rf build/
	mkdir -p build/

install:
	mkdir -p $(DESTDIR)$(PREFIX)
	cp -R $(CURDIR)/build/* $(DESTDIR)$(PREFIX)

deb:
	[ -z "$(DEB_EPOCH)" ] && _epoch="" || _epoch="$(DEB_EPOCH):"; \
		dch -m --force-distribution -v$${_epoch}$(PKG_VERSION)-$(PKG_RELEASE) -D$(DEB_DISTRO) $(CHANGELOG_COMMENT)
	dpkg-buildpackage -b -uc -us

rpm:
	rpmbuild -bb rpm/st2web.spec
