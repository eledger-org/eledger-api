/**
 * @module DatabaseVersionController
 */

"use strict";

var DatabaseVersion   = require("../../models/DatabaseVersion");
var Log               = require("node-android-logging");

module.exports = {
  getDatabaseVersion: getDatabaseVersion
};

/**
 * getDatabaseVersion retrieves the Database Version from the database and returns it via the response.
 */
function getDatabaseVersion(request, response) {
  DatabaseVersion.select().then(function(databaseVersion) {
    response.json(databaseVersion);
  }).catch(function(rejection) {
    Log.E(rejection);

    response.status(500).json({
      "result": "ERROR",
      "message": "Unable to retrieve database version"
    });
  });
}

