"use strict";

var DbUpgrade         = require("../DbUpgrade");
var Log               = require("node-android-logging");
var Mysqlc            = require("../Mysqlc");

// Mixes in _.coalesce
require("../util/coalesce");

/*
 * Prepare DB
 */
try {
  Mysqlc.connect();
  DbUpgrade.initializeModels();
  DbUpgrade.setupQueries();
  DbUpgrade.upgrade().then(function() {
    DbUpgrade.finalizeModels();
  }).catch(function(rejection) {
    setTimeout(function() {
      if (rejection !== undefined && rejection.stack !== undefined) {
        throw rejection;
      } else {
        Log.E(rejection);

        throw new Error(rejection);
      }
    });
  });
} catch (ex) {
  Log.E(ex);

  throw ex;
}

