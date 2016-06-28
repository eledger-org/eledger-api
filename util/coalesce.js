"use strict";

var _                 = require("underscore");
var Log               = require("node-android-logging");

_.mixin({
  coalesce: function() {
    for (let i = 0; i < arguments.length; ++i) {
      let arg = arguments[i];
      Log.I("arg[i=" + i + "]=" + arg);

      if ((!_.isNaN(arg)) && (!_.isNull(arg)) && (!_.isUndefined(arg))) {
        return arguments[i];
      }
    }
  }
});

