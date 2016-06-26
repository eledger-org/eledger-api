"use strict";

var defaultModel      = require("./DefaultModelActions");

for (var prop in defaultModel) {
  module.exports[prop] = defaultModel[prop];
}

module.exports.tName = "DatabaseVersion";

/************************************************************************************************************
 * Initial Create Statements.
 ***********************************************************************************************************/
module.exports.initialCreates = [ `
CREATE TABLE DatabaseVersion (
  databaseVersion       BIGINT UNSIGNED   NOT NULL
);
`,
`
INSERT INTO DatabaseVersion (databaseVersion) VALUES (0.5 * 1000);
` ];

/************************************************************************************************************
 * Migrate Statements.
 ***********************************************************************************************************/
module.exports.migrates = [
  {
    sortFloatIndex: 0,
    query: module.exports.initialCreates[0]
  },
  {
    sortFloatIndex: 0.5,
    query: module.exports.initialCreates[1]
  }
];

/************************************************************************************************************
 * Final Create Statements.
 ***********************************************************************************************************/
module.exports.finalCreates = module.exports.initialCreates.slice();

