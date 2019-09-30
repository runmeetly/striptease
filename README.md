# striptease

## Install

```shell script

$ npm i @runmeetly/striptease

$ yarn add @runmeetly/striptease

```

## What

A small utility that searches a list of arguments and strips out sensitive bits.
It does not perform any logging on its own however - it simply processes arguments so that
they can be passed on to `console` or other logging systems.

## Why

For fun, and a cheap way to naively remove potentially sensitive information from system logs.

## How

Before:

```javascript
const sensitive = [
  "This",
  "array",
  "contains",
  "sensitive",
  "info",
  {
    id: 42069,
    sensitiveData: "https://www.runmeetly.com"
  }
];

console.log("Take a look at this data: ", sensitive);

// Prints
//
// 'Take a look at this data: [
//     "This",
//     "array",
//     "contains",
//     "sensitive",
//     "info",
//     {
//       id: 42069,
//       sensitiveData: "https://www.runmeetly.com"
//     }
//   ]
```

After:

```javascript
const sensitive = [
  "This",
  "array",
  "contains",
  "sensitive",
  "info:",
  {
    id: 42069,
    sensitiveData: "https://www.runmeetly.com"
  }
];

// The sensitive keys to search for and remove
const requiredSensitiveKeysArray = ["email", "sensitiveData"];

// An optional side effect handler for when processing goes wrong
//
// This will always be called, regardless of the whether or not the `failOnError` flag is set.
const optionalPanicHandler = (...errorArgs) => {
  console.error(
    "An error has occurred while processing sensitive data: ",
    ...errorArgs
  );
};

// Maximium depth to dive into nested objects and arrays
const optionalMaxDepth = 4;

// If this flag is set to false, if a strip() operation encounters an error,
// it will return the original arguments passed to it - which may contain sensitive information.
// If this flag is set to true (default), errors in operation will return an empty list, which prevents
// the leaking of potentially sensitive information.
const optionalFailOnError = false;

// If this flag is set to false (default), sensitive data will be replaced with '*'
// If this flag is set to true, sensitive data will be deleted out of the payload
const optionalBare = true;

const stripper = Striptease.create({
  sensitive: requiredSensitiveKeysArray,
  panic: optionalPanicHandler,
  maxDepth: optionalMaxDepth,
  failOnError: optionalFailOnError,
  bare: optionalBare
});

// The result of strip() will always be a Promise that resolves
// to an array, so spread it out to get clean logs
stripper
  .strip("Take a look at this data: ", sensitive)
  .then(result => console.log(...result));

// Prints after delay
//
// 'Take a look at this data: [
//     "This",
//     "array",
//     "contains",
//     "sensitive",
//     "info",
//     {
//       id: 42069
//     }
//   ]
```

## What Can It Do

`striptease` can search through `Arrays []` and `Objects {}` and remove sensitive information.
In the case of an `Object {}` it will remove the key value pair. It can also dive into nested objects
and remove sensitive data from those nested objects. It can dive into nested arrays following the
logic below.

In the case of an `Array []`, it will remove the index if it is a `String`, it can also dive into
nested arrays, or nested objects following the object rule above.

You can also configure `striptease` to only dive to a `maxDepth` which will prevent it from going
so deep that it begins to affect performance. By default it will dive into nested objects that are
4 levels deep.

To attempt to mitigate the performance hit caused by processing potentially large objects, all
operations run as `async/await` coroutine style calls, which should help by offloading work to
the closest microtask loop. This means that stripping operations will not block, and will never be
immediate. If you have - for some reason - performance critical log expectations,
you should strip sensitive information by hand.

## What Can't It Do

For performance reasons, `striptease` will not attempt to strip sensitive information out of plain
`String` arguments passed to it. `striptease` will only attempt to operate on complex data which is
in the form of either an `Array []` or an `Object {}`.

# Credit

`striptease` is primarily developed and maintained by
[Peter](https://github.com/pyamsoft) at
[Meetly](https://www.runmeetly.com).

# License

```
 Copyright 2019 Meetly Inc.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```
