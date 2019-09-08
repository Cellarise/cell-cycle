"use strict";
import R from 'ramda';

/**
 * Get drivers and create driver event streams
 * @param {object} config - the model
 * @returns {object} driver event streams keyed by driver name
 */
export default function load(config) {
  return R.mapObjIndexed((driverConfig, driverName) => {
    const driverStreamFactory = require('../streams/' + driverConfig.path);
    const _driverConfig = R.assoc("name", driverName, driverConfig);
    if (driverConfig.API) {
      return driverStreamFactory.createRemoteAPIStreams.call(driverStreamFactory, _driverConfig, config);
    }
    return driverStreamFactory.createStream.call(driverStreamFactory, _driverConfig, config);
  }, config.get('drivers').toJS());
}
