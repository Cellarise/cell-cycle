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
          "find": "find",
          "count": "count"
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
          "find": "find",
          "count": "count"
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
          "find": "find",
          "count": "count"
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
    },
    "count": {
      "handlerRequest": {
        "table": true
      },
      "handlerResponse": {
        "path": [
          "collection",
          "recordCount"
        ],
        "suppressMessages": true
      }
    }
  },
  "collection": {
    "refreshCounter": 0,
    "page": 1,
    "displayMode": "list",
    "syncWithRecords": true
  }
};
