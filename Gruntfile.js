module.exports = function(grunt) {

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        mocha_phantomjs: {
            all: ['test/**/*.html']
        }

    });

    grunt.loadNpmTasks('grunt-mocha-phantomjs');

    grunt.registerTask('test', ['mocha_phantomjs']);

};
