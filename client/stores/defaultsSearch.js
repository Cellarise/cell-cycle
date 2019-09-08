"use strict";

/**
 * @param {String} [stores[].action=*] - A user specified store action or all actions.
 */
module.exports = {
  "actions": {
    "onSearchPropChange": {
      "path": [
        "search"
      ],
      "handler": {
        "lib": "collectionHandlers",
        "actions": {
          "find": "find-search"
        }
      }
    },
    "find-search": {
      "progressFlag": [
        "search",
        "loading"
      ],
      "preRequestHandlers": [
        {
          "lib": "remoteAPIHandlers/preRequestHandlers",
          "fn": "filter",
          "options": {
            "filter": [
              {
                "get": [
                  "search",
                  "term"
                ],
                "op": "neq",
                "test": ""
              },
              {
                "get": [
                  "search",
                  "term"
                ],
                "op": "neq",
                "test": null
              }
            ]
          }
        }
      ],
      "handlerRequest": {
        "property": "find",
        "debounce": 1000,
        "query": {
          "where": {
            "or": [
              {
                "id": {
                  "like": [
                    "search",
                    "term"
                  ]
                }
              },
              {
                "name": {
                  "like": [
                    "search",
                    "term"
                  ]
                }
              }
            ]
          },
          "limit": 10
        },
        "table": false
      },
      "handlerResponse": {
        "path": [
          "search",
          "records"
        ]
      }
    }
  },
  "search": {
    "idFieldName": "id",
    "displayFieldName": "name",
    "refreshCounter": 0,
    "term": "",
    "selectedRecord": null,
    "records": null,
    "loading": false
  }
};
