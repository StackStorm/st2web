COMPONENT := $(notdir $(CURDIR))
PKG_RELEASE ?= 1
PKG_VERSION ?= $(shell node -e "console.log(require('./package.json').st2_version)")
PREFIX ?= /opt/stackstorm/static/webui
CHANGELOG_COMMENT ?= "automated build, version: $(PKG_VERSION)"
#DEB_EPOCH := $(shell echo $(PKG_VERSION) | grep -q dev || echo '1')
DEB_DISTRO := $(shell (echo $(PKG_VERSION) | grep -q dev) && echo unstable || echo stable)

.PHONY: all build clean install deb rpm
all: build

npm-install:
	echo "npm install"
	npm install -g gulp-cli gulp lerna yarn && npm install gulp

lerna:
	echo "lerna"
	lerna bootstrap

build-dev:
	echo "build-dev"
	make npm-install
	make lerna

# build-and-install:
# 	echo "build-and-install"
# 	make npm-install
# 	make lerna
# 	make build
# 	make install
build-and-install:
	echo "build-and-install"
	echo "npm install"
	npm install -g gulp-cli gulp lerna yarn && npm install gulp
	echo "lerna"
	lerna bootstrap

	echo "pwd"
	pwd

	echo "ls"
	ls

	echo "which gulp"
	which gulp

	echo "checking gulp tasks..."
	gulp --tasks --debug

	# echo "npm run build"
	# npm run build

	# sleep 3600
	echo "run gulp production directly"
	gulp production

	echo "install"
	mkdir -p $(DESTDIR)$(PREFIX)
	cp -R $(CURDIR)/build/* $(DESTDIR)$(PREFIX)

build:
	make npm-install

	echo "pwd"
	pwd

	echo "ls"
	ls

	echo "which gulp"
	which gulp

	echo "checking gulp tasks..."
	sleep 600
	gulp --tasks

	echo "npm run build"

	npm run build

clean:
	rm -Rf build/
	mkdir -p build/

install:
	echo "install"
	mkdir -p $(DESTDIR)$(PREFIX)
	cp -R $(CURDIR)/build/* $(DESTDIR)$(PREFIX)

deb:
	[ -z "$(DEB_EPOCH)" ] && _epoch="" || _epoch="$(DEB_EPOCH):"; \
		dch -m --force-distribution -v$${_epoch}$(PKG_VERSION)-$(PKG_RELEASE) -D$(DEB_DISTRO) $(CHANGELOG_COMMENT)
	dpkg-buildpackage -b -uc -us

rpm:
	rpmbuild -bb rpm/st2web.spec
