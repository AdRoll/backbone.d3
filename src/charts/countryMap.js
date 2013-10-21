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
