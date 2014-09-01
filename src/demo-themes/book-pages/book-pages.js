var themes = themes || {};

themes["Book Pages"] = {
    options: {
        customCssFile: 'themes/book-pages.css',
        pageMargin: 40,
        staggerDelay: 0,
        pageHideDelay: 0.7,
        selector: 'p,img,h1,h2,h3, h4, .h, .thumbnail, em, ul, ol, pre',
        rootElement: '#root',
        onPageTransition: function(type, page) {
            var $shadowOverlay = $(page.domNode).find('.shadow-overlay');
            window.clearTimeout(page.timer);

            if ($shadowOverlay.length === 0) {
                $(page.domNode).append('<div class="shadow-overlay"></div>');
                $shadowOverlay = $(page.domNode).find('.shadow-overlay');
            }

            if (type === 'toBackground' || type === 'toFocusFromBack') {
                $shadowOverlay.fadeIn(150);
                page.timer = window.setTimeout(function() {
                    $shadowOverlay.fadeOut(300);
                }, 500);
            }
        }
    }
};