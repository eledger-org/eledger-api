/**
 * @module UploadsController
 */

"use strict";

var Uploads           = require("../../models/Uploads");
var Log               = require("node-android-logging");
var Q                 = require("q");

module.exports = {
  getUploads: getUploads
};

/**
 * getUploads retrieves the Uploads from the database and returns them via the response.
 */
function getUploads(request, response) {
  Uploads.select(request.query.offset, request.query.limit).then(function(uploads) {
    return Uploads.count().then(function(count) {
      return new Q.Promise(function(resolve) {
        response.json({
          "length": uploads.length,
          "results": uploads,
          "count": count[0].count
        });

        resolve();
      });
    });
  }).catch(function(rejection) {
    Log.E(rejection);

    response.status(500).json({
      "result": "ERROR",
      "message": "Unable to retrieve uploads"
    });
  });
}

