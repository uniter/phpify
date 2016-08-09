PHPify
=======

[![Build Status](https://secure.travis-ci.org/uniter/phpify.png?branch=master)](http://travis-ci.org/uniter/phpify)

Browserify transform for requiring PHP modules from JavaScript.

Usage
=====

```shell
npm install --save-dev browserify phpify
```

Simple usage (requiring a single PHP module)
--------------------------------------------

Add to the `"browserify"` property in `package.json`:
```json
{
  "version": "1.0.0",
  "name": "my-awesome-pkg",
  "browserify": {
    "transform": [
      "phpify"
    ]
  }
}
```

Create a PHP module `php/src/MyApp/doubleIt.php`:
```php
<?php

namespace MyApp;

$doubleIt = function ($num) {
    return $num * 2;
};

return $doubleIt; 
```

Call from JS module `js/index.js`:
```javascript
var doubleItModule = require('./src/MyApp/doubleIt.php')();

doubleItModule.execute().then(function (doubleIt) {
    console.log('Double 4 is ' + doubleIt(4));
});
```

Run Browserify:
```shell
mkdir dist
node_modules/.bin/browserify js/index > dist/bundle.js
```

Load the bundle on a webpage, `demo.html`:
```html
<!DOCTYPE html>
<html>
    <head>
        <title>PHPify demo</title>
    </head>
    <body>
        <h1>PHPify demo</h1>

        <script src="dist/bundle.js"></script>
    </body>
</html>
```

and open `demo.html` in a browser.

Complex usage (compiling a Composer app with the Symfony EventDispatcher component)
-----------------------------------------------------------------------------------

Install the Symfony [`EventDispatcher` component](http://symfony.com/doc/current/components/event_dispatcher.html)
```shell
composer require symfony/event-dispatcher
```

Add to the `"browserify"` property in `package.json`:
```json
{
  "version": "1.0.0",
  "name": "my-awesome-pkg",
  "browserify": {
    "transform": [
      "phpify"
    ]
  },
  "phpify": {
    "phpToJS": {
      "include": [
        "php/**/*.php",
        "vendor/autoload.php",
        "vendor/composer/**/*.php",
        "vendor/symfony/event-dispatcher/**/*.php"
      ]
    }
  }
}
```

Create a PHP module `php/src/MyApp/dispatchIt.php`:
```php
<?php

namespace MyApp;

use Symfony\Component\EventDispatcher\EventDispatcher;

$eventDispatcher = new EventDispatcher();
$eventDispatcher->addListener('my.event', function () {
    print 'Listener called!';
});

$eventDispatcher->dispatch('my.event');
print 'and...';
$eventDispatcher->dispatch('my.event');
```

Call from JS module `js/index.js`:
```javascript
var dispatchItModule = require('./src/MyApp/dispatchIt.php')();

dispatchItModule.execute();
```

Run Browserify:
```shell
mkdir dist
node_modules/.bin/browserify js/index > dist/bundle.js
```

Load the bundle on a webpage, `demo.html`:
```html
<!DOCTYPE html>
<html>
    <head>
        <title>PHPify demo</title>
    </head>
    <body>
        <h1>PHPify demo</h1>

        <script src="dist/bundle.js"></script>
    </body>
</html>
```

and open `demo.html` in a browser.

You should then see the output on the page from running the PHP code browser-side:

```html
Listener called!
and...
Listener called!
```
