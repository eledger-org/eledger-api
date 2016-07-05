/**
 * @module Mysqlc
 *
 * @description
 * Mysqlc provides an interface for connecting to a mysql database and generating Q.Promises from mysql
 * queries.
 */


"use strict";

var config            = require("config");
var Log               = require("node-android-logging");
var mysql             = require("mysql");
var Q                 = require("q");

let db = {
  "password": {
    key: "db.password",
    def: ""
  },
  "host": {
    key: "db.host",
    def: "localhost"
  },
  "user": {
    key: "db.user",
    def: "eledger"
  },
  "name": {
    key: "db.name",
    def: "eledger"
  },
  "debug": {
    key: "db.debug",
    def: false
  },
  "development": {
    key: "development",
    def: false
  }
};

for (let prop in db) {
  if (config.has(db[prop].key)) {
    db[prop] = config.get(db[prop].key);
  } else {
    db[prop] = db[prop].def;
  }
}

if (db.development === "development" || process.env.NODE_ENV === "development") {
  Log.I(config);
} else {
  Log.I("Launching eledger as " + process.env.NODE_ENV);
}

module.exports.connect = function() {
  let Mysqlc = mysql.createConnection({
    password: db.password,
    host:     db.host,
    user:     db.user,
    database: db.name,
    debug:    db.debug,
    supportBigNumbers: true,
    multipleStatements: true
  });

  Mysqlc.connect(function(err) {
    if (err) {
      Log.E(err);
      setTimeout(require("./Mysqlc").connect, 2000);
    }
  });

  Mysqlc.on("error", function(err) {
    Log.E(err);

    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      Log.W("Lost connection, trying to reconnect.");

      require("./Mysqlc").connect();
    } else {
      throw err;
    }
  });

  exports.Mysqlc = Mysqlc;
};

module.exports.rawQueryPromise = function(statement) {
  let lType = typeof statement;
  let queryString = statement;
  let values = undefined;

  if (lType !== "string") {
    if (statement !== undefined &&
        statement.text !== undefined &&
        statement.values !== undefined) {
      values = statement.values;
      queryString = statement.text;
    } else {
      let errorMessage = "Try passing a string instead of a[n] " + lType;

      throw new TypeError(errorMessage);
    }
  }

  Log.T(statement);

  return new Q.Promise(function(resolve, reject) {
    require("./Mysqlc").Mysqlc.query(queryString, values, function(err, rows, fields) {
      if (err) {
        Log.E({
          "err": err,
          "errstack": err.stack,
          "rows": rows,
          "fields": fields,
          "statement": statement
        });

        reject(err);
      } else {
        let message = "Query success.";

        if (rows.length !== undefined) {
          message += "  Row count: " + rows.length;
        }

        Log.T(message);

        resolve(rows);
      }
    });
  });
};

