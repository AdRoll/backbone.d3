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
