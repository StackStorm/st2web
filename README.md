StackStorm Web UI
=================

![web ui](https://cloud.githubusercontent.com/assets/125088/5877908/3d5aa02a-a323-11e4-9c7b-1a14a3eb0f60.png)

Quick start
-----------

First of all, you need to make sure you have latest stable `node` and `npm` packages installed.

    $ node -v
    v0.10.32

    $ npm -v
    1.4.9

then you need to globally install `bower` and `gulp`

    $ npm install -g bower
    $ npm install -g gulp

then you need to install the requirements

    $ npm install
    $ bower install

and finally run build system to fetch the font, compile css and so on

    $ gulp

At that point you should be able to point your browser to http://localhost:3000/ and see the the page.

Build system
------------

While `gulp` runs the longest chain of tasks including style compiling, spining up dev server and watching for changes, you can run all of them directly using `gulp <task>`. Some common tasks are:
 - `gulp build` - just lint and compile all the stuff
 - `gulp test` - build the project and then run e2e tests
 - `gulp serve` - build the project and start serving it at 3000 port

You can see the whole list of tasks in `gulpfile.js`.

Connecting to st2 server
-------------------------
Configure the CORS on StackStorm server: on your st2 installation, edit the following lines to [[api] section](https://github.com/StackStorm/st2/blob/master/conf/st2.conf#L3-L9) in `/etc/st2/st2.conf`:

    [api]
    # Host and port to bind the API server.
    host = 0.0.0.0
    port = 9101
    logging = st2api/conf/logging.conf
    # List of allowed origins for CORS, use when deploying st2web client
    # The URL must match the one the browser uses to access the st2web
    allow_origin = http://st2web.example.com:3000

Configure st2web to point to the right server(s). By default, UI tries to get its data from the [devenv](https://www.github.com/StackStorm/devenv) vagrant box on 172.168.50.50.

To make it work with your st2 API, edit [`config.js`](./config.js) at the root of the project and update the `hosts` array with proper object of **name**, **url** (including scheme, domain and port) and **auth** (in case your server requires authentication, it should be equal to `true`). For vagrant deployment of [st2express](https://github.com/StackStorm/st2express), it would be:

    hosts: [{
      name: 'Express Deployment',
      url: 'http://172.168.90.50:9101',
      auth: true
    }]

Multiple servers can be configured. Pick an desired server from the login screen and change the server by first disconnecting from the current one by picking 'Disconnect' from the drop down at the top right corner of the UI.


Testing
-------

For now, we don't have the UI to test, so we are using st2-docs application to make sure we are aware of any changes happening in StackStorm API. Take it as some sort of a live guide.

First of all, you need to make sure you have [Java Development Kit (JDK)][JDK] installed

    $ java -version
    java version "1.6.0_65"
    Java(TM) SE Runtime Environment (build 1.6.0_65-b14-462-11M4609)
    Java HotSpot(TM) 64-Bit Server VM (build 20.65-b04-462, mixed mode)

[JDK]: http://www.oracle.com/technetwork/java/javase/downloads/index.html

Then, you would need to update and start a webdriver for Selenium tests to run on

    $ node_modules/.bin/webdriver-manager update
    $ node_modules/.bin/webdriver-manager start

Or if you want, you can setup Selenium to [start as a launchd service][selguide].
[selguide]: http://blog.richardknop.com/2013/06/installing-selenium-2-on-mac-os-as-service/

You should also make sure, StackStorm is running and in the stock state. For that, follow
[devenv](https://github.com/StackStorm/devenv) and [Stanley](https://github.com/StackStorm/st2) README files.

After that, `gulp test` should finish successfully.
