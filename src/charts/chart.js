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
