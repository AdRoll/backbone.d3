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


// Helpers
// -------

// Round number to N significant figures and show with SI prefix
var prettyNumber = function(num, options) {
    if (num === 0) return "0";
    if (_.isNaN(num)) return "NaN";

    // Set default options
    var opts = _.extend({
        sigFigs: 3
    }, options);

    // http://blog.magnetiq.com/post/497605344/rounding-to-a-certain-significant-figures-in-javascript
    var mult = Math.pow(10, opts.sigFigs - Math.floor(Math.log(num) / Math.LN10) - 1),
        rounded = Math.round(num * mult) / mult;
    return d3.format("s")(rounded);
};


// Global defaults for charts
Mackerel.chartDefaults = {
    joinAttr: null,

    xAttr: 'x',
    xFormat: prettyNumber,
    xValid: _.isFinite,

    yAttr: 'y',
    yFormat: prettyNumber,
    yValid: _.isFinite,

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
        var margin = this.options.margin,
            width = this.options.width || this.$el.width(),
            height = this.options.height || this.$el.height();

        this.width = width - margin.left - margin.right;
        this.height = height - margin.top - margin.bottom;
        this.svg = d3.select(this.el).append('svg')
            .attr('width', width)
            .attr('height', height)
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
        return this.collection.chain()
            .filter(this.isValidDatum, this)
            .map(this.getDatum, this)
            .value();
    },

    // Maps an individual (valid) model to a datum in D3
    getDatum: function(model) {
        return _.extend(model.toJSON(), {
            x: model.get(this.options.xAttr),
            y: model.get(this.options.yAttr)
        });
    },

    // Determines if a datum or model is valid
    isValidDatum: function(d) {
        var opts = this.options;
        if (d instanceof Backbone.Model) {
            d = d.toJSON();
        }
        return opts.xValid(d[opts.xAttr]) && opts.yValid(d[opts.yAttr]);
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

    // Get the minimum or maximum value over the whole data for linear scales
    getLinearExtent: function(data, attr, minmax) {
        // Return either one extreme or whole extent
        if (minmax) {
            return _(data).chain().pluck(attr)[minmax]().value();
        } else {
            return [
                this.getLinearExtent(data, attr, 'min'),
                this.getLinearExtent(data, attr, 'max')
            ];
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
        xFormat: _.identity,
        xValid: Boolean,
        barPadding: 0.2
    },

    renderAxes: function() {
        // X axis
        var xAxis = d3.svg.axis()
            .scale(this.scales.x)
            .orient('bottom')
            .tickFormat(this.options.xFormat);

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
            .tickFormat(this.options.yFormat)
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
        var data = this.getData();
        return d3.scale.ordinal()
            .rangeRoundBands([0, this.width], this.options.barPadding)
            .domain(_.pluck(data, this.options.xAttr));
    },

    getYScale: function() {
        var data = this.getData();
        return d3.scale.linear()
            .rangeRound([this.height, 0])
            .domain([
                0,
                this.getLinearExtent(data, this.options.yAttr, 'max')
            ])
            .nice();
    }

});


