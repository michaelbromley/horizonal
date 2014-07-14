

window.horizonal = (function() {
    var instance = new Horizonal();

    return {
        init: instance.init,
        disable: instance.disable,
        enable: instance.enable
    };
})();
