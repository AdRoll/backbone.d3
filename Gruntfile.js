module.exports = function(grunt) {

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        meta: {
            banner:
                '/*!\n' +
                ' * <%= pkg.name %> <%= pkg.version %>\n' +
                ' *\n' +
                ' * Copyright (c) <%= grunt.template.today("yyyy") %> AdRoll\n' +
                ' * <%= pkg.license %> license\n' +
                ' * <%= pkg.url %>\n' +
                ' */'
        },

        clean: {
            release: ['dist']
        },

        preprocess: {
            options: {
                context: {
                    VERSION: '<%= pkg.version %>',
                    BANNER: '<%= meta.banner %>'
                }
            },
            core: {
                files: {
                    'dist/<%= pkg.name %>.js': 'src/core.js',
                    'dist/<%= pkg.name %>.css': 'src/core.css'
                }
            }
        },

        mocha_phantomjs: {
            all: ['test/**/*.html']
        }

    });

    grunt.loadNpmTasks('grunt-mocha-phantomjs');
    grunt.loadNpmTasks('grunt-preprocess');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('test', ['mocha_phantomjs']);
    grunt.registerTask('release', ['clean:release', 'preprocess:core']);
    grunt.registerTask('default', ['release']);

};
