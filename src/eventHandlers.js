/**
 * When the window is re-sized, we need to re-calculate the layout of the all the elements.
 * To ensure that we get the same results as the initial load, we simple purge the entire <body> element
 * and replace it with the clone that we made right at the start of the init() method.
 */
function resizeHandler() {
    var currentScroll = PAGE_COLLECTION.getCurrent().nodes[0].layout.top / OPTIONS.scrollStep;
    $('body').replaceWith(BODY_CLONE.clone());
    composePage(currentScroll);
    $(window).scrollTop(currentScroll);
    updatePageCount();
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
    if (e.which === 40 || e.which === 39) {
        scrollTo = PAGE_COLLECTION.getCurrent().bottom  / OPTIONS.scrollStep + 10;
    } else if (e.which === 38 || e.which === 37) {
        scrollTo = PAGE_COLLECTION.getPrevious().top  / OPTIONS.scrollStep + OPTIONS.pageMargin * 2 + 10;
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
    var currentPageNumber = PAGE_COLLECTION.currentPage;

    var newPageNumber = PAGE_COLLECTION.getPageAtOffset(scrollTop * OPTIONS.scrollStep).pageNumber;
    if (newPageNumber !== currentPageNumber) {
        PAGE_COLLECTION.showPage(newPageNumber);
        updatePageCount();
    }
}