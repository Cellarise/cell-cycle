"use strict";
import {_hashEventStream} from './hashEventStream';
import {logger} from '../globals';

export let _hashEventStreamDiff = _hashEventStream.diff(
  null,
  (prevHash, hash) => ({
    "id": hash.id, //use hashEventStream id as this stream simply adds the prevHash
    "storeId": hash.storeId, //should be routerUI
    "prevHash": prevHash ? prevHash.hash : null,
    "hash": hash.hash
  })
);

/**
 * This function will self-subscribe to hashEventStreamDiff which in turn will subscribe to hashEventStream to force
 * these streams to remain active i.e. override lazy evaluation.
 * @return {EventStream} changes in the url hash as a stream of events including the urrent hash and previous hash
 */
export function createStream() {
  _hashEventStreamDiff.onValue(log => {
    logger.log("HASH change: " + JSON.stringify(log));
  });
  return _hashEventStreamDiff;
}

