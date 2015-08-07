PHPify
=======

[![Build Status](https://secure.travis-ci.org/uniter/phpify.png?branch=master)](http://travis-ci.org/uniter/phpify)

Browserify transform for requiring PHP modules from JavaScript.

Usage
=====
```javascript
npm install --save-dev browserify phpify
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
var doubleItModule = require('./src/MyApp/doubleIt.php');

doubleItModule.execute().then(function (doubleIt) {
    console.log('Double 4 is ' + doubleIt(4));
});
```

Run Browserify:
```shell
mkdir dist
node_modules/.bin/browserify js/index > dist/bundle.js

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
