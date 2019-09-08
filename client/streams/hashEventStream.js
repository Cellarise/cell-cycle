"use strict";
import Bacon from 'baconjs';
import {win, logger} from '../globals';
import {getHash, hashToObject} from '../libraries/router';


export let _hashEventStream = Bacon.fromBinder(function eventBinder(sink) {
  function hashChange() {
    sink(new Bacon.Next(function hashNext() {
      return {
        "id": "hashEventStream",
        "storeId": "routerUI",
        "hash": hashToObject(getHash(win.location.href))
      };
    }));
  }
  logger.log("hashEventStream subscribe");
  //initial event is set to prime the stream
  sink({
    "id": "hashEventStream",
    "storeId": "routerUI",
    "hash": hashToObject(getHash(win.location.href))
  });
  if (win.addEventListener) {
    win.addEventListener('hashchange', hashChange, false);
  } else {
    win.attachEvent('onhashchange', hashChange);
  }
  return function unSubscribe() {
    logger.log("hashEventStream unsubscribe");
    if (win.removeEventListener) {
      win.removeEventListener('hashchange', hashChange);
    } else {
      win.detachEvent('onhashchange', hashChange);
    }
  };
});

/**
 * Create the browser hash event stream
 * @return {Bacon.EventStream} changes in the url hash as a stream of events
 */
export function createStream() {
  /**
   * @param {String} sink - window
   * @return {EventStream} changes in the url hash as a stream of events
   */
  return _hashEventStream;
}
