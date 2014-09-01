var themes = themes || {};

themes["Star Wars"] = {
    options: {
        customCssFile: 'themes/star-wars.css',
        stagger: 'random',
        staggerDelay: 0,
        selector: 'p,img,h1,h2,h3, h4, .h, .thumbnail, em, li',
        rootElement: '#root',
        pageMargin: 50,
        onPageTransition: function(type, page) {
            if ($('.starfield').length === 0) {
                $('#hrz-container').prepend('<div class="starfield"></div>');
            }

            var pageHeight = $(window).height() - 100;

            if (type === 'toFocusFromFore' || type === 'toFocusFromBack') {
                var currentPage = page.pageNumber;

                $('.hrz-page').each(function(index) {
                    var offset = (index + 1) - currentPage;

                    if (index === 0) {
                        if (currentPage === 1) {
                            this.style.transform = 'rotateX(0deg) translateZ(0px)';
                            this.style.opacity = '1';
                        } else {
                            this.style.transform = 'rotateX(0deg) translateZ(-1000px)';
                            this.style.opacity = '0';
                        }
                    } else {
                        this.style.transform = 'rotateX(60deg) translateY(' + parseInt(offset * pageHeight + 100) + 'px)';
                        if (offset < -2) {
                            this.style.opacity = '0';
                        } else {
                            this.style.opacity = '1';
                        }
                    }

                    if (index === currentPage + 1) {
                        this.style.left = '0px';
                    } else {
                        this.style.left = 'inherit';
                    }

                });
            }
        }
    }
};