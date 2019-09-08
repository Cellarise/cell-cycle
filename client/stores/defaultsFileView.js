"use strict";

/**
 * @param {String} [stores[].action=*] - A user specified store action or all actions.
 */
module.exports = {
  "actions": {
    "onContainerRefresh": {
      "path": [
        "container"
      ],
      "handler": {
        "lib": "collectionHandlers",
        "fn": "onCollectionRefresh",
        "actions": {
          "find": "files"
        }
      }
    },
    "onContainerPropChange": {
      "path": [
        "container"
      ],
      "handler": {
        "lib": "collectionHandlers",
        "fn": "onCollectionPropChange",
        "actions": {
          "find": "files"
        }
      }
    },
    "upload": {
      "handlerRequest": {}
    },
    "download": {
      "preRequestHandlers": [
        {
          "lib": "remoteAPIHandlers/preRequestHandlers",
          "fn": "filter",
          "options": {
            "filter": [
              {
                "get": [
                  "props",
                  "id"
                ],
                "op": "neq",
                "test": ""
              }
            ]
          }
        }
      ],
      "handlerRequest": {
        "query": {
          "where": {
            "id": [
              "props",
              "id"
            ]
          }
        }
      },
      "handlerResponse": {
        "path": ["files", "download"]
      }
    },
    "files": {
      "progressFlag": [
        "container",
        "loading"
      ],
      "handlerRequest": {
        "property": "files",
        "table": false
      },
      "handlerResponse": {
        "path": [
          "container",
          "records"
        ]
      }
    }
  },
  "container": {
    "displayMode": "table",
    "refreshCounter": 0,
    "records": null,
    "recordCount": null,
    "recordDisplayField": "name",
    "page": 1,
    "pageSize": 10,
    "activeRecordIndex": -1,
    "syncWithRecords": false,
    "loading": false,
    "searchTerm": "",
    "searchTerm2": "",
    "search": {
      "term": "",
      "selectedRecord": null,
      "records": null,
      "loading": false
    }
  }
};
