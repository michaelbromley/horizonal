var themes = themes || {};

themes["Basic CSS Transitions"] = {
    options: {
        customCssFile: 'themes/basic-css-transitions.css',
        pageMargin: 40,
        stagger: 'random',
        staggerDelay: 0.04,
        selector: 'p,img,h1,h2,h3, h4, .h, .thumbnail, em, ul, ol, pre',
        rootElement: '#root'
    }
};
var themes = themes || {};

themes["Basic CSS Animations"] = {
    options: {
        customCssFile: 'themes/basic-css-animations.css',
        pageMargin: 40,
        stagger: 'sequence',
        staggerDelay: 0.05,
        selector: 'p,img,h1,h2,h3, h4, .h, .thumbnail, em, li',
        rootElement: '#root'
    }
};
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
var themes = themes || {};

themes["Slide Show"] = {
    options: {
        customCssFile: 'themes/slideshow.css',
        pageMargin: 40,
        stagger: 'random',
        staggerDelay: 0,
        selector: 'p,img,h1,h2,h3, h4, .h, .thumbnail, em, li',
        rootElement: '#root',
        pageHideDelay: 3
    }
};
var themes = themes || {};

themes["Star Wars"] = {
    options: {
        customCssFile: 'themes/star-wars.css',
        stagger: 'random',
        staggerDelay: 0,
        selector: 'p,img,h1,h2,h3, h4, .h, .thumbnail, em, li',
        rootElement: '#root',
        pageHideDelay: 3
    }
};
var themes = themes || {};

themes["Parallax Effect"] = {
    options: {
        customCssFile: 'themes/parallax-effect.css',
        pageMargin: 40,
        selector: 'p,img,h1,h2,h3, h4, .h, .thumbnail, em, li',
        staggerDelay: 0,
        pageHideDelay: 2,
        rootElement: '#root',
        onPageTransition: function(type, page, animator) {
            if (type === 'toFocusFromFore' || type === 'toFocusFromBack') {
                page.domNode.classList.add('hidden');
                window.setTimeout(function() {
                    page.domNode.classList.remove('hidden');
                });
            }
        },
        onNodeTransition: function(type, node, animator) {
            var originalTop, z;

            if (type == 'toBackground') {

                z = getRandomZ();
                node.domNode.style.transform = 'translate3d(0, 0, ' + z + 'px)';
                node.domNode.style.top = (parseInt(node.domNode.style.top) - 1500) + 'px';

            } else if (type == 'toForeground') {

                z = getRandomZ();
                node.domNode.style.transform = 'translate3d(0, 0, ' + z + 'px)';
                node.domNode.style.top = (parseInt(node.domNode.style.top) + 1500) + 'px';

            } else if (type == 'toFocusFromFore') {

                moveToFocus('fore');

            } else if (type == 'toFocusFromBack') {

                moveToFocus('back');

            }

            function moveToFocus(from) {
                var startingTop;
                node.restore();

                if (from === 'back') {
                    startingTop = (parseInt(node.domNode.style.top) - 700) + 'px';
                } else {
                    startingTop = (parseInt(node.domNode.style.top) + 700) + 'px';
                }

                z = getRandomZ();
                originalTop = node.domNode.style.top;
                node.domNode.style.top = startingTop;
                node.domNode.style.opacity = '0';
                window.setTimeout(function() {
                    node.domNode.style.transform = 'translate3d(0, 0, ' + z + 'px)';
                }, 1);
                window.setTimeout(function() {
                    node.domNode.classList.add('transition');
                    node.domNode.style.opacity = '1';
                    node.domNode.style.top = originalTop;
                }, 500);
                window.setTimeout(function() {
                    node.domNode.style.transform = 'translate3d(0, 0, 0)';
                }, 1500);
            }

            function getRandomZ() {
                if (node.domNode.style.transform === '' || node.domNode.style.transform === 'translate3d(0px, 0px, 0px)') {
                    return Math.round((Math.random() - 0.9) * 500);
                } else{
                    return z;
                }
            }
        }
    }
};