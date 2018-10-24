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

License:        Apache 2.0
URL:            https://github.com/stackstorm/st2web
Source0:        st2web

Prefix:         /opt/stackstorm/static/webui

%define _builddir %(pwd)
%define _rpmdir %(pwd)/..
%define _build_name_fmt %%{NAME}-%%{VERSION}-%%{RELEASE}.%%{ARCH}.rpm


%description
  React-based HTML5 real-time Web UI interface for StackStorm open-source automation platform.
  Allows to control the whole process of execution, from running an action to seeing the results of the execution.
  It also helps to explore workflow executions up to the results of individual tasks.

%prep
  rm -rf %{buildroot}
  mkdir -p %{buildroot}

%build
  make

%install
  %make_install

%clean
  rm -rf %{buildroot}

%files
  /*