// Multi line chart
var Line = Mackerel.Line = Chart.extend({

    className: Chart.prototype.className + ' mackerel-line',

    defaults: {
        valuesAttr: 'values',               // Values list on each series
        colorAttr: 'color',                 // Color attribute on each series
        interpolate: 'monotone',            // Line interpolation method
        colorScale: d3.scale.category10()   // Default color scale for lines
    },

    getData: function() {
        // Perform data validation on per-series level
        return this.collection.map(this.getDatum, this);
    },

    // Parse an individual series of data
    getDatum: function(model, i) {
        var opts = this.options,
            series = model.toJSON();

        // Make sure each series has a color
        series[opts.colorAttr] = series[opts.colorAttr] || opts.colorScale(i);

        // Filter invalid values
        series[opts.valuesAttr] = _.filter(series[opts.valuesAttr], this.isValidDatum, this);

        return series;
    },

    renderAxes: function() {
        // X axis
        var xAxis = d3.svg.axis()
            .scale(this.scales.x)
            .orient('bottom')
            .ticks(Math.ceil(this.width / 150))
            .tickFormat(this.options.xFormat)
            .tickPadding(5);

        this.svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + this.height + ')')
            .call(xAxis);

        // Y axis
        var yAxis = d3.svg.axis()
            .scale(this.scales.y)
            .orient('left')
            .ticks(Math.ceil(this.height / 40))
            .tickFormat(this.options.yFormat)
            .tickSize(-this.width)
            .tickPadding(10);

        this.svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis);
    },

    renderData: function(data) {
        var x = this.scales.x,
            y = this.scales.y,
            opts = this.options;

        // Lines
        var line = d3.svg.line()
            .interpolate(opts.interpolate)
            .defined(function(d) { return d && opts.yValid(d[opts.yAttr]); })
            .x(function(d) { return x(d[opts.xAttr]); })
            .y(function(d) { return y(d[opts.yAttr]); });

        var series = this.svg.selectAll('.series')
            .data(this.getData(), this.joinData)
            .enter().append('g')
                .attr('class', 'series');

        series.append('path')
            .attr('class', 'line')
            .attr('d', function(series) { return line(series[opts.valuesAttr]); })
            .style('stroke', function(series) { return series[opts.colorAttr]; });
    },

    getXScale: function() {
        var data = this.getData();
        return d3.scale.linear()
            .rangeRound([0, this.width])
            .domain(this.getLinearExtent(data, this.options.xAttr));
    },

    getYScale: function() {
        var data = this.getData();
        return d3.scale.linear()
            .rangeRound([this.height, 0])
            .domain([
                0, // Force scale to start from zero
                this.getLinearExtent(data, this.options.yAttr, 'max')
            ])
            .nice();
    },

    getLinearExtent: function(data, attr, minmax) {
        if (!minmax) {
            // Keep recursive behavior
            return Chart.prototype.getLinearExtent.apply(this, arguments);
        }

        // Return extent over all series
        return _(data).chain().map(function(series) {
            return _[minmax](series[this.options.valuesAttr], function(d) {
                return d && d[attr];
            })[attr];
        }, this)[minmax]().value();
    }

});


// Time series chart
var TimeSeries = Mackerel.TimeSeries = Line.extend({

    className: Line.prototype.className + ' mackerel-timeseries',

    defaults: _.defaults({
        xFormat: d3.time.scale.utc().tickFormat(),
        xValid: _.isDate
    }, Line.prototype.defaults),

    getXScale: function() {
        var data = this.getData();
        return d3.time.scale.utc()
            .range([0, this.width])
            .domain(this.getLinearExtent(data, this.options.xAttr));
    }

});


