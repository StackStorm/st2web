%define pkg_version %(node -e "console.log(require('./package.json').st2_version);")
%define version %(echo "${PKG_VERSION:-%{pkg_version}}")
%define release %(echo "${PKG_RELEASE:-1}")
#define epoch %(_epoch=`echo %{version} | grep -q dev || echo 1`; echo "${_epoch:-0}")

Name:           st2web
Version:        %{version}
%if 0%{?epoch}
Epoch: %{epoch}
%endif
Release:        %{release}
Summary:        St2Web - StackStorm Web UI

License:        Apache
URL:            https://github.com/stackstorm/st2web
Source0:        st2web

Prefix:         /opt/stackstorm/static/webui

%define _builddir %(pwd)
%define _rpmdir %(pwd)/..
%define _build_name_fmt %%{NAME}-%%{VERSION}-%%{RELEASE}.%%{ARCH}.rpm


%description
  <insert long description, indented with spaces>

%prep
  rm -rf %{buildroot}
  mkdir -p %{buildroot}

%build
  make

%install
  %make_install

%clean
  rm -rf %{buildroot}

%post
  # Try to fix the logs permissions during both install/upgrade
  chmod o-r /var/log/nginx/st2webui.* /var/log/nginx/ssl-st2webui.* > /dev/null 2>&1 || true

%files
  /*
