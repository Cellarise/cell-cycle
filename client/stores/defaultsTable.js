"use strict";

/**
 * @param {String} [stores[].action=*] - A user specified store action or all actions.
 */
module.exports = {
  "actions": {
    "onCollectionRefreshIfChanged": {
      "path": [
        "collection"
      ],
      "handler": {
        "lib": "collectionHandlers",
        "actions": {
          "find": "find"
        }
      }
    },
    "onCollectionRefresh": {
      "path": [
        "collection"
      ],
      "handler": {
        "lib": "collectionHandlers",
        "actions": {
          "find": "find"
        }
      }
    },
    "onCollectionPropChange": {
      "path": [
        "collection"
      ],
      "handler": {
        "lib": "collectionHandlers",
        "actions": {
          "find": "find"
        }
      }
    },
    "find": {
      "progressFlag": [
        "collection",
        "loading"
      ],
      "handlerRequest": {
        "table": true
      },
      "handlerResponse": {
        "path": [
          "collection",
          "records"
        ]
      }
    }
  },
  "collection": {
    "refreshCounter": 0,
    "hasPrev": null,
    "hasNext": null,
    "page": 1,
    "displayMode": "list",
    "syncWithRecords": false
  }
};
