horizonal.init({
    stagger: 'sequence',
    staggerDelay: 0.4,
    displayScrollbar: false,
    scrollStep: 2,
    selector: 'p,img,h1,h2,h3, .h',
    displayPageCount: true
});

$(window).on('keypress', function(e) {
    if (e.which === 101) {
        horizonal.enable();
    }
    if (e.which === 100) {
        horizonal.disable();
    }
});