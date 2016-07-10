/**
 * @module  Accounts
 * @extends DefaultModelActions
 */

"use strict";

var _                 = require("underscore");
var defaultModel      = require("./DefaultModelActions");
var Log               = require("node-android-logging");
var Mysqlc            = require("../Mysqlc");
var Q                 = require("q");
var squel             = require("squel");

for (var prop in defaultModel) {
  module.exports[prop] = defaultModel[prop];
}

module.exports.tName = "Accounts";
module.exports.DEFAULT_LIMIT = 1000;

module.exports.finalizeModel = function() {
  var Accounts = require("./Accounts");
  var Mysqlc   = require("../Mysqlc");

  Accounts.count().then(function(result) {
    if (result[0].count === 0) {
      let defaultAccountsFile = "./data/Accounts.json";

      let defaultAccounts = require(defaultAccountsFile);

      return Accounts.buildAccounts(defaultAccounts).then(function() {
        Log.I("Successfully built accounts");
      });
    } else {
      return new Q.Promise(function(resolve) {
        resolve();
      });
    }
  }).then(function() {
    return Q.all(_.map(storedProcs, function(storedProc) {
      return Mysqlc.rawQueryPromise(storedProc);
    }));
  }).catch(function(rejection) {
    setTimeout(function() {
      if (rejection !== undefined && rejection.stack !== undefined) {
        throw rejection;
      } else {
        Log.E(rejection);

        throw new Error(rejection);
      }
    }, 0);
  });
};

/**
 * @description
 * Recursively iterates over the accounts in the account object in order to add each new account to the
 * database with all of its children.  See ./models/data/Accounts.json for an example json document.
 */
module.exports.buildAccounts = function(account, parentId) {
  var Accounts = require("./Accounts");
  var Mysqlc   = require("../Mysqlc");

  /** Initial case, first element should not have a defined account name **/
  if (account.name === undefined) {
    if (account.accounts !== undefined && account.accounts.length > 0) {
      return Q.all(_.map(account.accounts, function(childAccount) {
        return Accounts.buildAccounts(childAccount, null);
      }));
    }
  /** Recursion case, first element should have a defined account name **/
  } else {
    let query = squel.insert()
      .into(Accounts.tName)
      .set("parentAccount", parentId)
      .set("accountName", account.name)
      .set("accountShortName", account.short)
      .set("createdDate", (new Date()).getTime() / 1000)
      .set("createdBy", 0)
      .toParam();

    return Mysqlc.rawQueryPromise(query).then(function(result) {
      if (account.accounts !== undefined && account.accounts.length > 0) {
        return Q.all(_.map(account.accounts, function(childAccount) {
          return Accounts.buildAccounts(childAccount, result.insertId);
        }));
      } else {
        return;
      }
    });
  }
};

module.exports.select = function(offset, limit) {
  var Accounts = require("./Accounts");

  let query = squel.select().from(Accounts.tName)
    .field("id")
    .field("parentAccount")
    .field("accountsStyleConfig")
    .field("accountName")
    .field("getLongAccountString(id)", "fullLongAccountName")
    .field("accountShortName")
    .field("getAccountString(id)", "fullShortAccountName")
    .field("createdDate")
    .field("createdBy")
    .field("modifiedDate")
    .field("modifiedBy")
    .field("deletedDate")
    .field("deletedBy")
    .offset(_().coalesce(offset, this.DEFAULT_OFFSET))
    .limit(_().coalesce(limit, this.DEFAULT_LIMIT))
    .order("fullLongAccountName")
    .toParam();

  return Mysqlc.rawQueryPromise(query);
};

var storedProcs = [ `
DROP FUNCTION IF EXISTS getAccountString;

CREATE FUNCTION getAccountString(accountInput BIGINT UNSIGNED)
  RETURNS TEXT DETERMINISTIC
  BEGIN
    IF accountInput IS NULL THEN
      return accountInput;
    END IF;

    SELECT parentAccount, accountShortName
    INTO @pAccount, @accountString
    FROM Accounts
    WHERE Accounts.id = accountInput;

    WHILE @pAccount IS NOT NULL DO
      SELECT parentAccount, accountShortName
      INTO @pAccount, @parentShort
      FROM Accounts
      WHERE Accounts.id = @pAccount;

      SELECT CONCAT(@parentShort, "|", @accountString)
      INTO @accountString;
    END WHILE;

    return @accountString;
  END;
`, `
DROP FUNCTION IF EXISTS getLongAccountString;

CREATE FUNCTION getLongAccountString(accountInput BIGINT UNSIGNED)
  RETURNS TEXT DETERMINISTIC
  BEGIN
    IF accountInput IS NULL THEN
      return accountInput;
    END IF;

    SELECT parentAccount, accountName
    INTO @pAccount, @accountString
    FROM Accounts
    WHERE Accounts.id = accountInput;

    WHILE @pAccount IS NOT NULL DO
      SELECT parentAccount, accountName
      INTO @pAccount, @parentName
      FROM Accounts
      WHERE Accounts.id = @pAccount;

      SELECT CONCAT(@parentName, "|", @accountString)
      INTO @accountString;
    END WHILE;

    return @accountString;
  END;
` ];


/************************************************************************************************************
 * Initial Create Statements.
 ***********************************************************************************************************/
module.exports.initialCreates = [ `
CREATE TABLE Accounts (
  id                    BIGINT UNSIGNED   AUTO_INCREMENT,
  parentAccount         BIGINT UNSIGNED   DEFAULT NULL,
  accountsStyleConfig   BIGINT UNSIGNED   DEFAULT 0,
  accountShortName      VARCHAR(255)      DEFAULT NULL,
  accountName           VARCHAR(255)      NOT NULL,
  createdDate           BIGINT UNSIGNED   NOT NULL,
  createdBy             BIGINT UNSIGNED   NOT NULL,
  modifiedDate          BIGINT UNSIGNED   DEFAULT NULL,
  modifiedBy            BIGINT UNSIGNED   DEFAULT NULL,
  deletedDate           BIGINT UNSIGNED   DEFAULT NULL,
  deletedBy             BIGINT UNSIGNED   DEFAULT NULL,
  PRIMARY KEY (id)
  );
` ];



/************************************************************************************************************
 * Migrate Statements.
 ***********************************************************************************************************/
module.exports.migrates = [
  {
    sortFloatIndex: 13,
    query: module.exports.initialCreates[0]
  }
];

/************************************************************************************************************
 * Final Create Statements.
 ***********************************************************************************************************/
module.exports.finalCreates = module.exports.initialCreates.slice();

