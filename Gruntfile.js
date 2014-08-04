module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            core: {
                src: [
                    'src/prefix.js',
                    'src/horizonal.js',
                    'src/common.js',
                    'src/eventHandlers.js',
                    'src/node.js',
                    'src/nodeCollection.js',
                    'src/page.js',
                    'src/pageCollection.js',
                    'src/suffix.js'
                ],
                dest: 'dist/horizonal.debug.js'
            },
            themes: {
                src: [
                    'src/demo-themes/*.js',
                ],
                dest: 'demo/themes/themes.js'
            }
        },
        copy: {
            files: {
                cwd: 'src/',
                src: ['<%= pkg.name %>.src.js'],
                dest: 'dist/',
                expand: true,
                rename: function() {
                    return "dist/<%= pkg.name %>.debug.js";
                }
            }
        },
        autoprefixer: {
            core: {
                expand: true,
                cwd: 'src/',
                src: ['*.src.css'],
                dest: 'dist/',
                rename: function(dest, src) {
                    return dest + src.replace(/\.src/, "");
                }

            },
            themes: {
                expand: true,
                cwd: 'src/demo-themes/',
                src: ['*.src.css'],
                dest: 'demo/themes/',
                rename: function(dest, src) {
                    return dest + src.replace(/\.src/, "");
                }
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.debug.js']
                }
            }
        },
        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js', '!src/prefix.js', '!src/suffix.js'],
            options: {
                // options here to override JSHint defaults
                globals: {
                    jQuery: true,
                    console: true,
                    module: true,
                    document: true
                }
            }
        },
        watch: {
            js: {
                files: ['src/**/*.js'],
                tasks: ['jshint', 'concat', 'uglify']
            },
            css: {
                files: ['src/css/*.css'],
                tasks: ['autoprefixer']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'autoprefixer']);

};