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

const TYPE_OF_OBJECT = typeof {};
const DEFAULT_OPTIONS_OBJECT = {};
const DEFAULT_SENSITIVE_KEYS = [];
const DEFAULT_PANIC_HANDLER = null;
const DEFAULT_FAIL_ON_ERROR = true;
const DEFAULT_MAX_DEPTH = 4;
const DEFAULT_BARE = true;

const COVERUP = "*";

/**
 * Strips things.
 */
export class Striptease {
  /**
   * Create a new stripper
   *
   * @param {{
   *   sensitive: {Array: []},
   *   panic: {Function: null},
   *   failOnError: {Boolean: true},
   *   maxDepth: {Number: 4}
   *   bare: {Boolean: false}
   * }} options - Options object
   *
   * @return {Stripper} - Strip stuff
   */
  static create(options) {
    let teaseOptions = DEFAULT_OPTIONS_OBJECT;
    if (!!options) {
      if (Array.isArray(options)) {
        // If the options passed is an array, treat it as the sensitive keys
        teaseOptions.sensitive = options;
      } else if (typeof options === TYPE_OF_OBJECT) {
        // If the options passed is an object, use it
        teaseOptions = options;
      }
    }

    const sensitiveKeys = teaseOptions.sensitive || DEFAULT_SENSITIVE_KEYS;
    const panic = teaseOptions.panic || DEFAULT_PANIC_HANDLER;
    const failOnError = teaseOptions.failOnError || DEFAULT_FAIL_ON_ERROR;
    const maxDepth = teaseOptions.maxDepth || DEFAULT_MAX_DEPTH;
    const bare =
      teaseOptions.bare === undefined || teaseOptions.bare === null
        ? DEFAULT_BARE
        : !!teaseOptions.bare;

    /**
     * Strip sensitive info from arrays
     *
     * @param {Number} depth - current operating depth
     * @param {Array<*>} array - arguments
     * @return {Promise<*>}
     */
    const stripSensitiveArrayInfo = async (depth, array) => {
      // Exceeded max depth - don't dig so deep.
      // Or no sensitive keys
      if (depth >= maxDepth || !sensitiveKeys || sensitiveKeys.length <= 0) {
        return array;
      }

      const stripped = [];
      for (const item of array) {
        // If this item is an array itself, recursively call through
        if (Array.isArray(item)) {
          stripped.push(await stripSensitiveArrayInfo(depth + 1, item));
        } else if (typeof item === TYPE_OF_OBJECT) {
          // If this item is an object itself, recursively call through
          stripped.push(await stripSensitiveObjectInfo(depth + 1, item));
        } else if (sensitiveKeys.indexOf(item) < 0) {
          // Just make sure that the item is not sensitive
          stripped.push(item);
        } else {
          // This item is sensitive. If we are not stripping bare, add it as a '*'
          if (!bare) {
            stripped.push(COVERUP);
          }
        }
      }

      return stripped;
    };

    /**
     * Strip sensitive info from objects
     *
     * @param {Number} depth - current operating depth
     * @param {Object} object - argument
     * @return {Promise<*>}
     */
    const stripSensitiveObjectInfo = async (depth, object) => {
      // Exceeded max depth - don't dig so deep.
      // Or no sensitive keys
      if (depth >= maxDepth || !sensitiveKeys || sensitiveKeys.length <= 0) {
        return object;
      }

      const stripped = {};

      // For the keys in the object
      for (const key of Object.keys(object)) {
        if (!object.hasOwnProperty(key)) {
          continue;
        }

        if (sensitiveKeys.indexOf(key) >= 0) {
          // If this is a sensitive key and we are stripping bare, we strip it out
          if (bare) {
            continue;
          } else {
            stripped[key] = COVERUP;
            continue;
          }
        }

        // Grab the value
        const value = object[key];

        // If the value is falsey it is not sensitive, just pass it in
        if (!value) {
          stripped[key] = value;
          continue;
        }

        // Otherwise, we check that the value is not a sensitive Array itself
        if (Array.isArray(value)) {
          stripped[key] = await stripSensitiveArrayInfo(depth + 1, value);
          continue;
        }

        // Check object too, after Array since Array is object but object is not array
        if (typeof value === TYPE_OF_OBJECT) {
          stripped[key] = await stripSensitiveObjectInfo(depth + 1, value);
          continue;
        }

        // If the item is not sensitive, add it in
        if (sensitiveKeys.indexOf(value) < 0) {
          stripped[key] = value;
        } else {
          // This item is sensitive. If we are not stripping bare, add it as a '*'
          if (!bare) {
            stripped[key] = COVERUP;
          }
        }
      }

      return stripped;
    };

    /**
     * The actual strip entry point.
     */
    class Stripper {
      /**
       * Strip stuff
       *
       * The result of strip() will always be a Promise that resolves to an array.
       * Spread the array out before using it as a drop in replacement for vararg methods.
       *
       * @param {*} args - Anything
       * @return {Promise<Array<*>>} - A promise with the same stuff, just stripped
       */
      async strip(...args) {
        // If nothing, an empty array to adhere to API contract
        if (!args || args.length <= 0) {
          return [];
        }

        // Or no sensitive keys
        if (!sensitiveKeys || sensitiveKeys.length <= 0) {
          return args;
        }

        try {
          const stripped = [];

          // For each of the args
          for (const arg of args) {
            if (Array.isArray(arg)) {
              // If its an array, dive into its indexes and strip them
              stripped.push(await stripSensitiveArrayInfo(0, arg));
            } else if (typeof arg === TYPE_OF_OBJECT) {
              // If its an object dive into its keys and strip them
              stripped.push(await stripSensitiveObjectInfo(0, arg));
            } else if (sensitiveKeys.indexOf(arg) < 0) {
              // Else we pray
              stripped.push(arg);
            } else {
              // This item is sensitive. If we are not stripping bare, add it as a '*'
              if (!bare) {
                stripped.push(COVERUP);
              }
            }
          }

          // May be empty if no args were kept
          return stripped;
        } catch (e) {
          if (!!panic) {
            panic(new StripteaseError(e, teaseOptions));
          }

          // If we are marked as fail on error, do not return anything because
          // we do not want to expose potentially sensitive information.
          if (!!failOnError) {
            return [];
          }

          // If we fail, just return the normal object
          return args;
        }
      }
    }

    return new Stripper();
  }
}

/**
 * The error object format returned from a bad strip.
 */
class StripteaseError extends Error {
  constructor(error, config) {
    super();

    // Name of the error
    this.name = "StripteaseError";

    // Message, not really helpful right now
    this.message = "Failed to strip sensitive information";

    // The config that this `Striptease` instance was created with
    this.config = config;

    // The actual error thrown
    this.error = error;
  }
}
