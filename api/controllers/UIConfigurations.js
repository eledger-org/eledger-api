/**
 * @module UIConfigurationsController
 */

"use strict";

var UIConfigurations  = require("../../models/UIConfigurations");
var Log               = require("node-android-logging");
var Mysqlc            = require("../../Mysqlc");
var Q                 = require("q");
var squel             = require("squel");

module.exports = {
  get: get
};

/**
 * Retrieves the UIConfigurations matching the type from the database and returns them via the response.
 */
function get(request, response) {
  let query = squel.select()
    .from(UIConfigurations.tName)
    .where("createdBy = 0")
    .where("type = ?", request.swagger.params.type.value)
    .toParam();

  Mysqlc.rawQueryPromise(query).then(function(results) {
    response.json({
      "length": results.length,
      "results": results,
      "count": results.length
    });
  }).catch(function(rejection) {
    Log.E(rejection);

    response.status(500).json({
      "result": "ERROR",
      "message": "Unable to retrieve accounts"
    });
  });
}

