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
