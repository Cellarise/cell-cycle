"use strict";
import R from 'ramda';
import {getDriverIntentHandler} from '../libraries/intent';

export default function load(configLoader, driverLoader, actionLoader) {
  const config = configLoader();
  const drivers = driverLoader(config);
  return {
    "config": config,
    "drivers": drivers,
    "intent": R.pipe(
      R.toPairs, //intent requires a array of driverIntentHandlers
      R.filter(driverPair => (R.defaultTo(true, driverPair[1].enableIntentHandlers))),
      R.map(driverPair => {
        return getDriverIntentHandler(R.assoc("name", driverPair[0], driverPair[1]), drivers, actionLoader);
      }),
      R.unnest //flatten to a single array of driverIntentHandlers
    )(config.get('drivers').toJS())
  };
}
