// Mackerel.js 0.1.0
//
// Copyright (c) 2013 AdRoll
// MIT license
// http://github.com/AdRoll/Mackerel

(function() {

"use strict";

// Save a reference to the global object
var root = this;

// The top-level namespace
var Mackerel = root.Mackerel = {};

// Current version of the library
Mackerel.VERSION = '0.1.0';

// Dependencies
var _           = root._,
    Backbone    = root.Backbone,
    d3          = root.d3;


// Global defaults for charts
Mackerel.chartDefaults = {
    joinAttr: null,
    xAttr: 'x',
    yAttr: 'y',
    margin: {
        top: 10,
        right: 10,
        bottom: 30,
        left: 45
    }
};


// Base view for all charts
var Chart = Mackerel.Chart = Backbone.View.extend({

    className: 'mackerel',

    initialize: function() {
        _.bindAll(this, 'joinData');

        // Include default options
        _.defaults(
            this.options,               // Options for this instance
            _.result(this, 'defaults'), // Class level defaults
            Mackerel.chartDefaults      // Library level defaults
        );

        Backbone.View.prototype.initialize.apply(this, arguments);
    },

    // Renders the chart in a new SVG element with margins
    // Overriding this method is usually not necessary since it calls other
    // methods to render different parts of the chart
    render: function() {
        this.$el.empty();

        // D3 margin convention
        // http://bl.ocks.org/mbostock/3019563
        var margin = this.options.margin;
        this.width = this.$el.width() - margin.left - margin.right;
        this.height = this.$el.height() - margin.top - margin.bottom;
        this.svg = d3.select(this.el).append('svg')
            .attr('width', this.width + margin.left + margin.right)
            .attr('height', this.height + margin.top + margin.bottom)
            .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // Render chart
        if (this.collection instanceof Backbone.Collection) {
            this.scales = {
                x: this.getXScale(),
                y: this.getYScale()
            };
            this.renderAxes();
            this.renderData();
        }

        return this;
    },

    // Maps this.collection to a dataset that can be passed to D3
    getData: function() {
        return this.collection.map(this.getDatum, this);
    },

    // Maps an individual model to a datum in D3
    getDatum: function(model) {
        return _.extend(model.toJSON(), {
            x: model.get(this.options.xAttr),
            y: model.get(this.options.yAttr)
        });
    },

    // Control how data is joined to elements with the joinAttr option
    // Override this method to get more fine-grained control of the join
    // https://github.com/mbostock/d3/wiki/Selections#wiki-data
    joinData: function(d, i) {
        var joinAttr = this.options.joinAttr;
        if (joinAttr && _(d).has(joinAttr)) {
            return d[joinAttr];
        } else {
            return i;
        }
    },

    // Override these to implement different charts
    getXScale: function() {},
    getYScale: function() {},
    renderAxes: function() {},
    renderData: function() {}

});


// Basic bar chart
var Bar = Mackerel.Bar = Chart.extend({

    className: Chart.prototype.className + ' mackerel-bar',

    defaults: {
        barPadding: 0.2
    },

    renderAxes: function() {
        // X axis
        var xAxis = d3.svg.axis()
            .scale(this.scales.x)
            .orient('bottom');

        this.svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + this.height + ')')
            .call(xAxis);

        // Y axis
        var yAxis = d3.svg.axis()
            .scale(this.scales.y)
            .orient('left')
            .ticks(Math.ceil(this.height / 40))
            .tickSize(-this.width)
            .tickPadding(6);

        this.svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis);
    },

    renderData: function() {
        var chart = this,
            x = this.scales.x,
            y = this.scales.y;

        var bars = this.svg.selectAll('.bar')
            .data(this.getData(), this.joinData)
            .enter().append('rect')
                .attr('class', 'bar')
                .attr('width', x.rangeBand())
                .attr('height', function(d) { return chart.height - y(d.y); })
                .attr('transform', function(d) {
                    return 'translate(' + x(d.x) + ',' + y(d.y) + ')';
                });
    },

    getXScale: function() {
        return d3.scale.ordinal()
            .rangeRoundBands([0, this.width], this.options.barPadding)
            .domain(this.collection.pluck(this.options.xAttr));
    },

    getYScale: function() {
        return d3.scale.linear()
            .rangeRound([this.height, 0])
            .domain([ 0, _.max(this.collection.pluck(this.options.yAttr)) ])
            .nice();
    }

});


}).call(this);
