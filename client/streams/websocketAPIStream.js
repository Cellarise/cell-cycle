"use strict";
import Bacon from 'baconjs';
import R from 'ramda';
import {win, $} from '../globals';
import {generateInteval} from '../utils/exponentialBackoff';

const NUMBER_RETRIES = 30;

export function createRemoteAPIStreams(driverConfig) {
  const request = new Bacon.Bus();
  const requestStreams = {
    "websocketUI": {
      "websocketStream": new Bacon.Bus(),
      "websocketSendStream": new Bacon.Bus()
    }
  };
  let _xhrCSRF, _websocket;
  let retries = 0;
  let timeoutVar;
  const responseStreams = {
    "websocketUI": {
      "websocketSendStream": requestStreams.websocketUI.websocketSendStream.flatMapLatest(action => {
          const baseEvent = {
            "id": "websocketSendStream",
            "storeId": "websocketUI"
          };
          //send message
          if (!R.isNil(_websocket) && _websocket.readyState === 1) {
            _websocket.send(JSON.stringify(action));
          }
          return Bacon.once(R.assoc("event", {
            "type": "send"
          }, baseEvent));
        }
      ),
      "websocketStream": requestStreams.websocketUI.websocketStream
        .filter(action => {
          if (action.type === "disconnect" && !R.isNil(_websocket)) {
            return true;
          }
          if (!R.isNil(_xhrCSRF) && _xhrCSRF.readyState !== 4) {
            return false;
          }
          return true;
        })
        .flatMapLatest(action => {
          const connectorConfig = win.globalEnvVariables.connectors[driverConfig.name].wsServer;
          const baseEvent = {
            "id": "websocketStream",
            "storeId": "websocketUI"
          };
          if (!win.WebSocket) {
            return Bacon.once(R.assoc("event", {
              "type": "unsuppported"
            }, baseEvent));
          }
          //read action to determine whether disconnecting
          if (action.type === "disconnect") {
            if (!R.isNil(_websocket)) {
              _websocket.close();
            }
            _websocket = null;
            return Bacon.once(R.assoc("event", {
              "type": "close"
            }, baseEvent));
          }

          return Bacon.fromBinder(function eventBinder(sink) {
            //
            //connect request - get csrf token first
            function getCSRFAndInit() {
              $.ajax(R.pipe(
                R.assocPath(["headers", driverConfig.security.accessTokenHeader], action.accessTokenId),
                R.assocPath(["headers", driverConfig.security.sessionTokenHeader], action.sessionTokenId)
                )({
                  "headers": [],
                  "url": win.globalEnvVariables.connectors.remoteAPI.apiServer + driverConfig.security.sessionUrl,
                  "type": "GET",
                  "timeout": driverConfig.ajax.timeout,
                  "success": (tokens) => (init(tokens)),
                  "error": (error) => {
                    sink(new Bacon.Next(function wsNext() {
                      return R.assoc("event", error, baseEvent);
                    }));
                  }
                })
              );
            }
            //connect request - get csrf token first
            function init(tokens) {
              retries = retries + 1;
              if (retries < NUMBER_RETRIES) {
                //connect request
                _websocket = new WebSocket(
                  connectorConfig + "/wsApi?access_token=" + encodeURIComponent(action.accessTokenId) +
                  "&userId=" + action.userId + "&accountType=" + action.accountType + "&accountId=" + action.accountId +
                  "&session_token=" + encodeURIComponent(tokens[driverConfig.security.sessionTokenResponse]) +
                  "&csrf_token=" + encodeURIComponent(tokens[driverConfig.security.CSRFTokenResponse])
                );
                _websocket.onopen = function (open) {
                  retries = 0;
                  sink(new Bacon.Next(function wsNext() {
                    return R.assoc("event", open, baseEvent);
                  }));
                };
                _websocket.onclose = function (close) {
                  sink(new Bacon.Next(function wsNext() {
                    return R.assoc("event", close, baseEvent);
                  }));
                };
                _websocket.onerror = function (error) {
                  sink(new Bacon.Next(function wsNext() {
                    return R.assoc("event", error, baseEvent);
                  }));
                };
                _websocket.onmessage = function (message) {
                  sink(new Bacon.Next(function wsNext() {
                    return R.assoc("event", message, baseEvent);
                  }));
                };
              }
            }

            //control initiation to prevent server flood in case of server crash and clients all trying to reconnect
            timeoutVar = setTimeout(getCSRFAndInit, generateInteval(retries));

            return function unSubscribe() {
              //note this is called everytime a reconnect occurs i.e. push to this stream
              if (!R.isNil(_xhrCSRF) && _xhrCSRF.readyState !== 4) { //4 = request finished and response is ready
                _xhrCSRF.abort();
              }
              if (!R.isNil(_websocket) && _websocket.readyState !== 3) { //3 = closed
                clearTimeout(timeoutVar);
                _websocket.close();
              }
              return null;
            };
          });
        }
      )
    }
  };
  return {
    'push': (action) => (request.push(action)),
    'request': request,
    'requestStreams': requestStreams,
    'responseStreams': responseStreams
  };
}
