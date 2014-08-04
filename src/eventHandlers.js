/**
 * When the window is re-sized, we need to re-calculate the layout of the all the elements.
 * To ensure that we get the same results as the initial load, we simple purge the entire <body> element
 * and replace it with the clone that we made right at the start of the init() method.
 */
function resizeHandler() {
    var currentScroll = PAGE_COLLECTION.getCurrent().nodes[0].layout.top / OPTIONS.scrollbarShortenRatio;
    ROOT.replaceWith(ROOT_CLONE.clone());
    composePage(currentScroll);
    $(window).scrollTop(currentScroll);
    updatePageCount();
    OPTIONS.onResize();
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
            fun.apply(null, arguments);
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
        if (PAGE_COLLECTION.currentPage < PAGE_COLLECTION.length) {
            scrollTo = PAGE_COLLECTION.getNext().midPoint;
        }
    } else if (e.which === 38 || e.which === 37) {
        if (PAGE_COLLECTION.currentPage === 2) {
            scrollTo = 0;
        } else if (1 < PAGE_COLLECTION.currentPage) {
            scrollTo = PAGE_COLLECTION.getPrevious().midPoint;
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
    var currentPageNumber = PAGE_COLLECTION.currentPage;

    var newPageNumber = PAGE_COLLECTION.getPageAtOffset(scrollTop * OPTIONS.scrollbarShortenRatio).pageNumber;
    if (newPageNumber !== currentPageNumber) {
        PAGE_COLLECTION.showPage(newPageNumber);
        updatePageCount();
    }
}

function hashChangeHandler() {
    var hash = window.location.hash;
    if (hash !== "") {
        var page = $(hash).closest('.hrz-page');
        var pageNumber = parseInt(page.attr('id').replace(/^\D+/g, ''));
        PAGE_COLLECTION.showPage(pageNumber);
        $(window).scrollTop(PAGE_COLLECTION.getCurrent().midPoint);
        updatePageCount();
    }
}

var _touchStartPos;
var _touchStartTime;
function touchstartHandler(e) {
    if (isValidTouchEvent(e)) {
        _touchStartPos =  {
            x: getTouchX(e),
            y: getTouchY(e)
        };
        _touchStartTime = new Date().getTime();
    }
}

function touchmoveHandler(e) {
    if (isValidTouchEvent(e)) {
        e.preventDefault();
    }
}

function touchendHandler(e) {
    if (isValidTouchEvent(e)) {
        var scrollTo;
        var touchEndPos = {
            x: getTouchX(e),
            y: getTouchY(e)
        };
        var touchEndTime = new Date().getTime();

        if (isValidSwipe(_touchStartTime, touchEndTime, _touchStartPos, touchEndPos)) {
            var direction = getSwipeDirection(_touchStartPos, touchEndPos);
            if (direction === "down" || direction === "right") {
                // down or right swipe
                if (PAGE_COLLECTION.currentPage === 2) {
                    scrollTo = 0;
                } else if (1 < PAGE_COLLECTION.currentPage) {
                    scrollTo = PAGE_COLLECTION.getPrevious().midPoint;
                }
            } else {
                // up or left swipe
                if (PAGE_COLLECTION.currentPage < PAGE_COLLECTION.length) {
                    scrollTo = PAGE_COLLECTION.getNext().midPoint;
                }
            }
            $(window).scrollTop(scrollTo);
        }
    }
}

/**
 * Internet Explorer uses the Pointer Events model for both touch and mouse events. Therefore, when we bind to the
 * 'pointerdown', 'pointerup' etc. events, they will also be fired when the mouse is clicked, which we do not want.
 * Therefore we filter out the events that are triggered by mouse.
 * @param e
 * @returns {boolean}
 */
function isValidTouchEvent(e) {
    if (e.originalEvent.hasOwnProperty('pointerType')) {
        if (e.originalEvent.pointerType === 'mouse') {
            return false;
        }
    }
    return true;
}

/**
 * To be valid, a swipe must travel a sufficient distance across the screen (to distinguish from sloppy
 * clicks), and must be fairly fast (to distinguish from highlighting text attempts)
 * @param startTime
 * @param endTime
 * @param startPos
 * @param endPos
 */
function isValidSwipe(startTime, endTime, startPos, endPos) {
    var MAX_INTERVAL = 700;
    var MIN_DISTANCE = 75;
    var timeInterval = endTime - startTime;
    var dX = endPos.x - startPos.x;
    var dY = endPos.y - startPos.y;
    var swipeDistance = Math.sqrt(dX * dX + dY * dY);

    if (MAX_INTERVAL < timeInterval ||
        swipeDistance < MIN_DISTANCE) {
        return false;
    } else {
        return true;
    }
}

function getSwipeDirection(startPos, endPos) {
    var dX = endPos.x - startPos.x;
    var dY = endPos.y - startPos.y;
    var angle = Math.atan2(dY, dX);
    var direction;
    if (-Math.PI/4 < angle && angle <= Math.PI/4) {
        direction = "right";
    } else if (-3/4*Math.PI < angle && angle <= -Math.PI/4) {
        direction = "up";
    } else if (3/4*Math.PI < angle || angle < -3/4*Math.PI) {
        direction = "left";
    } else {
        direction = "down";
    }
    return direction;
}

function getTouchX(e) {
    var x;
    if (e.originalEvent.hasOwnProperty('changedTouches')) {
        x = e.originalEvent.changedTouches[0].clientX;
    } else {
        x = e.originalEvent.clientX;
    }
    return x;
}

function getTouchY(e) {
    var y;
    if (e.originalEvent.hasOwnProperty('changedTouches')) {
        y = e.originalEvent.changedTouches[0].clientY;
    } else {
        y = e.originalEvent.clientY;
    }
    return y;
}