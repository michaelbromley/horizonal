var themes = {
    "Default": {
        options: {
            customCssFile: 'themes/base-theme.css',
            stagger: 'sequence',
            staggerDelay: 0.04,
            displayScrollbar: true,
            scrollStep: 2,
            selector: 'p,img,h1,h2,h3, h4, .h, .thumbnail',
            displayPageCount: true,
            rootElement: '#root'
        }
    },
    "CSS animations": {
        options: {
            customCssFile: 'themes/css-animations.css',
            stagger: 'sequence',
            staggerDelay: 0.05,
            scrollStep: 2,
            selector: 'p,img,h1,h2,h3, h4, .h, .thumbnail',
            rootElement: '#root'
        }
    },
    "Javascript callbacks": {
        options: {
            customCssFile: 'themes/javascript-animation.css',
            stagger: 'sequence',
            staggerDelay: 0.1,
            scrollStep: 2,
            selector: 'p,img,h1,h2,h3, h4, .h, .thumbnail',
            rootElement: '#root',
            pageHideDelay: 1,
            onNodeTransition: function(type, node) {
                if (type !== 'toFocus' ) {
                    fallAway(node, 1100);
                } else {
                    fallUp(node, 1000);
                }

                function fallAway(node, duration) {
                    node.restore();
                    var $node = $(node.domNode);
                    var start = null;
                    var y = parseInt($node.css('top'));
                    var x = parseInt($node.css('left'));
                    var vX = (Math.random() - 0.5) * 15;
                    var vY = (Math.random() - 1) * 20;
                    var G = 2;

                    requestAnimationFrame(function tick(timestamp) {

                        var progress;
                        if (start === null) start = timestamp;
                        progress = timestamp - start;

                        y = y + vY;
                        $node.css('top', y + 'px');
                        x = x + vX;
                        $node.css('left', x + 'px');

                        vY += G;

                        if (progress < duration) {
                            requestAnimationFrame(tick);
                        } else {
                            node.restore();
                        }
                    });
                }

                function fallUp(node, duration) {
                    var $node = $(node.domNode);
                    var start = null;
                    var finalY = parseInt($node.css('top'));
                    var finalX = parseInt($node.css('left'));
                    var startingX = finalX;
                    //var startingY = Math.random() * 100 + $(window).height();
                    var startingY = -300;
                    var deltaX = finalX - startingX;
                    var deltaY = finalY - startingY;
                    $node.css('top', startingY);
                    $node.css('left', startingX);

                    requestAnimationFrame(function tick(timestamp) {

                        var progress;
                        if (start === null) start = timestamp;
                        progress = timestamp - start;

                        //var y = startingY + progress / duration * deltaY;
                        var totalIterations = Math.round(duration / 1000 * 60);
                        var currentIteration = Math.round(progress / 1000 * 60);
                        var y = easeOutCubic(currentIteration, startingY, deltaY, totalIterations);
                        $node.css('top', y + 'px');
                        var x = easeOutCubic(currentIteration, startingX, deltaX, totalIterations);
                        $node.css('left', x + 'px');

                        if (progress < duration) {
                            requestAnimationFrame(tick);
                        } else {
                            node.restore();
                        }
                    });
                }

                function easeOutCubic(currentIteration, startValue, changeInValue, totalIterations) {
                    return changeInValue * (Math.pow(currentIteration / totalIterations - 1, 3) + 1) + startValue;
                }
            }
        }
    }
};