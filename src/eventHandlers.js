/**
 * When the window is re-sized, we need to re-calculate the layout of the all the elements.
 * To ensure that we get the same results as the initial load, we simple purge the entire ROOT element
 * and replace it with the clone that we made right at the start of the init() method.
 */
function resizeHandler() {
    debounce(function() {
        var currentScroll = PAGE_COLLECTION.getCurrent().nodes[0].layout.top / OPTIONS.scrollbarShortenRatio;
        ROOT.replaceWith(ROOT_CLONE.clone());
        composePage(currentScroll).then(function() {
            $(window).scrollTop(currentScroll);
            updatePageCount();
            OPTIONS.onResize();
        });
    }, 250)();
}

/**
 * Allow keyboard paging with the arrow keys.
 * @param e
 */
function keydownHandler(e) {
    if (e.which === 40 || e.which === 39) {
        scrollToNextPage();
        e.preventDefault();
    } else if (e.which === 38 || e.which === 37) {
        scrollToPreviousPage();
        e.preventDefault();
    }
}

/**
 * When the vertical scrollbar is enabled, we want to trigger page changes at the appropriate points,
 * where that page would have been in a regular scrolling HTML page.
 */
function scrollHandler() {
    if (typeof PAGE_COLLECTION !== 'undefined') {
        var scrollTop = $(window).scrollTop();
        var currentPageNumber = PAGE_COLLECTION.currentPage;

        var newPageNumber = PAGE_COLLECTION.getPageAtOffset(scrollTop * OPTIONS.scrollbarShortenRatio).pageNumber;
        if (newPageNumber !== currentPageNumber) {
            PAGE_COLLECTION.showPage(newPageNumber);
            updatePageCount();
        }
    }
}

var _mousewheelLastEvent;
/**
 * Handler to throttle the action of a scroll wheel on a mouse/laptop trackpad. This prevents
 * pages being skipped when a fast scroll motion is performed.
 * @param e
 */
function mousewheelHandler(e) {
    e.preventDefault();

    var now =  new Date().getTime();

    if (250 < now - _mousewheelLastEvent || !_mousewheelLastEvent) {
        var deltaY = e.originalEvent.deltaY;
        _mousewheelLastEvent = new Date().getTime();

        if (deltaY < 0) {
            scrollToPreviousPage();
        } else if (0 < deltaY) {
            scrollToNextPage();
        }

        if (250 < now - _mousewheelLastEvent) {
            _mousewheelLastEvent = null;
        }
    }
}

/**
 * To allow URL fragments (#) to work, we need to find the location of the element with the ID
 * matching the fragment, figure out what page it is on, and then go to that page.
 */
function hashChangeHandler() {
    var hash = window.location.hash;
    if (hash !== '') {
        var page = $(hash).closest('.hrz-page');
        var pageNumber = parseInt(page.attr('id').replace(/^\D+/g, ''));
        PAGE_COLLECTION.showPage(pageNumber);
        $(window).scrollTop(PAGE_COLLECTION.getCurrent().midPoint);
        updatePageCount();
    }
}

/**
 * This event handler is for the particular scenario of when a link to a URL fragment in this document is clicked,
 * but that fragment is already in the hash part of the window.location. In this case, the hash will not change so
 * we need to manually trigger the hashchange event to simulate the expected behaviour.
 */
function linkHandler(e) {
    var currentHash = window.location.hash;
    if (currentHash !== '') {
        var url = $(this).attr('href');
        if (url.substr(0, 1) === '#') {
            if (url === currentHash) {
                hashChangeHandler();
                return false;
            }
        }
    }
}

var _touchStartPos;
var _touchStartTime;
/**
 * At the start of a touch we simply need to record the time and position of the touch,
 * to use later in working out how to handle it.
 * @param e
 */
function touchstartHandler(e) {
    if (isValidTouchEvent(e)) {
        _touchStartPos =  {
            x: getTouchX(e),
            y: getTouchY(e)
        };
        _touchStartTime = new Date().getTime();
    }
}

/**
 * We prevent the default touchmove behaviour because we don't want the page to scroll naturally - we
 * want to control the scrolling programmatically to ensure only one page is advanced per swipe.
 * @param e
 */
function touchmoveHandler(e) {
    if (isValidTouchEvent(e)) {
        e.preventDefault();

        var touchEndPos = {
            x: getTouchX(e),
            y: getTouchY(e)
        };
        var touchEndTime = new Date().getTime();

        if (isValidSwipe(_touchStartTime, touchEndTime, _touchStartPos, touchEndPos)) {
            var direction = getSwipeDirection(_touchStartPos, touchEndPos);
            switch (direction) {
                case 'up':
                    CONTAINER.css('top', '-30px');
                    break;
                case 'down':
                    CONTAINER.css('top', '30px');
                    break;
                case 'left':
                    CONTAINER.css('left', '-30px');
                    break;
                case 'right':
                    CONTAINER.css('left', '30px');
                    break;
            }
        }
    }
}

/**
 * At the end of the touch, we again record the time and position, and then use these data to figure out
 * if we should treat this as a "swipe", and if so, in what direction the swipe was. Then we can
 * move to the next or previous page as appropriate.
 * @param e
 */
function touchendHandler(e) {
    if (isValidTouchEvent(e)) {
        var scrollTo;
        var touchEndPos = {
            x: getTouchX(e),
            y: getTouchY(e)
        };
        var touchEndTime = new Date().getTime();

        CONTAINER.css('top', '0px');
        CONTAINER.css('left', '0px');

        if (isValidSwipe(_touchStartTime, touchEndTime, _touchStartPos, touchEndPos)) {
            var direction = getSwipeDirection(_touchStartPos, touchEndPos);
            if (direction === "down" || direction === "right") {
                scrollToPreviousPage();
            } else {
                scrollToNextPage();
            }
            $(window).scrollTop(scrollTo);
        }
    }
}

// ============================================
//
// Utility functions used by the event handlers
//
// ============================================

/**
 * The way the event handlers change from one page to the next is by
 * setting the value of window.scrollTop, and then letting the
 * scroll handler take care of actually doing the transition
 */
function scrollToNextPage() {
    var scrollTo;
    if (PAGE_COLLECTION.currentPage < PAGE_COLLECTION.length) {
        scrollTo = PAGE_COLLECTION.getNext().midPoint;
        $(window).scrollTop(scrollTo);
    }
}

function scrollToPreviousPage() {
    var scrollTo;
    if (PAGE_COLLECTION.currentPage === 2) {
        scrollTo = 0;
    } else if (1 < PAGE_COLLECTION.currentPage) {
        scrollTo = PAGE_COLLECTION.getPrevious().midPoint;
    }
    if (typeof scrollTo !== 'undefined') {
        $(window).scrollTop(scrollTo);
    }
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

/**
 * Given a pair of coordinates corresponding to the start and end positions of the swipe, we can
 * calculate a vector and its angle relative to the x-axis. Using this information we can figure
 * out the direction of the swipe (up, down, left or right).
 * @param startPos
 * @param endPos
 * @returns {*}
 */
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

/**
 * Internet Explorer uses a different model for touch events from Webkit browsers and others,
 * so we need to do a small check to get the correct positions of touch events.
 * @param e
 * @returns {*}
 */
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