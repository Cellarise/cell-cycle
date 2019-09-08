"use strict";
import Bacon from 'baconjs';

/**
 * Create the DOM event stream
 * @return {Bacon.EventStream} observer for pushing events from the DOM
 */
export function createStream() {
  return new Bacon.Bus();
}
