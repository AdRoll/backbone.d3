/*!
 * backbone.d3 0.0.1
 *
 * Copyright (c) 2013 AdRoll
 * MIT license
 * https://github.com/AdRoll/backbone.d3
 */


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
D3.VERSION = '0.0.1';

// Helpers
// -------

D3.format = {

    _siFormat: d3.format("s"),

    // Round number to N significant figures and show with SI prefix
    // e.g. shortNumber(12345) -> "12.3k"
    shortNumber: function(num, options) {
        if (num === 0) return "0";
        if (_.isNaN(num)) return "NaN";

        // Set default options
        var opts = _.extend({
            sigFigs: 3
        }, options);

        // http://blog.magnetiq.com/post/497605344/rounding-to-a-certain-significant-figures-in-javascript
        var isNegative = num < 0,
            abs = Math.abs(num),
            mult = Math.pow(10, opts.sigFigs - Math.floor(Math.log(abs) / Math.LN10) - 1),
            rounded = Math.round(abs * mult) / mult;
        return (isNegative ? "-" : "") + D3.format._siFormat(rounded);
    },

    // Show full precision with thousands separators
    longNumber: d3.format(',')

};

// Global defaults for charts
D3.chartDefaults = {
    joinAttr: null,

    xAttr: 'x',
    xFormat: D3.format.shortNumber,
    xValid: _.isFinite,
    xScale: 'linear',

    yAttr: 'y',
    yFormat: D3.format.shortNumber,
    yValid: _.isFinite,
    yScale: 'linear',

    margin: {
        top: 10,
        right: 10,
        bottom: 30,
        left: 45
    }
};


