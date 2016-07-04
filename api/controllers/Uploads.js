/**
 * @module UploadsController
 */

"use strict";

var Uploads           = require("../../models/Uploads");
var Log               = require("node-android-logging");
var Q                 = require("q");

module.exports = {
  get: get,
  getUnmapped: getUnmapped
};

/**
 * Retrieves the Uploads from the database and returns them via the response.
 */
function get(request, response) {
  Uploads.select(
      request.query.offset,
      request.query.limit,
      request.query.sortField,
      request.query.sortOrder)
  .then(function(uploads) {
    return Uploads.count().then(function(count) {
      return new Q.Promise(function(resolve) {
        response.json({
          "length": uploads.length,
          "results": uploads.map(addUploadLink),
          "count": count[0].count
        });

        resolve();
      });
    });
  }).catch(function(e) {
    defaultErrorHandler(response, e);
  });
}

function getUnmapped(request, response) {
  Uploads.getUnmapped().then(function(uploads) {
    return new Q.Promise(function(resolve) {
      response.json({
        "length": uploads.length,
        "results": uploads.map(addUploadLink)
      });

      resolve();
    });
  }).catch(function(e) {
    defaultErrorHandler(response, e);
  });
}

function defaultErrorHandler(response, rejection) {
  Log.E(rejection);

  response.status(500).json({
    "result": "ERROR",
    "message": "Unable to retrieve uploads"
  });
}

function addUploadLink(result) {
  if (result.serviceName === false) {
    /* No alternate case yet */
  } else {
    /* Default case */
    result.uploadLink = "/static-stored-files/" + result.filename;
  }

  return result;
}

