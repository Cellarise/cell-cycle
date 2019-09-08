"use strict";

/**
 * @param {String} [stores[].action=*] - A user specified store action or all actions.
 */
module.exports = {
  "actions": {
    "destroyById": {
      "handlerRequest": {
        "property": "destroyById",
        "data": {
          "id": []
        }
      },
      "handlerResponse": {
        "responseMessages": {
          "200": "Successfully deleted record.",
          "401": "You are not authorised to delete the record."
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
              ["collection", "refreshHandler"]
            ]
          }
        }
      ]
    }
  }
};
