/**
 * @module AccountsController
 */

"use strict";

var Accounts          = require("../../models/Accounts");
var Log               = require("node-android-logging");
var Q                 = require("q");

module.exports = {
  get: get,
  post: post
};

/**
 * Retrieves the Accounts from the database and returns them via the response.
 */
function get(request, response) {
  Accounts.select(request.query.offset, request.query.limit).then(function(accounts) {
    return Accounts.count().then(function(count) {
      return new Q.Promise(function(resolve) {
        response.json({
          "length": accounts.length,
          "results": accounts,
          "count": count[0].count
        });

        resolve();
      });
    });
  }).catch(function(rejection) {
    Log.E(rejection);

    response.status(500).json({
      "result": "ERROR",
      "message": "Unable to retrieve accounts"
    });
  });
}

function post(request, response) {
  Log.I(request.body);

  Accounts.post(request).then(function(result) {
    response.status(200).json({
      "result": "OK",
      "results": result
    });
  }).catch(function(rejection) {
    Log.E(rejection);

    response.status(500).json({
      "result": "ERROR",
      "message": "Unable to post request"
    });
  });
}

