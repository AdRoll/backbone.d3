/* @echo BANNER */


(function() {

"use strict";

// Save a reference to the global object
var root = this;

// Dependencies
var _           = root._,
    Backbone    = root.Backbone,
    d3          = root.d3;

// The top-level namespace
var D3 = root.D3 = Backbone.D3 = {};

// Current version of the library
D3.VERSION = '/* @echo VERSION */';

// @include helpers.js
// @include charts/chart.js
// @include charts/bar.js
// @include charts/line.js
// @include charts/timeSeries.js
// @include charts/countryMap.js

}).call(this);
