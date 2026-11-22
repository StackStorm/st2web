StackStorm Web UI
=================

[![CircleCI](https://circleci.com/gh/StackStorm/st2web.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/StackStorm/st2web)

![st2web](https://user-images.githubusercontent.com/1357357/41534974-bdd8e768-732a-11e8-9ab1-7afcaf29ad23.png)


Quick start
-----------

You need Node.js 24 LTS (see [`.nvmrc`](./.nvmrc)) and the npm that ships with it. The repo is a set of
npm workspaces (`apps/*`, `modules/*`), so a single install sets everything up:

```shell
$ nvm use        # or any other way of getting Node 24
$ npm ci
$ npm run develop
```

The dev server listens on http://localhost:3000/ and proxies `/api`, `/auth` and `/stream` to `ST2_URL`
(default `http://127.0.0.1:8080`, i.e. anything that serves the st2 API under those paths, such as an
st2web nginx in front of a StackStorm install):

```shell
$ ST2_URL=https://my-st2-host npm run develop
```

### Adding or upgrading dependencies

[`.npmrc`](./.npmrc) guards against compromised npm releases, which are usually caught and pulled
within days:

- `min-release-age=14`: npm refuses any version published less than 14 days ago. An install that asks
  for one fails with `ETARGET ... with a date before ...`; pick an older version or wait.
- `ignore-scripts=true`: no package's install scripts run (none of our dependencies need one).
- `allow-git=none`: dependencies come from the registry only.

Pin versions exactly in `package.json`, commit the regenerated `package-lock.json`, and check the result
with `npm audit` and `npm audit signatures`. If a security fix is too new for the cooldown, review the
release (publisher, dependencies, and a diff against the previous version), pin it under `overrides`
and add it to `min-release-age-exclude` in `.npmrc` with a note on when to remove it.

Quick start (docker-compose)
-----------

> **Note:** docker-compose uses `config.local.js` which is gitignored and should be a copy of `config.js` with your specific values

Production:
```
docker-compose  up
```

Dev:
```
docker-compose -f docker-compose.dev.yml up --build
```

Production with NGINX:
```
docker-compose -f docker-compose.nginx.yml up --build
```

Dev with NGINX:
```
docker-compose -f docker-compose.nginx-dev.yml up --build
```

Build system
------------

The UI is built with [Rsbuild](https://rsbuild.rs) (`rsbuild.config.mjs`), unit-tested with
[Rstest](https://rstest.rs) (`rstest.config.mjs`) and linted with ESLint 9 (`eslint.config.mjs`):

 - `npm run develop` - dev server with live reload on port 3000
 - `npm run build` - production build into `build/`
 - `npm run serve` - serve the production build on port 3000
 - `npm run lint` - lint everything
 - `npm run test-unit` - unit tests (`npx rstest run --coverage` for a coverage report)
 - `npm test` - lint + unit tests

Connecting to st2 server
-------------------------
Configure the CORS on StackStorm server: on your st2 installation, edit the following lines to [[api] section](https://github.com/StackStorm/st2/blob/master/conf/st2.prod.conf#L3-L10) in `/etc/st2/st2.conf`:

    [api]
    # Host and port to bind the API server.
    host = 0.0.0.0
    port = 9101
    logging = st2api/conf/logging.conf
    # List of allowed origins for CORS, use when deploying st2web client
    # The URL must match the one the browser uses to access the st2web
    allow_origin = http://st2web.example.com:3000

Configure st2web to point to the right server. By default, UI tries to get its data relative to the st2web.

If for some reason st2web is served from another domain, edit [`config.js`](./config.js) at the root of the project and update the `hosts` array with proper object of **name**, **url** and **auth**. URL should include scheme, domain and port in compliance with [rfc1808](http://tools.ietf.org/html/rfc1808.html). Auth might be either boolean (in which case the default schema and port is used) or a url of the auth server (see url requirements). For vagrant deployment of [st2express](https://github.com/StackStorm/st2express), it would be:

    hosts: [{
      name: 'Express Deployment',
      url: 'http://172.168.90.50:9101',
      auth: true
    }]

Production
----------
To build the production version, run

    $ npm run build

The compiled UI lands in `build/`: `index.html`, `config.js`, `package.meta(.js)`, `css/`, `js/`, `img/`
and `font/`. Copy it to your webserver's public folder. `config.js` is deliberately not bundled, so it can
be edited in place after deployment.


Testing
-------
`npm test` runs ESLint and the unit tests.

### Unit tests

    $ npm run test-unit                  # every package
    $ npx rstest run modules/st2-panel   # one package
    $ npx rstest run --coverage          # with a coverage summary (HTML report in coverage/)

Unit tests live next to the code they test, in `apps/*/tests/test-*.js` and `modules/*/tests/test-*.js`.
They run with [Rstest](https://rstest.rs) in jsdom, compiled by the same Rsbuild config as the app
(`rstest.config.mjs`). Components are tested through the DOM with
[Testing Library](https://testing-library.com/docs/react-testing-library/intro/): `renderNode()` from
`@stackstorm/module-test-utils` renders an element and returns its outermost DOM node, and the setup file
`modules/st2-test-utils/bootstrap/react.js` cleans up after every test. API calls are mocked with
[axios-mock-adapter](https://github.com/ctimmerm/axios-mock-adapter); a unit test never needs a server.

### Functional tests

The [Playwright](https://playwright.dev) specs in `tests/` drive a real browser against a running st2web
that is connected to a real StackStorm. Point them at it with `ST2WEB_URL` (the UI, with `/api`, `/auth`
and `/stream` reachable through it) and a user to log in as:

    $ ST2WEB_URL=http://localhost:3000 ST2_USERNAME=st2admin ST2_PASSWORD=... npm run test-functional

The specs only change what they create themselves: they run `core.noop` and `core.ask`, and create,
edit and delete one disabled rule in the `core` pack. The workflow designer spec opens a workflow
read-only and fails if the page tries to save anything. Playwright needs its browsers; the
`mcr.microsoft.com/playwright` image that matches the `@playwright/test` version has them.

Copyright, License, and Contributors Agreement
----------------------------------------------

Copyright 2015-2019 Extreme Networks, Inc.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this work except in compliance with the License. You may obtain a copy of the License in the [LICENSE](LICENSE) file, or at:

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

By contributing you agree that these contributions are your own (or approved by your employer) and you grant a full, complete, irrevocable copyright license to all users and developers of the project, present and future, pursuant to the license of the project.
