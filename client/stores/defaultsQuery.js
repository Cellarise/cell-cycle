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
        "lib": "queryHandlers",
        "actions": {
          "query": "getQuery"
        }
      }
    },
    "onCollectionRefresh": {
      "path": [
        "collection"
      ],
      "handler": {
        "lib": "queryHandlers",
        "actions": {
          "query": "getQuery"
        }
      }
    },
    "onCollectionPropChange": {
      "path": [
        "collection"
      ],
      "handler": {
        "lib": "queryHandlers",
        "actions": {
          "query": "query"
        }
      }
    },
    "onCollectionFilterChange": {
      "path": [
        "collection"
      ],
      "handler": {
        "lib": "queryHandlers",
        "actions": {
          "query": "query"
        }
      }
    },
    "onCollectionEditableTableFilterChange": {
      "path": [
        "collection"
      ],
      "handler": {
        "lib": "queryHandlers",
        "actions": {
          "query": "query"
        }
      }
    },
    "getQuery": {
      "preRequestHandlers": [
        {
          "lib": "queryHandlers",
          "fn": "preRequestHandler"
        }
      ],
      "progressFlag": [
        "collection",
        "loading"
      ],
      "handlerRequest": {
        "serverModel": "QueryTableModel",
        "property": "query",
        "data": {
          "tableModelIds": [
            "collection",
            "tableModelIds"
          ],
          "filterName": [
            "collection",
            "filterName"
          ],
          "serviceRole": [
            "collection",
            "serviceRole"
          ],
          "page": [
            "collection",
            "page"
          ],
          "pageSize": [
            "collection",
            "pageSize"
          ],
          "userModelId": [
            "stores",
            "userModelUI-upsert-user",
            "props",
            "id"
          ],
          "subFilterId": [
            "collection",
            "subFilterId"
          ]
        }
      },
      "handlerResponse": {
      },
      "postResponseHandlers": [
        {
          "lib": "queryHandlers",
          "fn": "postResponseHandler"
        }
      ]
    },
    "getQueryPage": {
      "preRequestHandlers": [
        {
          "lib": "queryHandlers",
          "fn": "preRequestHandler"
        }
      ],
      "progressFlag": [
        "collection",
        "loading"
      ],
      "handlerRequest": {
        "serverModel": "QueryTableModel",
        "property": "query",
        "data": {
          "tableModelIds": [
            "collection",
            "tableModelIds"
          ],
          "filterName": [
            "collection",
            "filterName"
          ],
          "serviceRole": [
            "collection",
            "serviceRole"
          ],
          "page": [
            "collection",
            "page"
          ],
          "pageSize": [
            "collection",
            "pageSize"
          ],
          "view": [
            "collection",
            "view"
          ],
          "userModelId": [
            "stores",
            "userModelUI-upsert-user",
            "props",
            "id"
          ],
          "subFilterId": [
            "collection",
            "subFilterId"
          ]
        }
      },
      "handlerResponse": {
      },
      "postResponseHandlers": [
        {
          "lib": "queryHandlers",
          "fn": "postResponseHandler"
        }
      ]
    },
    "query": {
      "preRequestHandlers": [
        {
          "lib": "queryHandlers",
          "fn": "preRequestHandler"
        }
      ],
      "progressFlag": [
        "collection",
        "loading"
      ],
      "handlerRequest": {
        "serverModel": "QueryTableModel",
        "property": "query",
        "data": {
          "tableModelIds": [
            "collection",
            "tableModelIds"
          ],
          "filterName": [
            "collection",
            "filterName"
          ],
          "filter": [
            "collection",
            "filter"
          ],
          "account": [
            "collection",
            "account"
          ],
          "serviceRole": [
            "collection",
            "serviceRole"
          ],
          "chart": [
            "collection",
            "chart"
          ],
          "locked": [
            "collection",
            "locked"
          ],
          "pageSize": [
            "collection",
            "pageSize"
          ],
          "page": [
            "collection",
            "page"
          ],
          "view": [
            "collection",
            "view"
          ],
          "userModelId": [
            "stores",
            "userModelUI-upsert-user",
            "props",
            "id"
          ],
          "subFilterId": [
            "collection",
            "subFilterId"
          ]
        }
      },
      "handlerResponse": {
      },
      "postResponseHandlers": [
        {
          "lib": "queryHandlers",
          "fn": "postResponseHandler"
        }
      ]
    },
    "csvExportAll": {
      "handlerRequest": {
        "serverModel": "QueryTableModel",
        "property": "postExportQuery",
        "data": {
          "tableModelIds": [
            "collection",
            "tableModelIds"
          ],
          "filterName": [
            "collection",
            "filterName"
          ],
          "serviceRole": [
            "collection",
            "serviceRole"
          ],
          "exportType": "CSV_ALL",
          "page": [
            "collection",
            "page"
          ],
          "exportOptions": [
            "collection",
            "exportOptions"
          ],
          "subFilterId": [
            "collection",
            "subFilterId"
          ]
        }
      },
      "handlerResponse": {
        "responseMessages": {
          "200": "Successfully started export. You will receive an email when the export is ready for download.",
          "400": "There was a problem starting the export. Please try again.",
          "401": "You are not authorised to schedule the export.",
          "403": []
        }
      }
    },
    "pdfExportAll": {
      "handlerRequest": {
        "serverModel": "QueryTableModel",
        "property": "postExportQuery",
        "data": {
          "tableModelIds": [
            "collection",
            "tableModelIds"
          ],
          "filterName": [
            "collection",
            "filterName"
          ],
          "serviceRole": [
            "collection",
            "serviceRole"
          ],
          "exportType": "PDF_ALL",
          "page": [
            "collection",
            "page"
          ],
          "exportOptions": [
            "collection",
            "exportOptions"
          ],
          "subFilterId": [
            "collection",
            "subFilterId"
          ]
        }
      },
      "handlerResponse": {
        "responseMessages": {
          "200": "Successfully started export. You will receive an email when the export is ready for download.",
          "400": "There was a problem starting the export. Please try again.",
          "401": "You are not authorised to schedule the export.",
          "403": []
        }
      }
    },
    "deleteQuery": {
      "progressFlag": [
        "collection",
        "loading"
      ],
      "handlerRequest": {
        "serverModel": "QueryTableModel",
        "property": "deleteQuery",
        "data": {
          "tableModelIds": [
            "collection",
            "tableModelIds"
          ],
          "filterName": [
            "collection",
            "filterName"
          ],
          "account": [
            "collection",
            "account"
          ],
          "serviceRole": [
            "collection",
            "serviceRole"
          ],
          "userModelId": [
            "stores",
            "userModelUI-upsert-user",
            "props",
            "id"
          ]
        }
      },
      "handlerResponse": {
      },
      "postResponseHandlers": [
        {
          "lib": "queryHandlers",
          "fn": "postResponseHandler"
        }
      ]
    }
  },
  "collection": {
    "addFilterFlag": false,
    "editFilterFlag": false,
    "editableFilter": false,
    "editableAccountFilter": false,
    "customisable": null,
    "exportable": null,
    "views": null,
    "view": null,
    "chart": {},
    "labelColumnSpec": null,
    "pictureColumnSpec": null,
    "name": null,
    "icon": null,
    "label": null,
    "activeFilter": null,
    "filterModel": {
      "_modelTemplate": {
        "name": null,
        "value": [],
        "label": "",
        "help": "",
        "description": "",
        "validation": {},
        "error": "",
        "showValidating": false,
        "asyncValidationError": false,
        "showError": false,
        "touched": false,
        "hide": false,
        "disabled": false,
        "relation": false
      },
      "_filterName": {
        "name": "_filterName",
        "value": null,
        "label": "Filter name",
        "help": "Enter filter name",
        "description": "The filter name",
        "validation": {},
        "error": "",
        "showValidating": false,
        "asyncValidationError": false,
        "showError": false,
        "touched": false,
        "hide": false,
        "disabled": false,
        "relation": false
      },
      "_account": {
        "name": "_account",
        "value": null,
        "label": "Set as default tab for all users",
        "help": "Set as default tab for all users",
        "description": "Set as default tab for all users",
        "validation": {},
        "error": "",
        "showValidating": false,
        "asyncValidationError": false,
        "showError": false,
        "touched": false,
        "hide": false,
        "disabled": false,
        "relation": false
      },
      "_locked": {
        "name": "_locked",
        "value": null,
        "label": "Prevent users editing filter",
        "help": "Lock the filter from editing by users without the Administrator role",
        "description": "Lock the filter from editing by users without the Administrator role",
        "validation": {},
        "error": "",
        "showValidating": false,
        "asyncValidationError": false,
        "showError": false,
        "touched": false,
        "hide": false,
        "disabled": false,
        "relation": false
      },
      "_updatedFilter": {
        "name": "_updatedFilter",
        "value": [],
        "label": "Column selector",
        "help": "Column selector",
        "description": "Column selector",
        "validation": {
          "type": "object",
          "required": false
        },
        "groups": [],
        "records": [],
        "error": "",
        "showValidating": false,
        "asyncValidationError": false,
        "showError": false,
        "touched": false,
        "hide": false,
        "disabled": false,
        "relation": false
      }
    },
    "tableModelIds": null,
    "querySpecs": null,
    "filterName": "",
    "filterUpdate": null,
    "filter": null,
    "subFilterId": null,
    "account": false,
    "serviceRole": null,
    "locked": false,
    "records": null,
    "recordCount": 0,
    "selectedAll": false,
    "page": null,
    "pageSize": null,
    "exportCounter": 0,
    "refreshCounter": 0,
    "displayMode": "query",
    "syncWithRecords": false
  }
};
