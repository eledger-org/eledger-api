"use strict";

/* eslint-env mocha */

var _                 = require("underscore");
var fs                = require("fs");
var Log               = require("node-android-logging");
var path              = require("path");

Log.setDefaults();
Log.disableStderr();

var testPath = path.join(process.cwd(), "test");

_.each(fs.readdirSync(testPath), function(partialPath) {
  let fullPath = path.join(testPath, partialPath);

  if (fs.statSync(fullPath).isDirectory()) {
    fullPath = path.join(fullPath, "index.js");

    try {
      if (fs.statSync(fullPath).isFile()) {
        describe(partialPath, function() {
          require(fullPath);
        });
      }
    } catch(ex) {
      Log.enableStderr("Trace");
      Log.T(ex);
      Log.disableStderr();
      // Ignore this.  Just means that index.js doesn't exist.
    }
  } else if (fs.statSync(fullPath).isFile()) {
    if (!fullPath.endsWith("index.js")) {
      require(fullPath);
    }
  } else {
    Log.I("Not sure what type of file this is: " + partialPath);
  }
});

