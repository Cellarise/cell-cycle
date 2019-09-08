"use strict";
import Bacon from 'baconjs';
import R from 'ramda';

export function createStream(config, intent) {
  return Bacon.update.apply(
    null,
    R.concat([
      /**
       * Set initial state of the modelStream (the config object is the initial state of the model stream)
       */
        config
      ],
      /**
       * Set model update handlers (as defined by the intent loader)
       */
      intent
    )
  );
}
