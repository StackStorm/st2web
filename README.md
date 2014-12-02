Stanley UI
==========

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

By default, UI tries to get its data from the [devenv](https://www.github.com/StackStorm/devenv) vagrant box on 172.168.50.50.

To make it work with your st2 API, edit [`config.js`](./config.js) at the root of the project and update the `hosts` array with proper object of **name** and **url** (including scheme, domain and port). For vagrant deployment of [st2express](https://github.com/StackStorm/st2express), it would be:

    hosts: [{
      name: 'Express Deployment'
      url: 'http://172.168.90.50:9101'
    }]

Then you may have to pick an appropriate server from the drop down at the top right corner of the UI.

Testing
-------

For now, we don't have the UI to test, so we are using st2-docs application to make sure we are aware of any changes happening in Stanley API. Take it as some sort of a live guide.

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

You should also make sure, Stanley is running and in the stock state. For that, follow
[devenv](https://github.com/StackStorm/devenv) and [Stanley](https://github.com/StackStorm/Stanley) README files.

After that, `gulp test` should finish successfully.
