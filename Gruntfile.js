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
            scripts: {
                files: {
                    'dist/<%= pkg.name %>.js': 'src/core.js'
                }
            },
            styles: {
                files: {
                    'dist/<%= pkg.name %>.css': 'src/core.css'
                }
            }
        },

        uglify: {
            options: {
                preserveComments: 'some',
                report: 'gzip'
            },
            release: {
                files: {
                    'dist/<%= pkg.name %>.min.js': 'dist/<%= pkg.name %>.js'
                }
            }
        },

        cssmin: {
            options: {
                report: 'gzip'
            },
            release: {
                files: {
                    'dist/<%= pkg.name %>.min.css': 'dist/<%= pkg.name %>.css'
                }
            }
        },

        jshint: {
            options: {
                ignores: ['test/vendor/**/*.js']
            },
            scripts: ['Gruntfile.js', 'src/**/*.js'],
            test: ['test/**/*.js']
        },

        watch: {
            scripts: {
                files: ['Gruntfile.js', 'src/**/*.js'],
                tasks: ['jshint:scripts', 'preprocess:scripts']
            },
            styles: {
                files: ['src/**/*.css'],
                tasks: ['preprocess:styles']
            },
            test: {
                files: ['test/**/*.js'],
                tasks: ['jshint:test']
            }
        },

        mocha_phantomjs: {
            all: ['test/**/*.html']
        }

    });

    grunt.loadNpmTasks('grunt-mocha-phantomjs');
    grunt.loadNpmTasks('grunt-preprocess');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('test', ['jshint', 'mocha_phantomjs']);

    grunt.registerTask('dev', ['jshint', 'preprocess', 'watch']);

    grunt.registerTask('release', ['clean:release', 'preprocess',
                                   'uglify:release', 'cssmin:release']);

    grunt.registerTask('default', ['release']);

};
