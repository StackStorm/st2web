StackStorm Web UI
=================

[![CircleCI](https://circleci.com/gh/StackStorm/st2web.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/StackStorm/st2web)

![st2web](https://cloud.githubusercontent.com/assets/1357357/7393040/010f78ac-eea5-11e4-82bf-8253674683e1.png)


Quick start
-----------

First of all, you need to make sure you have `node` and `npm` packages installed. Currently, we consider Node v10.x.x to be our stable.

    $ n 10

    install : node-v10.4.1
      mkdir : /usr/local/n/versions/node/10.4.1
      fetch : https://nodejs.org/dist/v10.4.1/node-v10.4.1-darwin-x64.tar.gz
    ######################################################################## 100.0%
    installed : v10.4.1

    $ node -v
    v10.4.1

    $ npm -v
    6.1.0

then you need to globally install `gulp`, `lerna` and `yarn`

    $ npm install -g gulp-cli lerna yarn

then you need to install the requirements

    $ lerna bootstrap

and finally run build system to fetch the font, compile css and so on

    $ gulp

At that point you should be able to point your browser to http://localhost:3000/ and see the the page.

Build system
------------

While `gulp` runs the longest chain of tasks including style compiling, spining up dev server and watching for changes, you can run all of them directly using `gulp <task>`. Some common tasks are:
 - `gulp build` - just lint and compile all the stuff
 - `gulp test` - build the project and then run e2e tests
 - `gulp serve` - build the project and start serving it at 3000 port
 - `gulp production` - build production version of the project

You can see the whole list of tasks in `gulpfile.js`.

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

Configure st2web to point to the right server(s). By default, UI tries to get its data from the [devenv](https://www.github.com/StackStorm/devenv) vagrant box on 172.168.50.50.

To make it work with your st2 API, edit [`config.js`](./config.js) at the root of the project and update the `hosts` array with proper object of **name**, **url** and **auth**. URL should include scheme, domain and port in compliance with [rfc1808](http://tools.ietf.org/html/rfc1808.html). Auth might be either boolean (in which case the default schema and port is used) or a url of the auth server (see url requirements). For vagrant deployment of [st2express](https://github.com/StackStorm/st2express), it would be:

    hosts: [{
      name: 'Express Deployment',
      url: 'http://172.168.90.50:9101',
      auth: true
    }]

Multiple servers can be configured. Pick an desired server from the login screen and change the server by first disconnecting from the current one by picking 'Disconnect' from the drop down at the top right corner of the UI.


Production
----------
While `gulp serve` is ideal for development purposes and quick preview, it requires browser to make lots and lots of requests downloading every single project file separately thus wasting a lot of time on making a request and waiting for response. Production version minimizes the number of files by concatenating them together and minifies some of the most heavy files reducing their size up to 5 times. It also makes compiled version completely independent of the rest of code allowing you to deploy it everywhere: static apache\nginx server, AWS, Heroku, Github Pages.

To build production version, run

    $ gulp production

Then, you can find compiled version of the project in `build/` folder. You can just copy it to the public folder your webserver, create symlink or push it to another repository as a deployment strategy.


Testing
-------
We're using [zombie](https://github.com/assaf/zombie) as our headless browser for integration testing. It is a simulated environment (virtual DOM) so there's no need in WebDriver or a real browser to be present.

First of all, you need to make sure you have a running copy of st2 to run tests against. We're using [custom docker-compose](https://github.com/enykeev/st2box/) deployment for our automated tests, but the [AIO](https://docs.stackstorm.com/install/index.html) deployment will work just as good (though will take more time to deploy).

To let test runner know the details of your st2 installation, you need to set ST2_HOST, ST2_USERNAME and ST2_PASSWORD env variables, then call `gulp test`.

    $ ST2_HOST=localhost ST2_USERNAME=admin ST2_PASSWORD=123 gulp test

Copyright, License, and Contributors Agreement
----------------------------------------------

Copyright 2015 StackStorm, Inc.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this work except in compliance with the License. You may obtain a copy of the License in the [LICENSE](LICENSE) file, or at:

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

By contributing you agree that these contributions are your own (or approved by your employer) and you grant a full, complete, irrevocable copyright license to all users and developers of the project, present and future, pursuant to the license of the project.
