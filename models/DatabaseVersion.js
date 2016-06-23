"use strict";

var mysqlc            = require("../mysqlc");
var Q                 = require("q");
var squel             = require("squel");

const tName           = "DatabaseVersion";

module.exports = {
  selDatabaseVersion: selDatabaseVersion
};

/**
 * Requests the database version from the database and returns a Q.Promise to return it.
 *
 * @returns Q.Promise         A promise to return the database version
 *
 * @example
 * // res.json sends a JSON string containing only the database Version (i.e. "6")
 * selDatabaseVersion().then(function(databaseVersion) {
 *   res.json(databaseVersion);
 * });
 */
function selDatabaseVersion() {
  var query = squel.select()
    .from(tName)
    .toString();

  return mysqlc.rawQueryPromise(query).then(function(result) {
    return new Q.Promise(function(resolve) {
      resolve(result[0].databaseVersion);
    });
  });
}

