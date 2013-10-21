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
