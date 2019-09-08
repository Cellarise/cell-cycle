"use strict";

/**
 * @param {String} [stores[].action=*] - A user specified store action or all actions.
 */
module.exports = {
  "actions": {
    "removeFile": {
      "handlerRequest": {
        "property": "removeFile",
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
        "responseMessages": {
          "200": "Successfully deleted file.",
          "401": "You are not authorised to delete the file."
        }
      },
      "postResponseHandlers": [
        {
          "lib": "utilHandlers/storeResets",
          "fn": "resetRecordsAndProps",
          "event": "onSuccess"
        },
        {
          "lib": "utilHandlers",
          "fn": "triggerAction",
          "event": "onSuccess",
          "options": {
            "actionRefs": [
              ["container", "refreshHandler"]
            ]
          }
        }
      ]
    }
  }
};
