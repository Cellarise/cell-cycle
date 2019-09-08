"use strict";
/**
 * A store configuration file
 * @param {String} stores[].name - The store name.
 * @param {String} [stores[].uiStoreJSON] - A user specified store configuration - may be null if no store.
 * @param {Object} [stores[].acls] - An annotated store acls - may be undefined if no store.
 * @param {Object} [stores[].uiStoreJSON] - An annotated store configuration - may be undefined if no store.
 * @param {Object} [stores[].authorisation] - An annotated authorisation - may be undefined if no store.
 * @param {String} [stores[].authorisation.model=null] - An annotated authorisation - may be undefined if no store.
 * @param {String} [stores[].authorisation.property=action] - An annotated authorisation - may be undefined if no store.
 * @param {String} [stores[].authorisation.accessType=READ] - An annotated authorisation - may be undefined if no store.
 * @param {Boolean} [stores[].authorised=true] - A flag indicating whether the page is authorised for current user.
 * @param {String} [stores[].action=*] - A user specified store action or all actions.
 */
const defaults = {
  "version": "0",
  "startupVars": [],
  "serverModel": null,
  "acls": [],
  "authorisation": {
    "model": null,
    "property": "findById",
    "accessType": "READ"
  },
  "access": {
    "mode": {
      "create": false,
      "read": false,
      "update": false,
      "delete": false
    },
    "create": {
      "model": null,
      "property": "create",
      "accessType": "*"
    },
    "read": {
      "model": null,
      "property": "*",
      "accessType": "READ"
    },
    "update": {
      "model": null,
      "property": "updateAttributes",
      "accessType": "WRITE"
    },
    "delete": {
      "model": null,
      "property": "destroyById",
      "accessType": "WRITE"
    }
  },
  "actions": {
    "returnToPrevious": {
      "handler": {
        "lib": "routeHandlers"
      }
    },
    "returnToPreviousHash": {
      "handler": {
        "lib": "routeHandlers"
      }
    },
    "returnToHome": {
      "handler": {
        "lib": "routeHandlers"
      }
    },
    "onResetPage": {
      "handler": {
        "lib": "routeHandlers",
        "fn": "resetPage"
      }
    },
    "refresh": {
      "handler": {
        "lib": "refreshHandlers"
      }
    },
    "onMultipleActions": {
      "handler": {
        "lib": "utilHandlers"
      }
    },
    "onRecordChange": {
      "handler": {
        "lib": "recordHandlers",
        "fn": "onRecordChange"
      }
    },
    "onChange": {
      "preHandlers": [
        {
          "lib": "fieldHandlers/onChange",
          "fn": "validateField",
          "options": {
            "triggerAsyncValidations": true
          }
        }
      ],
      "handler": {
        "lib": "fieldHandlers",
        "fn": "onChange"
      }
    },
    "onChangeTemp": {
      "handler": {
        "lib": "fieldHandlers"
      }
    },
    "onBlur": {
      "handler": {
        "lib": "fieldHandlers"
      }
    },
    "onSetTab": {
      "handler": {
        "lib": "fieldHandlers"
      }
    },
    "onTabChange": {
      "preHandlers": [
        {
          "lib": "fieldHandlers/onTabChange",
          "fn": "validateTabs"
        }
      ],
      "handler": {
        "lib": "fieldHandlers"
      }
    },
    "onViewTablePagination": {
      "handler": {
        "lib": "collectionHandlers"
      }
    },
    "onExportViewRecords": {
      "handler": {
        "lib": "collectionHandlers",
        "fn": "onExportViewRecords"
      }
    },
    "preGenerateViewRecordsCSV": {
      "handler": {
        "lib": "collectionHandlers"
      }
    },
    "onReset": {
      "handler": {
        "lib": "utilHandlers/storeResets",
        "fn": "resetRecords"
      }
    },
    "onResetCollection": {
      "handler": {
        "lib": "utilHandlers/storeResets",
        "fn": "resetCollection"
      }
    },
    "onResetRecordsAndProps": {
      "handler": {
        "lib": "utilHandlers/storeResets",
        "fn": "resetRecordsAndProps"
      }
    },
    "onMessage": {
      "handler": {
        "lib": "utilHandlers/messages",
        "fn": "toastMessage"
      }
    },
    "onSetIn": {
      "handler": {
        "lib": "utilHandlers",
        "fn": "setIn"
      }
    },
    "onSetLabel": {
      "handler": {
        "lib": "utilHandlers",
        "fn": "setLabel"
      }
    },
    "onModal": {
      "handler": {
        "lib": "utilHandlers/modal"
      }
    }
  },
  "records": [],
  "recordTemplate": {},
  "embeddedModels": {},
  "collection": {
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
  },
  "relations": {
    "onPrimaryIdForceUpdate": false,
    "ignoreForeignKeys": []
  },
  "props": {
    "initialStateTransitionFlag": false,
    "save": {
      "hasChangesToSave": false,
      "saveCounter": 0
    },
    "id": null,
    "activeRecordIndex": 0,
    "record": null,
    "inProgress": false,
    "inProgressByAction": {
      "findById": false,
      "find": false
    },
    "success": "",
    "error": "",
    "tabs": {
      "currentPage": 0,
      "touched": {}
    }
  },
  "hidden": {
    "props": [],
    "record": []
  }
};
/**
 * @ignore
 */
module.exports = defaults;
