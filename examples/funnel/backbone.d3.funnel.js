// Funnel chart for backbone.d3
//
// Copyright (c) 2013 AdRoll
// MIT license
// http://github.com/AdRoll/backbone.d3

(function() {

// Define a new chart type: Backbone.D3.Funnel
// Extends Backbone.D3.Bar using the class inheritance in Backbone
Backbone.D3.Funnel = Backbone.D3.Bar.extend({

    // Extend bar chart styles
    className: Backbone.D3.Bar.prototype.className + ' bbd3-funnel',

    // Extend bar chart defaults
    defaults: _.defaults({
        barPadding: 0.7
    }, Backbone.D3.Bar.prototype.defaults),

    // Overrides renderData in Backbone.D3.Bar
    renderData: function() {
        var chart = this,
            opts = this.options,
            x = this.scales.x,
            y = this.scales.y;

        // Render bars using superclass
        Backbone.D3.Bar.prototype.renderData.call(this);

        // Conversion rates
        var barGap = x.rangeBand() * opts.barPadding / (1 - opts.barPadding),
            convFontSize = 14,
            convWidth = Math.round(barGap * 0.75),
            convHeight = convFontSize * 2,
            tipRatio = 0.2;

        var convRates = this.svg.selectAll(".conv-rate-wrapper")
            // Leave out last value from conversion rates
            .data(this.collection.initial(), this.joinData)
            .enter().append("g")
                .attr("class", "conv-rate-wrapper")
                .attr("transform", function(d) {
                    var offset = (barGap - convWidth) / 2,
                        tx = Math.round(x(chart.getX(d)) + x.rangeBand() + offset),
                        ty = Math.round(y(0) - convHeight - chart.height / 4);
                    return "translate(" + tx + "," + ty + ")";
                });

        convRates.append("polygon")
            .attr("class", "conv-rate")
            .attr("points", _.bind(
                this._convShape, this, convWidth, convHeight, tipRatio
            ));

        convRates.append("text")
            .attr("x", convWidth / 2 * (1 - tipRatio / 2))
            .attr("y", convHeight / 2)
            .attr("dy", "0.35em")
            .style("font-size", convFontSize + "px")
            .text(function(d, i) {
                return chart._getConvRate(d, i) + "%";
            });
    },

    // Calculates the conversion rate between two values
    _getConvRate: function(d, i) {
        var yValue = this.getY(d);
        if (yValue === 0) return 0;
        // Show conversion rate between bars
        var nextBar = this.collection.at(i + 1);
        return Math.round(this.getY(nextBar) / yValue * 100);
    },

    // Returns the SVG path for a conversion rate arrow
    _convShape: function(w, h, tipRatio) {
        return _([
            [0, 0],
            [Math.round(w*(1-tipRatio)), 0],
            [w, h/2],
            [Math.round(w*(1-tipRatio)), h],
            [0, h]
        ]).invoke("join", ",").join(" ");
    }

});


})();
