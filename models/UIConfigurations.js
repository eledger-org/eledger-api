/**
 * @module  UIConfigurations
 * @extends DefaultModelActions
 */

"use strict";

var _                 = require("underscore");
var defaultModel      = require("./DefaultModelActions");
var date              = require("../util/date");
var Log               = require("node-android-logging");
var Mysqlc            = require("../Mysqlc");
var Q                 = require("q");
var squel             = require("squel").useFlavour("mysql");

for (var prop in defaultModel) {
  module.exports[prop] = defaultModel[prop];
}

module.exports.tName = "UIConfigurations";

module.exports.finalizeModel = function() {
  var UIConfigurations = require("./UIConfigurations");

  let defaultComplexReceiptMetadataFile = "./data/UIConfigurations.ComplexReceiptMetadata.json";

  let defaultComplexReceiptMetadata = require(defaultComplexReceiptMetadataFile);

  let query = squel.insert()
    .into(UIConfigurations.tName)
    .set("type", defaultComplexReceiptMetadata.type)
    .set("name", defaultComplexReceiptMetadata.name)
    .set("uiConfiguration", JSON.stringify(defaultComplexReceiptMetadata.uiFields))
    .set("shared", 1)
    .set("createdBy", 0)
    .set("createdDate", date.now())
    .onDupUpdate("uiConfiguration", JSON.stringify(defaultComplexReceiptMetadata.uiFields))
    .onDupUpdate("modifiedBy", 0)
    .onDupUpdate("modifiedDate", date.now())
    .toParam();

  return Mysqlc.rawQueryPromise(query);
};

/************************************************************************************************************
 * Initial Create Statements.
 ***********************************************************************************************************/
module.exports.initialCreates = [ `
CREATE TABLE UIConfigurations (
  id                    BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  type                  VARCHAR(255)      NOT NULL,
  name                  VARCHAR(255)      NOT NULL,
  uiConfiguration       VARCHAR(32768)    NOT NULL,
  shared                INT UNSIGNED      DEFAULT 0,
  createdDate           BIGINT UNSIGNED   DEFAULT NULL,
  createdBy             BIGINT UNSIGNED   DEFAULT NULL,
  modifiedDate          BIGINT UNSIGNED   DEFAULT NULL,
  modifiedBy            BIGINT UNSIGNED   DEFAULT NULL,
  deletedDate           BIGINT UNSIGNED   DEFAULT NULL,
  deletedBy             BIGINT UNSIGNED   DEFAULT NULL,
  UNIQUE KEY uiconfigurations_uniqueness (type, name, createdBy),
  PRIMARY KEY (id)
  );
` ];

/************************************************************************************************************
 * Migrate Statements.
 ***********************************************************************************************************/
module.exports.migrates = [
  {
    sortFloatIndex: 22,
    query: module.exports.initialCreates[0]
  }
];

/************************************************************************************************************
 * Final Create Statements.
 ***********************************************************************************************************/
module.exports.finalCreates = [
  module.exports.initialCreates[0]
];

