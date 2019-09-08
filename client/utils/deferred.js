// Modified from Route Planner to support modules
// This file is here instead of vendor since ES6 spread operator is used
import {$} from '../globals';


/*
 * Creates a deferred set that resolves deferreds in order that pass a test.
 *
 * For example:
 * - if A, B, C are deferreds
 * - A doesn't pass the test, but B and C do
 * - C is resolved first, then A and B
 * then the results of B will be returned.
 *
 * Deferreds are added to a set using the add method:
 *
 * var set = orderedDeferredSet(function(result) { return result.length });
 * var deferredA = $.Deferred();
 * var deferredB = $.Deferred();
 * var deferredC = $.Deferred();
 * var proxyA = set.add(deferredA);
 * var proxyB = set.add(deferredB);
 * var proxyC = set.add(deferredC);
 *
 * Proxys are just deferreds:
 *
 * proxyA.then(function(result) { console.log(result) });
 * proxyB.then(function(result) { console.log(result) });
 * proxyC.then(function(result) { console.log(result) });
 *
 * Call done once all deferreds are added. A callback method can be passed to execute if no deferreds satisfy the test.
 *
 * set.execute();
 *
 * The first deferred that is resolved that passes the test will resolve its corresponding proxy:
 *
 * deferredA.resolve([]);
 * deferredC.resolve(["C"]);
 * deferredB.resolve(["B"]);
 *
 * "B" will be printed to the console.
 *
 * @params [Function] test test to apply on resolved results of each deferred
 * @return [Object] ordered deferred set object where deferreds can be added
 */
module.exports = function orderedDeferredSet(test) {
  return {
    _deferreds: [],
    _test: test,
    add: function (deferred) {
      const proxy = $.Deferred();
      this._deferreds.push({
        original: deferred,
        proxy: proxy
      });
      return proxy;
    },
    execute: function (fallthrough) {
      orderedRecursive(this._test, this._deferreds, fallthrough);
    }
  };
};

function orderedRecursive(test, deferreds, fallthrough) {
  const first = deferreds[0];
  if (first) {
    first.original.done((...args) => {
      if (test(...args)) {
        first.proxy.resolve(...args);
      } else {
        orderedRecursive(test, deferreds.slice(1), fallthrough);
      }
    }).fail(() => {
      orderedRecursive(test, deferreds.slice(1), fallthrough);
    });
  } else if (fallthrough) {
    fallthrough();
  }
}
