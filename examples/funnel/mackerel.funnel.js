// Funnel chart for Mackerel.js
//
// Copyright (c) 2013 AdRoll
// MIT license
// http://github.com/AdRoll/Mackerel

(function() {

// Define a new chart type: Mackerel.Funnel
// Extends Mackerel.Bar using the class inheritance in Backbone
Mackerel.Funnel = Mackerel.Bar.extend({

    // Extend bar chart styles
    className: Mackerel.Bar.prototype.className + ' mackerel-funnel',

    // Extend bar chart defaults
    defaults: _.defaults({
        barPadding: 0.7
    }, Mackerel.Bar.prototype.defaults),

    // Overrides renderData in Mackerel.Bar
    renderData: function() {
        var chart = this,
            opts = this.options,
            x = this.scales.x,
            y = this.scales.y,
            data = this.getData();

        // Render bars using superclass
        Mackerel.Bar.prototype.renderData.call(this);

        // Conversion rates
        var barGap = x.rangeBand() * opts.barPadding / (1 - opts.barPadding),
            convFontSize = 14,
            convWidth = Math.round(barGap * 0.75),
            convHeight = convFontSize * 2,
            tipRatio = 0.2;

        var convRates = this.svg.selectAll(".conv-rate-wrapper")
            // Leave out last value from conversion rates
            .data(_.initial(data), this.joinData)
            .enter().append("g")
                .attr("class", "conv-rate-wrapper")
                .attr("transform", function(d) {
                    var offset = (barGap - convWidth) / 2,
                        tx = Math.round(x(d.x) + x.rangeBand() + offset),
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
                return chart._getConvRate(d, i, data) + "%";
            });
    },

    // Calculates the conversion rate between two values
    _getConvRate: function(d, i, data) {
        if (d.y === 0) return 0;
        // Show conversion rate between bars
        return Math.round(data[i + 1].y / d.y * 100);
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
