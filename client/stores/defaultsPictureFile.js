"use strict";

module.exports = {
  "actions": {
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
      },
      "postHandlers": [
        {
          "lib": "pictureFileHandlers",
          "fn": "onChangeFileList"
        }
      ]
    },
    "removeFile": {
      "handlerRequest": {
        "property": "removeFile",
        "secureId": "accountId",
        "query": {
          "where": {
            "id": [
              "props",
              "id"
            ],
            "prefix": "img",
            "secureId": [
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
          "lib": "pictureFileHandlers",
          "fn": "updateActiveRecordPictureFile",
          "event": "onSuccess"
        }
      ]
    }
  }
};
