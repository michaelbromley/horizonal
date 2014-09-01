var themes = themes || {};

themes["Spectrum Slides"] = {
    options: {
        customCssFile: 'themes/spectrum-slides.css',
        pageMargin: 40,
        stagger: 'random',
        staggerDelay: 0,
        selector: 'p,img,h1,h2,h3, h4, .h, .thumbnail, em, li',
        rootElement: '#root',
        onPageTransition: function(type, page) {

            if (type === 'toFocusFromFore' || type === 'toFocusFromBack') {
                if (page.pageNumber !== 1) {
                    var h = 245 - (page.pageNumber * 25);
                    var hslColour = 'hsla(' + h + ', 100%, 75%, 1)';
                    page.domNode.style.backgroundColor = hslColour;
                }
            }

        }
    }
};