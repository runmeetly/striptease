/*
 *  Copyright 2019 Meetly Inc.
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

// Temporary tests
//
// Really dumb tests that we run manually and look over the output manually.
// One day these will be better - but for now this is what we have, better
// than nothing I suppose.
require("babel-polyfill");
const { Striptease } = require("../dist/striptease.min.js");

const SENSITIVE_KEYS = ["name", "email"];

function createStripper(optionsAsArray) {
  return Striptease.create(
    !!optionsAsArray
      ? SENSITIVE_KEYS
      : {
          sensitive: SENSITIVE_KEYS,
          maxDepth: 99
        }
  );
}

async function runTest(testName, stripper, test) {
  console.log(`Running test: '${testName}'`);
  console.log("");
  console.log("Before stripping: \n", test);
  console.log("");

  const stripped = await stripper.strip(test);
  console.log("After stripping: \n", ...stripped);
  console.log("");
  console.log("");
}

async function listTest() {
  const stripper = createStripper(true);
  await runTest("List Test", stripper, [
    1,
    2,
    3,
    4,
    "name",
    "email",
    [5, 6, 7, "name", "email"],
    { 8: "a", 9: "email" }
  ]);
}

async function emptyListTest() {
  const stripper = createStripper();
  await runTest("Empty List Test", stripper, []);
}

async function emptyObjectTest() {
  const stripper = createStripper();
  await runTest("Empty Object Test", stripper, {});
}

async function emptyStripperListTest() {
  const stripper = Striptease.create();
  await runTest("Empty Stripper List Test", stripper, [
    1,
    2,
    3,
    4,
    "name",
    "email",
    [5, 6, 7, "name", "email"],
    { 8: "a", 9: "email" }
  ]);
}

async function emptyStripperObjectTest() {
  const stripper = Striptease.create();
  await runTest("Empty Stripper Object Test", stripper, {
    1: "a",
    2: "b",
    3: "c",
    4: "d",
    5: "e",
    6: "f",
    7: "g",
    email: "DONT_SHOW",
    name: "DONT_SHOW",
    8: "email",
    9: "name",
    10: ["hello", "world", "email", "name"],
    11: ["hello", "world", { 1: "foo", 2: "email", 3: "bar", 4: "name" }],
    12: ["hello", "world", ["foo", "email", "bar", "name"]],
    13: { 1: "hello", 2: "world", 3: "email", 4: "name" },
    14: { 1: "hello", 2: "world", 3: ["foo", "email", "bar", "name"] },
    15: {
      1: "hello",
      2: "world",
      3: { 1: "foo", 2: "email", 3: "foo", 4: "name" }
    }
  });
}

async function objectTest() {
  const stripper = createStripper(true);
  await runTest("Object Test", stripper, {
    1: "a",
    2: "b",
    3: "c",
    4: "d",
    5: "e",
    6: "f",
    7: "g",
    email: "DONT_SHOW",
    name: "DONT_SHOW",
    8: "email",
    9: "name",
    10: ["hello", "world", "email", "name"],
    11: ["hello", "world", { 1: "foo", 2: "email", 3: "bar", 4: "name" }],
    12: ["hello", "world", ["foo", "email", "bar", "name"]],
    13: { 1: "hello", 2: "world", 3: "email", 4: "name" },
    14: { 1: "hello", 2: "world", 3: ["foo", "email", "bar", "name"] },
    15: {
      1: "hello",
      2: "world",
      3: { 1: "foo", 2: "email", 3: "foo", 4: "name" }
    },
    object: {
      email: "DONT_SHOW_THIS",
      key: "name",
      object: {
        email: "DONT_SHOW_THIS",
        key: "name",
        object: {
          email: "DONT_SHOW_THIS",
          key: "name",
          object: {
            email: "DONT_SHOW_THIS",
            key: "name",
            object: {
              email: "DONT_SHOW_THIS",
              key: "name",
              object: {
                email: "DONT_SHOW_THIS",
                key: "name",
                object: {
                  email: "DONT_SHOW_THIS",
                  key: "name"
                }
              }
            }
          }
        }
      }
    }
  });
}

async function main() {
  await emptyListTest();
  await emptyObjectTest();
  await emptyStripperListTest();
  await emptyStripperObjectTest();
  await listTest();
  await objectTest();
}

main();
