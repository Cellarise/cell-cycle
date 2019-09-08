"use strict";
import Bacon from 'baconjs';
import R from 'ramda';
import {logger} from '../globals';
import requireFeature from '../../../../client/source/view/features/requireFeature';


/**
 * Create the Webpack Chunk event stream
 * @return {Object} a map containing an array of request streams and an array of response streams
 */
export function createRemoteAPIStreams(driverConfig, model) {
  const request = new Bacon.Bus();
  const requestStreams = {};
  const responseStreams = {};

  R.map(store => {
    R.mapObjIndexed((actionConfig, actionId) => {
      if (actionConfig.hasOwnProperty('handlerRequest') && actionConfig.driver === driverConfig.name) {
        const storeId = store.name;
        if (!requestStreams[storeId]) {
          requestStreams[storeId] = {};
          responseStreams[storeId] = {};
        }
        requestStreams[storeId][actionId] = new Bacon.Bus();
        responseStreams[storeId][actionId] = requestStreams[storeId][actionId].flatMap(action => {
          return Bacon.fromCallback(function(callback) {
            requireFeature(action.feature, action.path, (err) => {
              if (err) {
                logger.error(
                  "There was an error when loading feature " + action.feature + " with path " + action.path
                );
                return callback(R.assoc('status', 'error', action));
              }
              logger.log("Loaded feature chunk: " + action.feature + ". Requested for path: " + action.path);
              return callback(R.assoc('status', 'loaded', action));
            });
          });
        });
      }
    }, store.actions);
  }, model.get('configCompiled').stores);

  return {
    'push': (action) => (request.push(action)),
    'request': request,
    'requestStreams': requestStreams,
    'responseStreams': responseStreams
  };
}
