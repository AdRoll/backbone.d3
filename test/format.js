describe('D3.format', function() {
    describe('#shortNumber()', function() {
        it('should return NaN for non-numeric or infinite values', function() {
            var cases = [undefined, null, '', 'foo', {}, [], NaN, Infinity];
            _.each(cases, function(input) {
                expect(D3.format.shortNumber(input)).to.equal("NaN");
            });
        });

        it('should not shorten small numbers by default', function() {
            var cases = [-99, -25.5, -10, -1, 0, 0.25, 0.5, 1, 2, 7, 10, 25.5, 99];
            _.each(cases, function(input) {
                expect(D3.format.shortNumber(input)).to.equal(String(input));
            });
        });

        it('should shorten long numbers using SI symbols', function() {
            var cases = {
                '-3.14k'    : Math.PI * -1e3,
                '-314'      : Math.PI * -100,
                '-31.4'     : Math.PI * -10,
                '-3.14'     : Math.PI * -1,
                '3.14'      : Math.PI,
                '31.4'      : Math.PI * 10,
                '314'       : Math.PI * 100,
                '3.14k'     : Math.PI * 1e3,
                '31.4k'     : Math.PI * 1e4,
                '314k'      : Math.PI * 1e5,
                '3.14M'     : Math.PI * 1e6,
                '3.14G'     : Math.PI * 1e9,
                '3.14T'     : Math.PI * 1e12,
                '3.14P'     : Math.PI * 1e15,
                '3.14E'     : Math.PI * 1e18
            };
            _.each(cases, function(input, expected) {
                expect(D3.format.shortNumber(input)).to.equal(expected);
            });
        });

        it('should round numbers when shortening', function() {
            var cases = {
                '-0.0344n'  : -0.00000000003439,
                '-3.45'     : -3.449999,
                '2'         : 1.9999999999999,
                '3.45'      : 3.449999
            };
            _.each(cases, function(input, expected) {
                expect(D3.format.shortNumber(input)).to.equal(expected);
            });
        });

        it('should allow customizing the precision using an options object', function() {
            var cases = {
                '3'         : [Math.PI, 1],
                '3.1'       : [Math.PI, 2],
                '3.14'      : [Math.PI, 3],
                '3.1416'    : [Math.PI, 5],
                '3.1415927' : [Math.PI, 8],
                '-3.1416k'  : [Math.PI * -1e3, 5]
            };
            _.each(cases, function(input, expected) {
                var output = D3.format.shortNumber(input[0], {
                    sigFigs: input[1]
                });
                expect(output).to.equal(expected);
            });
        });

        it('should ignore the second argument if it is a number', function() {
            var input = Math.PI,
                expected = '3.14';
            expect(D3.format.shortNumber(input, 0)).to.equal(expected);
            expect(D3.format.shortNumber(input, 1)).to.equal(expected);
            expect(D3.format.shortNumber(input, 3)).to.equal(expected);
            expect(D3.format.shortNumber(input, 4)).to.equal(expected);
        });
    });
});
