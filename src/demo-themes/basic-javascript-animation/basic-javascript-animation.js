var themes = themes || {};

themes["Basic JavaScript Animations"] = {
    options: {
        customCssFile: 'themes/basic-javascript-animation.css',
        pageMargin: 40,
        selector: 'p,img,h1,h2,h3, h4, .h, .thumbnail, em, li',
        staggerDelay: 0,
        rootElement: '#root',
        onPageTransition: function(type, page, animator) {
            if (type === 'toFocusFromFore' || type === 'toFocusFromBack') {
                $(page.domNode).hide().delay(500).fadeIn(100);
            }
        },
        onNodeTransition: function(type, node, animator) {
            var start, elapsed;
            var $node = $(node.domNode);

            if (type !== 'toFocusFromFore' && type !== 'toFocusFromBack' ) {
                fallAway(1100);
            } else {
                fallUp(1000);
            }

            function fallAway(duration) {
                node.restore();
                var y = parseInt($node.css('top'));
                var x = parseInt($node.css('left'));
                var vX = (Math.random() - 0.5) * 15;
                var vY = (Math.random() - 1) * 25;
                var G = 2;

                animator.start(function (timestamp) {

                    if (typeof start === 'undefined') start = timestamp;
                    elapsed = timestamp - start;

                    y = y + vY;
                    $node.css('top', y + 'px');
                    $node.css('top', y + 'px');
                    x = x + vX;
                    $node.css('left', x + 'px');

                    vY += G;

                    if (duration < elapsed) {
                        animator.stop(this);
                        node.restore();
                    }
                });
            }

            function fallUp(duration) {
                var finalY = parseInt($node.css('top'));
                var finalX = parseInt($node.css('left'));
                var startingX = (Math.random() - 0.5) * document.documentElement.clientWidth * 2;
                var startingY = 1500;
                var deltaX = finalX - startingX;
                var deltaY = finalY - startingY;
                $node.css('top', startingY);
                $node.css('left', startingX);

                animator.start(function (timestamp) {
                    if (typeof start === 'undefined') start = timestamp;
                    elapsed = timestamp - start;

                    var totalIterations = Math.round(duration / 1000 * 60);
                    var currentIteration = Math.round(elapsed / 1000 * 60);
                    var y = easeOutCubic(currentIteration, startingY, deltaY, totalIterations);
                    $node.css('top', y + 'px');
                    var x = easeOutCubic(currentIteration, startingX, deltaX, totalIterations);
                    $node.css('left', x + 'px');

                    if (duration < elapsed) {
                        animator.stop(this);
                        node.restore();
                    }
                });
            }

            function easeOutCubic(currentIteration, startValue, changeInValue, totalIterations) {
                return changeInValue * (Math.pow(currentIteration / totalIterations - 1, 3) + 1) + startValue;
            }
        }
    }
};