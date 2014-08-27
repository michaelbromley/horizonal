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