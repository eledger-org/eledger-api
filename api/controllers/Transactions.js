/**
 * @module TransactionsController
 */

"use strict";

var Log               = require("node-android-logging");
var Mysqlc            = require("../../Mysqlc");
var Q                 = require("q");
var squel             = require("squel");
var Transactions      = require("../../models/Transactions");

module.exports = {
  get: get,
  getRequestedSuggestions: getRequestedSuggestions
};

function get(request, response) {
  response.status(500).json({
    result: "ERROR",
    message: "Not yet implemented"
  });
}

function getRequestedSuggestions(request, response) {
  let requestedSuggestions = JSON.parse(request.swagger.params.requestedSuggestions.value);

  let queries = requestedSuggestions.map(function(rq) {
    return squel.select()
      .field(rq.name)
      .field("COUNT(*)", rq.name + "Count")
      .from(Transactions.tName)
      .where("?? IS NOT NULL", rq.name)
      .group(rq.name)
      .order(rq.name + "Count", false)
      .limit(rq.count || 10)
      .toParam();
  }).reduce(function(pre, cur) {
    /* Sadly, squel doesn't handle ?? as a column name replacement correctly, so
     * we have to use this hack to carve the null values out of the arrays
     */
    if (pre.values[1] == null) {
      pre.values = pre.values.slice(0, 1);
    }

    return {
      text: pre.text + ";\n" + cur.text,
      values: pre.values.concat(cur.values[0])
    };
  });

  queries.text += ";\n";

  Log.I(queries);

  Mysqlc.rawQueryPromise(queries).then(function(resultSets) {
    let results = {};

    resultSets.forEach(function(resultSet) {
      results[queries.values.shift()] = resultSet;
    });

    response.status(200).json(results);
  }).catch(function(rejection) {
    Log.E(rejection);

    response.status(500).json({
      result: "ERROR",
      message: "An error occurred"
    });
  });

  /*
  Transactions.select(request.query.offset, request.query.limit).then(function(transactions) {
    return Transactions.count().then(function(count) {
      return new Q.Promise(function(resolve) {
        response.json({
          "length": transactions.length,
          "results": transactions,
          "count": count[0].count
        });

        resolve();
      });
    });
  }).catch(function(rejection) {
    Log.E(rejection);

    response.status(500).json({
      "result": "ERROR",
      "message": "Unable to retrieve ledger entries"
    });
  });
  */
}

