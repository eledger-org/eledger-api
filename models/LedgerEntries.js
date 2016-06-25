"use strict";

var _                 = require("underscore");
var mysqlc            = require("../mysqlc");
var squel             = require("squel");

const tName           = "LedgerEntries";

module.exports = {
  selLedgerEntries: selLedgerEntries,
  count: count
};

/**
 * Requests the database version from the database and returns a Q.Promise to return it.
 *
 * @param {number} [offset=0] The offset to request from within the result set
 * @param {number} [limit=0]  The maximum number of records to request from within the result set
 *
 * @returns Q.Promise         A promise to return the database version
 *
 * @example
 * // res.json sends a JSON string containing the ledger entries according to the parameters passed
 * selLedgerEntries().then(function(ledgerEntries) {
 *   res.json(ledgerEntries);
 * });
 */
function selLedgerEntries(offset, limit) {
  let query = squel.select()
    .from(tName)
    .offset(_(offset, 0).coalesce(offset, 0))
    .limit(_(limit, 10).coalesce(limit, 10))
    .toString();

  return mysqlc.rawQueryPromise(query);
}


function count() {
  let query = squel.select()
    .field("COUNT(*)", "count")
    .from(tName)
    .toString();

  return mysqlc.rawQueryPromise(query);
}

