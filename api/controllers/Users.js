"use strict";

var Users             = require("../../models/Users");
var Log               = require("node-android-logging");
var Q                 = require("q");

module.exports = {
  get: get
};

/**
 * get retrieves the Users from the database and returns them via the response.
 */
function get(request, response) {
  Users.select(request.query.offset, request.query.limit).then(function(users) {
    return Users.count().then(function(count) {
      return new Q.Promise(function(resolve) {
        response.json({
          "length": users.length,
          "results": users,
          "count": count[0].count
        });

        resolve();
      });
    });
  }).catch(function(rejection) {
    Log.E(rejection);

    response.status(500).json({
      "result": "ERROR",
      "message": "Unable to retrieve users"
    });
  });
}

