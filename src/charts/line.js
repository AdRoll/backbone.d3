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
