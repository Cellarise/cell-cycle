"use strict";
var modelStream = require('../streams/modelStream');

export default function load(intent) {
  return {
    "modelStream": modelStream.createStream(intent.config, intent.intent),
    "drivers": intent.drivers,
    "intent": intent.intent,
    "config": intent.config
  };
}
