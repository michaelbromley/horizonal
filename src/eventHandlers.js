/*
 Define the event handler functions
 */

/**
 * When the window is re-sized, we need to re-calculate the layout of the all the elements.
 * To ensure that we get the same results as the initial load, we simple purge the entire <body> element
 * and replace it with the clone that we made right at the start of the init() method.
 */
function resizeHandler() {
    $('body').replaceWith(BODY_CLONE.clone());
    NODE_COLLECTION = new NodeCollection(OPTIONS.selector);
    var environment = {
        viewportHeight: $(window).height() - OPTIONS.pageMargin * 2
    };
    NODE_COLLECTION.calculateNodePositionsAndPages(environment);
    showPage(CURRENT_PAGE);
}

/**
 * We want to prevent the resizeHandler being called too often as the page is re-sized.
 * @param fun
 * @param mil
 * @returns {Function}
 */
function debounce(fun, mil){
    var timer;
    return function(){
        clearTimeout(timer);
        timer = setTimeout(function(){
            fun();
        }, mil);
    };
}

/**
 * Allow keyboard paging with the arrow keys.
 * @param e
 */
function keydownHandler(e) {
    var scrollTo;
    var lastPage = PAGE_OFFSETS.length - 1;
    if (e.which === 40 || e.which === 39) {
        if (CURRENT_PAGE !== lastPage) {
            scrollTo = PAGE_OFFSETS[CURRENT_PAGE] + 10;
        }
    } else if (e.which === 38 || e.which === 37) {
        if (CURRENT_PAGE === 1) {
            scrollTo = PAGE_OFFSETS[CURRENT_PAGE - 1];
        } else {
            scrollTo = PAGE_OFFSETS[CURRENT_PAGE - 2];
        }
    }
    if (scrollTo !== undefined) {
        $(window).scrollTop(scrollTo);
    }
}

/**
 * When the vertical scrollbar is enabled, we want to trigger page changes at the appropriate points,
 * where that page would have been in a regular scrolling HTML page.
 */
function scrollHandler() {
    var scrollTop = $(window).scrollTop();
    var lowerBound = CURRENT_PAGE === 0 ? 0 : PAGE_OFFSETS[CURRENT_PAGE - 1];
    var upperBound = PAGE_OFFSETS[CURRENT_PAGE];

    if (scrollTop < lowerBound) {
        CURRENT_PAGE --;
        showPage(CURRENT_PAGE);
    } else if (upperBound < scrollTop) {
        CURRENT_PAGE ++;
        showPage(CURRENT_PAGE);
    }
}