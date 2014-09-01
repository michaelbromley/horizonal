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

                // scroll the background by adding a class to th container
                $('#hrz-container').removeClass(function() {
                    var classList = '';
                    var totalPages = $('.hrz-page').length;
                    for (var i = 1; i <= totalPages; i++) {
                        classList += 'p' + i + ' ';
                    }
                    return classList;
                }).addClass('p' + page.pageNumber);

                if (5 < page.pageNumber) {
                    $('#hrz-container').addClass('max-top');
                } else {
                    $('#hrz-container').removeClass('max-top');
                }
            }
        },
        onNodeTransition: function(type, node, animator) {
            var originalTop, z, zIndex, pageHeight;
            pageHeight = $(window).height();

            if (type == 'toBackground') {

                z = getRandomZ();
                zIndex = Math.round(z);
                node.domNode.style.transform = 'translate3d(0, 0, ' + z + 'px)';
                node.domNode.style.zIndex = zIndex;
                node.domNode.style.top = (parseInt(node.domNode.style.top) - pageHeight * 2) + 'px';

            } else if (type == 'toForeground') {

                z = getRandomZ();
                zIndex = Math.round(z);
                node.domNode.style.transform = 'translate3d(0, 0, ' + z + 'px)';
                node.domNode.style.zIndex = zIndex;
                node.domNode.style.top = (parseInt(node.domNode.style.top) + pageHeight * 2) + 'px';

            } else if (type == 'toFocusFromFore') {

                moveToFocus('fore');

            } else if (type == 'toFocusFromBack') {

                moveToFocus('back');

            }

            function moveToFocus(from) {
                var startingTop;
                node.restore();

                if (from === 'back') {
                    startingTop = (parseInt(node.domNode.style.top) - pageHeight) + 'px';
                } else {
                    startingTop = (parseInt(node.domNode.style.top) + pageHeight) + 'px';
                }

                z = getRandomZ();
                zIndex = Math.round(z);
                originalTop = node.domNode.style.top;
                node.domNode.style.top = startingTop;
                node.domNode.style.opacity = '0';
                window.setTimeout(function() {
                    node.domNode.style.transform = 'translate3d(0, 0, ' + z + 'px)';
                    node.domNode.style.zIndex = zIndex;
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