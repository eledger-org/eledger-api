/**
 * @module DbUpgrade
 *
 * @description
 * DbUpgrade provides an interface for adding create and migrate statements and upgrading an existing
 * database with the migration steps required to bring it current.
 *
 * The create statements can be used to generate the database from scratch.
 */

"use strict";

var _                 = require("underscore");
var Log               = require("node-android-logging");
var Mysqlc            = require("./Mysqlc");
var Q                 = require("q");
var squel             = require("squel");

/**
 * addCreate builds the list of create statements necessary to create the database from scratch
 *
 * This is unordered because I'm not using foreign keys, so the order of creation doesn't matter.
 *
 * Foreign key constraints must be handled by the software instead.
 *
 * @param {String} query      The query string for initially creating the model for a brand new database
 */
function addCreate(query) {
  if (this.create === undefined) {
    this.create = Array();
  }

  this.create.push({
    query: query
  });
}

/**
 * addMigrate builds the list of migration statements necessary to upgrade a database from any version to
 * the latest
 *
 * @param {Number} sortFloatIndex
 *                            The sortFloatIndex in the ordered list to execute this migration statement.
 *                            Filling in this value requires the developer to manually search through all
 *                            of the models ({APP_ROOT}/models/*) in order to locate the highest
 *                            sortFloatIndex used so far.  The new call to this function should be one
 *                            higher.  This can be a decimal, so that you can insert between items if need
 *                            be, but not more granular than 0.001 (I am multiplying by 1000 and storing
 *                            in a BIGINT UNSIGNED field.
 * @param {String} query      The query string for initially creating the model for a brand new database
 */
function addMigrate(sortFloatIndex, query) {
  if (this.migrate === undefined) {
    this.migrate = Array();
  }

  // If there's an existing migrate statement with the same sortFloatIndex
  let migratesFiltered = _.filter(this.migrate, function(migrateItem) {
    return migrateItem.sortFloatIndex === sortFloatIndex;
  });

  if (migratesFiltered.length > 0) {
    Log.E("Existing migrate statement: ");
    Log.E(migratesFiltered);
    Log.E("New query with the same index: ");
    Log.E(query);

    throw new Error("Each call to this function must use a unique sortFloatIndex parameter");
  } else {
    this.migrate.push({
      sortFloatIndex: sortFloatIndex,
      query: query
    });
  }
}

function upgrade() {
  let model = this;

  let query = "SHOW TABLES";

  /* List all of the available tables.  We're looking for 0 or not 0 total to determine whether
   * we create the database from scratch or migrate the database using our migrate statements.
   *
   * The end of this promise block will be to resolve with an array of queries to execute.
   */
  return Mysqlc.rawQueryPromise(query).then(function(result) {
    Log.I(result);

    if (result.length > 0) {
      let query = squel.select()
        .from("DatabaseVersion")
        .toParam();

      Log.I(query);

      return Mysqlc.rawQueryPromise(query).then(function(result) {
        return new Q.Promise(function(resolve) {
          Log.I(result);
          let dbVersion = parseInt(result[0].databaseVersion) / 1000;
          let queries = _.filter(model.migrate, function(migrateItem) {
            return dbVersion < migrateItem.sortFloatIndex;
          });

          resolve(queries.sort(function(lhs, rhs) {
            if (lhs.sortFloatIndex < rhs.sortFloatIndex) {
              return -1;
            } else if (lhs.sortFloatIndex > rhs.sortFloatIndex) {
              return 1;
            } else {
              throw new Error("Invalid sortFloatIndices, somehow two match.");
            }
          }));
        });
      });
    } else {
      return new Q.Promise(function(resolve) {
        resolve(model.create);
      });
    }

  /* Now that we have the list of queries that we want to execute, we'll run them all in separate
   * promises. (Q.all does this for us)
   */
  }).then(function(queries) {
    Log.I("Detected " + queries.length + " queries to run to bring the database to current.");

    return Q.all(_.map(queries, function(queryItem) {
      Log.I(queryItem);
      return Mysqlc.rawQueryPromise(queryItem.query);
    }));

  /* Let's print out the highest migrate sortFloatIndex so that the next developer can easily
   * select a new index to use for the new model or database migration step.
   */
  }).then(function() {
    return Q.Promise(function(resolve) {
      let maxSortFloatIndex = _.max(model.migrate, function(migrateItem) {
        return migrateItem.sortFloatIndex;
      }).sortFloatIndex;

      Log.I("Highest migrate sortFloatIndex: " + maxSortFloatIndex);

      resolve(maxSortFloatIndex);
    });

  /* Lastly, let's update the database version now that we've successfully committed our changes
   * to the database.
   */
  }).then(function(maxSortFloatIndex) {
    let query = squel.update()
      .table("DatabaseVersion")
      .set("databaseVersion", maxSortFloatIndex * 1000)
      .toParam();

    return Mysqlc.rawQueryPromise(query);
  });
}

function validateModel(model) {
  let reason;
  if (model.finalCreates.length === 0) {
    reason = model.tName + ".finalCreates length is 0";
  } else if (model.migrates.length === 0) {
    reason = model.tName + ".migrates length is 0";
  } else {
    module.exports.validatedModels.push(model);

    return;
  }

  Log.E(model);

  throw new TypeError("Invalid model (" + reason + ")");
}

function initializeModels() {
  let DbUpgrade = require("./DbUpgrade");
  let models = Array();

  models.push("./models/Accounts");
  models.push("./models/DatabaseVersion");
  models.push("./models/LedgerEntries");
  models.push("./models/SimpleTransactionsGlue");
  models.push("./models/UploadReadings");
  models.push("./models/Uploads");
  models.push("./models/Users");

  models.forEach(function(modelFilePath) {
    let model = require(modelFilePath);

    DbUpgrade.models.push(model);
  });
}

function setupQueries() {
  let DbUpgrade = require("./DbUpgrade");

  DbUpgrade.models.forEach(function(model) {
    validateModel(model);
    model.setupQueries();
  });
}

function finalizeModels() {
  let DbUpgrade = require("./DbUpgrade");

  DbUpgrade.validatedModels.forEach(function(model) {
    if (model.finalizeModel !== undefined) {
      model.finalizeModel();
    }
  });
}

module.exports.addCreate              = addCreate;
module.exports.addMigrate             = addMigrate;
module.exports.upgrade                = upgrade;
module.exports.initializeModels       = initializeModels;
module.exports.setupQueries           = setupQueries;
module.exports.finalizeModels         = finalizeModels;
module.exports.models                 = Array();
module.exports.validatedModels        = Array();

