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

function connect() {
  let mysqlc = mysql.createConnection({
    password: db.password,
    host:     db.host,
    user:     db.user,
    database: db.name,
    debug:    db.debug
  });

  mysqlc.connect(function(err) {
    if (err) {
      Log.E(err);
      setTimeout(connect, 2000);
    }
  });

  mysqlc.on("error", function(err) {
    Log.E(err);

    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      Log.W("Lost connection, trying to reconnect.");

      connect();
    } else {
      throw err;
    }
  });

  exports.mysqlc = mysqlc;
}

connect();

module.exports.rawQueryPromise = function(statement) {
  let lType = typeof statement;
  if (lType !== "string") {
    let errorMessage = "Try passing a string instead of a[n] " + lType;

    return new Q.Promise(function(resolve, reject) {
      reject(errorMessage);
    });
  }

  Log.T("\n----" + statement + "\n");

  return new Q.Promise(function(resolve, reject) {
    require("./mysqlc").mysqlc.query(statement, function(err, rows, fields) {
      if (err) {
        reject({
          "err": err,
          "errstack": err.stack,
          "rows": rows,
          "fields": fields,
          "statement": statement
        });
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

