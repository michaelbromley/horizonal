var themes = themes || {};

themes["Basic CSS Transitions"] = {
    options: {
        customCssFile: 'themes/basic-css-transitions.css',
        stagger: 'random',
        staggerDelay: 0.04,
        scrollStep: 2,
        selector: 'p,img,h1,h2,h3, h4, .h, .thumbnail, em, ul, ol, pre',
        displayPageCount: true,
        rootElement: '#root'
    }
};
var themes = themes || {};

themes["Basic CSS Animations"] = {
    options: {
        customCssFile: 'themes/basic-css-animations.css',
        stagger: 'sequence',
        staggerDelay: 0.05,
        scrollStep: 2,
        selector: 'p,img,h1,h2,h3, h4, .h, .thumbnail, em, li',
        rootElement: '#root'
    }
};
var themes = themes || {};

themes["Basic JavaScript  Animations"] = {
    options: {
        customCssFile: 'themes/basic-javascript-animation.css',
        stagger: 'random',
        staggerDelay: 0.03,
        scrollStep: 2,
        selector: 'p,img,h1,h2,h3, h4, .h, .thumbnail, em, li',
        rootElement: '#root',
        pageHideDelay: 1,
        onPageTransition: function(type, page, animator) {
            if (type === 'toFocusFromFore' || type === 'toFocusFromBack') {
                $(page.domNode).hide().delay(500).fadeIn(100);
            }
        },
        onNodeTransition: function(type, node, animator) {
            if (type !== 'toFocusFromFore' && type !== 'toFocusFromBack' ) {
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

                animator.start(function (timestamp) {

                    var progress;
                    if (start === null) start = timestamp;
                    progress = timestamp - start;

                    y = y + vY;
                    $node.css('top', y + 'px');
                    $node.css('top', y + 'px');
                    x = x + vX;
                    $node.css('left', x + 'px');

                    vY += G;

                    if (duration < progress) {
                        animator.stop(this);
                        node.restore();
                    }
                });
            }

            function fallUp(node, duration) {
                var $node = $(node.domNode);
                var start = null;
                var finalY = parseInt($node.css('top'));
                var finalX = parseInt($node.css('left'));
                var startingX = (Math.random() - 0.5) * document.documentElement.clientWidth * 2;
                var startingY = 1500;
                var deltaX = finalX - startingX;
                var deltaY = finalY - startingY;
                $node.css('top', startingY);
                $node.css('left', startingX);

                animator.start(function (timestamp) {
                    var progress;
                    if (start === null) start = timestamp;
                    progress = timestamp - start;

                    var totalIterations = Math.round(duration / 1000 * 60);
                    var currentIteration = Math.round(progress / 1000 * 60);
                    var y = easeOutCubic(currentIteration, startingY, deltaY, totalIterations);
                    $node.css('top', y + 'px');
                    var x = easeOutCubic(currentIteration, startingX, deltaX, totalIterations);
                    $node.css('left', x + 'px');

                    if (duration < progress) {
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