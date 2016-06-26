/**
 * @module DefaultModelActions
 *
 * @description
 * DefaultModelActions is a parent class to each model which provides some default actions and
 * documentation for building new models.
 */

"use strict";

var _                 = require("underscore");
var Mysqlc            = require("../Mysqlc");
var squel             = require("squel");
var upgrade           = require("../DbUpgrade");

var tName             = "";
var DEFAULT_OFFSET    = 0;
var DEFAULT_LIMIT     = 10;

module.exports = {
  tName: tName,
  setupQueries: setupQueries,
  finalCreates: [],
  migrates: [],
  DEFAULT_OFFSET: DEFAULT_OFFSET,
  DEFAULT_LIMIT:  DEFAULT_LIMIT,
  select: select,
  count: count
};

/**
 * Selects from the database and returns a Q.Promise to return the results.
 *
 * @param {number} [offset=0] The offset to request from within the result set
 * @param {number} [limit=0]  The maximum number of records to request from within the result set
 *
 * @returns Q.Promise         A promise to return the results
 *
 * @example
 * // res.json sends a JSON string containing the uploads according to the parameters passed
 * select().then(function(uploads) {
 *   res.json(uploads);
 * });
 */
function select(offset, limit) {
  let query = squel.select()
    .from(this.tName)
    .offset(_().coalesce(offset, this.DEFAULT_OFFSET))
    .limit(_().coalesce(limit, this.DEFAULT_LIMIT))
    /*
    .offset(_(offset, 0).coalesce(offset, 0))
    .limit(_(limit, 10).coalesce(limit, 10))
    */
    .toString();

  return Mysqlc.rawQueryPromise(query);
}

/**
 * Selects the count from the given table and returns a Q.Promise to return the count.
 *
 * @returns Q.Promise         A promise to return the count
 *
 * @example
 * // res.json sends a JSON string containing the uploads according to the parameters passed
 * count().then(function(uploads) {
 *   res.json({
 *    count: uploads[0].count
 *   });
 * });
 */
function count() {
  let query = squel.select()
    .field("COUNT(*)", "count")
    .from(this.tName)
    .toString();

  return Mysqlc.rawQueryPromise(query);
}

/**
 * Sets up the create statements and migrate statements for each model.
 *
 * In order for this function to work, each model much specify an array of finalCreates (queries that can
 * build the model from scratch in the database) and migrates (queries that can upgrade the model from any
 * previous version).
 *
 * For an application example, see ./models/LedgerEntries.js
 *
 *  @example
 *  // Provide queries to initially create the database.
 *  module.exports.initialCreates = [ `
 *    CREATE TABLE Car (
 *      id BIGINT UNSIGNED AUTO_INCREMENT,
 *      color VARCHAR(255)
 *    );
 *  ` ];
 *
 *  // Map the initialCreates to a migrates query.  Add each subsequent modification (ALTER TABLE) to future
 *  // sortFloatIndex values, while making sure not to step on the toes of other sortFloatIndices.
 *  module.exports.migrates = [
 *    {
 *      sortFloatIndex: 0,
 *      query: module.exports.initialCreates[0]
 *    }
 *  ];
 *
 *  // Clone initialCreates initially.  After alter tables, this array should always contain the latest
 *  // queries to build the database from scratch.
 *  module.exports.finalCreates = module.exports.initialCreates.slice();
 */
function setupQueries() {
  this.finalCreates.forEach(function(create) {
    upgrade.addCreate(create);
  });

  this.migrates.forEach(function(migrate) {
    upgrade.addMigrate(migrate.sortFloatIndex, migrate.query);
  });
}
