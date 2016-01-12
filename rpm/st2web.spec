%define st2pkg_version %(node -e "console.log(require('./package.json').st2_version);")

%define version %(echo "${ST2PKG_VERSION:-%{st2pkg_version}}")
%define release %(echo "${ST2PKG_RELEASE:-1}")

Name:           st2web
Version:        %{version}
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

%files
  /*