// Base view for all charts
D3.Chart = Backbone.View.extend({

    className: 'bbd3',

    initialize: function() {
        _.bindAll(this, 'joinData');

        // Include default options
        _.defaults(
            this.options,               // Options for this instance
            _.result(this, 'defaults'), // Class level defaults
            D3.chartDefaults            // Library level defaults
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

    // Control how data is joined to elements with the joinAttr option
    // Override this method to get more fine-grained control of the join
    // https://github.com/mbostock/d3/wiki/Selections#wiki-data
    joinData: function(d, i) {
        var joinAttr = this.options.joinAttr;

        if (joinAttr && d instanceof Backbone.Model) {
            return d.get(joinAttr);
        } else if (joinAttr && _(d).has(joinAttr)) {
            return d[joinAttr];
        } else {
            return i;
        }
    },

    // Get the minimum or maximum value over the whole data for linear scales
    getLinearExtent: function(attr, minmax) {
        // Return either one extreme or whole extent
        if (minmax) {
            return _[minmax](this.collection.pluck(attr));
        } else {
            return [
                this.getLinearExtent(attr, 'min'),
                this.getLinearExtent(attr, 'max')
            ];
        }
    },

    // Get the x value for a datum
    getX: function(d) { return this._getDatumValue(d, this.options.xAttr); },

    // Get the y value for a datum
    getY: function(d) { return this._getDatumValue(d, this.options.yAttr); },

    // Return x/y value for the given datum or model
    _getDatumValue: function(d, attrName) {
        if (d instanceof Backbone.Model) {
            return d.get(attrName);
        } else {
            return d ? d[attrName] : null;
        }
    },

    // Override these to implement different charts
    getXScale: function() {},
    getYScale: function() {},
    renderAxes: function() {},
    renderData: function() {}

});

// Basic bar chart
D3.Bar = D3.Chart.extend({

    className: D3.Chart.prototype.className + ' bbd3-bar',

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
            .data(this.collection.models, this.joinData)
            .enter().append('rect')
                .attr('class', 'bar')
                .attr('width', x.rangeBand())
                .attr('height', function(d) { return chart.height - y(chart.getY(d)); })
                .attr('transform', function(d) {
                    return 'translate(' + x(chart.getX(d)) + ',' + y(chart.getY(d)) + ')';
                });
    },

    getXScale: function() {
        return d3.scale.ordinal()
            .rangeRoundBands([0, this.width], this.options.barPadding)
            .domain(this.collection.pluck(this.options.xAttr));
    },

    getYScale: function() {
        return d3.scale[this.options.yScale]()
            .rangeRound([this.height, 0])
            .domain([
                0,
                this.getLinearExtent(this.options.yAttr, 'max')
            ])
            .nice();
    }

});

// Multi line chart
D3.Line = D3.Chart.extend({

    className: D3.Chart.prototype.className + ' bbd3-line',

    defaults: {
        valuesAttr: 'values',               // Values list on each series
        colorAttr: 'color',                 // Color attribute on each series
        interpolate: 'monotone',            // Line interpolation method
        colorScale: d3.scale.category10()   // Default color scale for lines
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

    renderData: function() {
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
            .data(this.collection.models, this.joinData)
            .enter().append('g')
                .attr('class', 'series');

        series.append('path')
            .attr('class', 'line')
            .attr('d', function(series) { return line(series.get(opts.valuesAttr)); })
            .style('stroke', function(series, i) {
                return series.get(opts.colorAttr) || opts.colorScale(i);
            });
    },

    getXScale: function() {
        return d3.scale[this.options.xScale]()
            .rangeRound([0, this.width])
            .domain(this.getLinearExtent(this.options.xAttr));
    },

    getYScale: function() {
        return d3.scale[this.options.yScale]()
            .rangeRound([this.height, 0])
            .domain([
                0, // Force scale to start from zero
                this.getLinearExtent(this.options.yAttr, 'max')
            ])
            .nice();
    },

    getLinearExtent: function(attr, minmax) {
        if (!minmax) {
            // Keep recursive behavior
            return D3.Chart.prototype.getLinearExtent.apply(this, arguments);
        }

        // Return extent over all series
        var seriesExtents = this.collection.map(function(series) {
            var values = series.get(this.options.valuesAttr);
            return _[minmax](values, function(d) {
                return d && d[attr];
            })[attr];
        }, this);
        return _[minmax](seriesExtents);
    }

});

// Time series chart
D3.TimeSeries = D3.Line.extend({

    className: D3.Line.prototype.className + ' bbd3-timeseries',

    defaults: _.defaults({
        xFormat: d3.time.scale.utc().tickFormat(),
        xValid: _.isDate
    }, D3.Line.prototype.defaults),

    getXScale: function() {
        return d3.time.scale.utc()
            .range([0, this.width])
            .domain(this.getLinearExtent(this.options.xAttr));
    }

});

// Country map
D3.CountryMap = D3.Chart.extend({

    className: D3.Chart.prototype.className + ' bbd3-countrymap',

    defaults: {
        xValid: _.isString,
        yFormat: D3.format.longNumber,
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
        _.bindAll(this, 'getMapTransform', 'getCountryFill', 'getCountryClass');
        D3.Chart.prototype.initialize.apply(this, arguments);
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
                    .attr('class', this.getCountryClass)
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
        var domain = this.getLinearExtent('y');
        return d3.scale[this.options.yScale]()
            .range(this.options.colorRange)
            // If data contains only one datum it should be mapped
            // to the highest color
            .domain(this.collection.length == 1 ? [0, domain[1]] : domain);
    },

    getCountryClass: function(f) {
        var classes = ['country'],
            d = this.collection.findWhere({ x: f.properties && f.properties.code });
        if (d && this.options.yValid(this.getY(d))) {
            classes.push('country-data');
        }
        return classes.join(' ');
    },

    getCountryFill: function(f) {
        if (!f.properties) return null;
        var d = this.collection.findWhere({ x: f.properties.code });
        return d ? this.scales.y(this.getY(d)) : null;
    },

    getCountryTitle: function(f) {
        if (!f.properties) return '';
        var d = this.collection.findWhere({ x: f.properties.code }),
            title = f.properties.name;
        if (d && this.options.yValid(this.getY(d))) {
            title += ': ' + this.options.yFormat(this.getY(d));
        }
        return title;
    },

    addCountryTooltip: function(node, f) {
        if (!f.properties) return;
        var dataBounds = this.getDataBounds(this.collection),
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
        var b = this.getDataBounds(this.options.autoZoom ? this.collection : null),
            base = this.scales.x.projection().translate(),
            scale = this.getMapScale(),
            t = [-(b[1][0] + b[0][0]) / 2, -(b[1][1] + b[0][1]) / 2];
        return 'translate('+base[0]+','+base[1]+') scale('+scale+') translate('+t[0]+','+t[1]+')';
    },

    getMapScale: function() {
        // http://bl.ocks.org/mbostock/4699541
        var zoomFactor = this.options.zoomFactor,
            b = this.getDataBounds(this.options.autoZoom ? this.collection : null),
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

        // Make sure we're handling a list of models
        if (data instanceof Backbone.Collection) {
            data = data.models;
        }

        _(data).each(function(d) {
            var feature = _(opts.countryData.features).find(function(f) {
                return f.properties.code == this.getX(d);
            }, this);
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
