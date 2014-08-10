/**
 * A helper service for JavaScript-based transition animations. Using this service ensures that only a single
 * requestAnimationFrame loop is created, and all animation functions are executed within this single loop.
 *
 * The `animator` object is passed as an argument to the callback functions defined in the config object.
 */
var animator = function() {
    var module = {};
    var animationFunctions = [];

    module.start = function(fn) {
        animationFunctions.push(fn);
        if (animationFunctions.length === 1) {
            window.requestAnimationFrame(tick);
        }
    };

    module.stop = function(fn) {
        animationFunctions.splice(animationFunctions.indexOf(fn), 1);
    };

    function tick(timestamp) {
        animationFunctions.forEach(function(fn) {
            fn.call(fn, timestamp);
        });
        if (0 < animationFunctions.length) {
            window.requestAnimationFrame(tick);
        }
    }

    return module;
}();