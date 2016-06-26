"use strict";

var UploadReadings    = require("../../models/UploadReadings");
var Log               = require("node-android-logging");
var Q                 = require("q");

module.exports = {
  get: get
};

/**
 * get retrieves the UploadReadings from the database and returns them via the response.
 */
function get(request, response) {
  UploadReadings.select(request.query.offset, request.query.limit).then(function(uploadReadings) {
    return UploadReadings.count().then(function(count) {
      return new Q.Promise(function(resolve) {
        response.json({
          "length": uploadReadings.length,
          "results": uploadReadings,
          "count": count[0].count
        });

        resolve();
      });
    });
  }).catch(function(rejection) {
    Log.E(rejection);

    response.status(500).json({
      "result": "ERROR",
      "message": "Unable to retrieve uploadReadings"
    });
  });
}

