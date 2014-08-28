module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            core: {
                src: [
                    'src/prefix.js',
                    'src/pageCollectionGenerator.js',
                    'src/horizonal.js',
                    'src/common.js',
                    'src/eventHandlers.js',
                    'src/animator.js',
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
                    'src/demo-themes/basic-css-transitions/*.js',
                    'src/demo-themes/basic-css-animations/*.js',
                    'src/demo-themes/basic-javascript-animation/*.js',
                    'src/demo-themes/slideshow/*.js',
                    'src/demo-themes/star-wars/*.js',
                    'src/demo-themes/parallax-effect/*.js',
                    'src/demo-themes/book-pages/*.js'
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
                src: ['**/*.src.css'],
                dest: 'demo/themes/',
                rename: function(dest, src) {
                    var fileName = dest + src.replace(/\.src/, "");

                    var replaced =  fileName.replace(/(demo\/themes\/)[^\/]*\//, "$1");
                    console.log(replaced);
                    return replaced;
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
        compress: {
            main: {
                options: {
                    mode: 'zip',
                    archive: 'dist/horizonal.zip'
                },
                expand: true,
                cwd: 'dist/',
                src: ['*.js', '*.css'],
                flatten: true
            }
        },
        watch: {
            coreJs: {
                files: ['src/*.js'],
                tasks: ['jshint', 'concat:core', 'uglify', 'compress']
            },
            themeJs: {
                files: ['src/demo-themes/**/*.js'],
                tasks: ['jshint', 'concat:themes']
            },
            coreCss: {
                files: ['src/horizonal.src.css'],
                tasks: ['autoprefixer:core', 'compress']
            },
            themeCss: {
                files: ['src/demo-themes/**/*.css'],
                tasks: ['autoprefixer:themes']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'autoprefixer', 'compress']);

};