// Country map
var CountryMap = Mackerel.CountryMap = Chart.extend({

    className: Chart.prototype.className + ' mackerel-countrymap',

    defaults: {
        xValid: _.isString,
        yFormat: d3.format(','),
        colorRange: [               // Choropleth fill colors
            d3.interpolate('white', 'steelblue')(0.2), // lightened steelblue
            'steelblue'                                // steelblue
        ],
        strokeWidth: 2,             // Width of country border (multiplier)
        projection: 'mercator',     // d3.geo projection (https://github.com/d3/d3-geo-projection/)
        autoZoom: true,             // Automatically crop and zoom map to non-zero data
        zoomFactor: 0.9,            // Values <1 leave some padding when zooming
        crop: [                     // Maximum coordinates for each direction
            [-180, 83.7],           // [west, north] (crop North Pole)
            [180, -56.6]            // [east, south] (crop Antarctica)
        ],
        countryData: null           // geoJSON FeatureCollection of countries (or AJAX path)
    },

    initialize: function() {
        _.bindAll(this, 'getMapTransform', 'getCountryFill');
        // Optimize calls to getDataBounds
        this.getDataBounds = _.memoize(this.getDataBounds, function(data) {
            return _.keys(data).toString();
        });
        Chart.prototype.initialize.apply(this, arguments);
    },

    renderData: function() {
        var countryData = this.options.countryData;
        if (_.isString(countryData)) {
            $.getJSON(countryData, this.renderCountries);
        } else if (_.isObject(countryData)) {
            this.renderCountries(countryData);
        }
    },

    // Shortcut for replacing geoJSON data after the chart has been initialized
    setCountryData: function(countryData) {
        this.options.countryData = countryData;
        this.render();
    },

    renderCountries: function(countryData) {
        var chart = this,
            x = this.scales.x, // x scale = d3.geo.path
            y = this.scales.y, // y scale = linear color
            opts = this.options;

        // Cache country data for re-rendering
        opts.countryData = countryData;

        // Render countries with data classes, zoom on nonzero countries
        this.svg.append('g')
            .attr('transform', this.getMapTransform)
            .selectAll('path')
                .data(opts.countryData.features)
                .enter().append('path')
                    .attr('class', 'country')
                    .attr('d', x)
                    .attr('data-code', function(f) {
                        return f.properties && f.properties.code;
                    })
                    .each(function(f) { chart.addCountryTooltip(this, f); })
                    .style('fill', this.getCountryFill)
                    .style('stroke-width', this.getStrokeWidth(opts.strokeWidth));
    },

    getXScale: function() {
        var projection = d3.geo[this.options.projection]()
            .scale(Math.min(this.width, this.height))
            .translate([this.width / 2, this.height / 2]);
        return d3.geo.path()
            .projection(projection);
    },

    getYScale: function() {
        var data = this.getData(),
            domain = this.getLinearExtent(data, 'y');
        return d3.scale.linear()
            .range(this.options.colorRange)
            // If data contains only one datum it should be mapped
            // to the highest color
            .domain(data.length == 1 ? [0, domain[1]] : domain);
    },

    getCountryFill: function(f) {
        if (!f.properties) return null;
        var d = _(this.getData()).findWhere({ x: f.properties.code });
        return d ? this.scales.y(d.y) : null;
    },

    getCountryTitle: function(f) {
        if (!f.properties) return '';
        var d = _(this.getData()).findWhere({ x: f.properties.code }),
            title = f.properties.name;
        if (d && this.options.yValid(d.y)) {
            title += ': ' + this.options.yFormat(d.y);
        }
        return title;
    },

    addCountryTooltip: function(node, f) {
        if (!f.properties) return;
        var dataBounds = this.getDataBounds(this.getData()),
            bounds = this.scales.x.bounds(f);

        if ($.fn.tooltip) {
            // Attach Bootstrap tooltip
            $(node).tooltip({
                container: this.el,
                placement: function() {
                    // Country clipped from bottom
                    if (bounds[1][1] > dataBounds[1][1]) return 'top';
                    // Country clipped from top
                    if (bounds[0][1] < dataBounds[0][1]) return 'bottom';
                    // Country clipped from right
                    if (bounds[1][0] > dataBounds[1][0]) return 'left';
                    // Country clipped from left
                    if (bounds[0][0] < dataBounds[0][0]) return 'right';
                    // Default
                    return 'top';
                },
                title: this.getCountryTitle(f)
            });
        } else {
            // Fall back to SVG title
            d3.select(node).append('title').text(this.getCountryTitle(f));
        }
    },

    getMapTransform: function() {
        // http://bl.ocks.org/mbostock/4699541
        var b = this.getDataBounds(this.options.autoZoom ? this.getData() : null),
            base = this.scales.x.projection().translate(),
            scale = this.getMapScale(),
            t = [-(b[1][0] + b[0][0]) / 2, -(b[1][1] + b[0][1]) / 2];
        return 'translate('+base[0]+','+base[1]+') scale('+scale+') translate('+t[0]+','+t[1]+')';
    },

    getMapScale: function() {
        // http://bl.ocks.org/mbostock/4699541
        var zoomFactor = this.options.zoomFactor,
            b = this.getDataBounds(this.options.autoZoom ? this.getData() : null),
            w = this.width,
            h = this.height;
        return zoomFactor / Math.max((b[1][0] - b[0][0]) / w, (b[1][1] - b[0][1]) / h);
    },

    getStrokeWidth: function(multiplier) {
        if (!multiplier) multiplier = 1;
        return multiplier / Math.sqrt(this.getMapScale());
    },

    getDataBounds: function(data) {
        // [​[left, top], [right, bottom]​]
        var result = [[Infinity, Infinity], [-Infinity, -Infinity]],
            opts = this.options;

        _(data).each(function(d) {
            var feature = _(opts.countryData.features).find(function(f) {
                return f.properties.code == d.x;
            });
            if (!feature) return;
            var bounds = this.scales.x.bounds(feature);
            if (result[1][1] < bounds[1][1]) result[1][1] = bounds[1][1];
            if (result[0][1] > bounds[0][1]) result[0][1] = bounds[0][1];
            if (result[1][0] < bounds[1][0]) result[1][0] = bounds[1][0];
            if (result[0][0] > bounds[0][0]) result[0][0] = bounds[0][0];
        }, this);

        // Crop away Antarctica, North Pole and everything west of continental US
        var proj = this.scales.x.projection(),
            crop = [proj(opts.crop[0]), proj(opts.crop[1])];
        if (!_.isFinite(result[1][1])) result[1][1] = crop[1][1];
        if (!_.isFinite(result[0][1])) result[0][1] = crop[0][1];
        if (!_.isFinite(result[1][0])) result[1][0] = crop[1][0];
        if (!_.isFinite(result[0][0])) result[0][0] = crop[0][0];

        return result;
    }

});


}).call(this);
