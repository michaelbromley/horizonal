(function($, window, document) {
/**
 * This object is responsible for taking a nodeCollection and splitting it up into the correct number of pages,
 * placing the correct nodes on each page.
 */
var pageCollectionGenerator = function() {
    var module = {};

    function fromNodeCollection(nodeCollection) {
        var lastPage = 1;
        var index;
        var pageCollection = new PageCollection();

        for (index = 0; index < nodeCollection.length; index ++) {
            var node = nodeCollection[index];
            var pageUpperBound = pageCollection.getLastOffset() + VIEWPORT_HEIGHT;

            var nodeIsTallAndDoesNotFitOnPage = isNodeTall(node, pageUpperBound);
            if (nodeIsTallAndDoesNotFitOnPage && !node.isClone) {
                node.isTall = true;
                var pageOverhang = node.layout.bottom - pageUpperBound;
                var i = 1;
                // As long as the node hangs over the edge of the page, we need to keep
                // adding clones that will each appear on subsequent pages.
                while(0 < pageOverhang) {
                    var cloneIndex = index + i;
                    var clone = node.makeClone(cloneIndex);
                    clone.pageOverhang = pageOverhang;
                    nodeCollection.splice(cloneIndex, 0 , clone);
                    pageOverhang = pageOverhang - VIEWPORT_HEIGHT;
                    i ++;
                }
            }
            lastPage = calculateLastPageAndPageOffset(node, pageCollection, lastPage);

            var pageToAddTo;
            var nodeIsBottomMostElement = pageCollection.last().bottom === node.layout.bottom;
            if (nodeIsBottomMostElement || node.isClone || node.newPage) {
                pageToAddTo = lastPage;
            } else {
                pageToAddTo = pageCollection.getPageAtOffset(node.layout.top).pageNumber;
            }

            pageCollection.getPage(pageToAddTo).addNode(node);
        }

        return pageCollection;
    }

    function isNodeTall(node, pageUpperBound) {
        var isTall = false;
        if ($(node.domNode).hasClass(OPTIONS.newPageClass)) {
            if (VIEWPORT_HEIGHT < node.layout.height) {
                isTall = true;
            }
        } else {
            if (VIEWPORT_HEIGHT / 2 < node.layout.height && pageUpperBound < node.layout.bottom) {
                isTall = true;
            }
        }
        return isTall;
    }

    /**
     * For a given node, we need to know what page it should be on, and whether it extends off the bottom
     * off the current page (lastPage). If so, we need to start a new page. Sorry about the complexity.
     * @param node
     * @param lastPage
     * @param pageCollection
     */
    function calculateLastPageAndPageOffset(node, pageCollection, lastPage) {
        if ($(node.domNode).hasClass(OPTIONS.newPageClass)) {
            lastPage ++;
            node.newPage = true;
        }
        if (pageCollection[lastPage - 1] !== undefined) {
            var page = pageCollection.getPage(lastPage);
            var pageUpperBound = page.top + VIEWPORT_HEIGHT;
            if (page.bottom <= node.layout.bottom) {
                var nodeDoesNotFitOnPage = pageUpperBound < node.layout.bottom;
                if (!node.isTall) {
                    if (nodeDoesNotFitOnPage || node.isClone) {
                        lastPage ++;
                        pageCollection.add();
                        var newPage = pageCollection.last();
                        if (VIEWPORT_HEIGHT < node.layout.height) {
                            newPage.bottom = pageUpperBound;
                            if (node.pageOverhang) {
                                newPage.bottom += Math.min(node.pageOverhang, VIEWPORT_HEIGHT);
                            }
                        } else {
                            newPage.bottom = node.layout.bottom;
                        }
                    } else {
                        page.bottom = node.layout.bottom;
                    }
                } else {
                    if (nodeDoesNotFitOnPage) {
                        page.bottom = pageUpperBound;
                    }
                }
            }
        } else {
            pageCollection.add();
            pageCollection.last().bottom = node.layout.bottom;
        }

        return lastPage;
    }

    module.fromNodeCollection = fromNodeCollection;
    return module;
}();
var PAGE_COLLECTION;
var OPTIONS;
var CONTAINER;
var ROOT;
var ROOT_CLONE;
var VIEWPORT_HEIGHT;
var CUSTOM_CSS;


function Horizonal() {

    var _hasBeenInitialized = false;
    var _disabled = false;
    var defaults = {
        selector: 'h1, h2, h3, h4, h5, h6, p, li, img, table',
        staggerDelay: 0.1,
        stagger: 'random',
        customCssFile: false,
        displayScrollbar: false,
        scrollbarShortenRatio: 2, // long scrolling between pages can be a pain, so a higher value here will shorten the scroll distance between pages
        pageMargin: 20,
        displayPageCount: true,
        rootElement: 'body',
        newPageClass: 'hrz-start-new-page',
        pageHideDelay: 1, // seconds before the 'hrz-hidden' class gets added to a page the is not in focus
        onResize: noop,
        onNodeTransition: noop,
        onPageTransition: noop
    };

    function init(_OPTIONS) {
        var currentScroll = $(window).scrollTop();
        OPTIONS = $.extend( {}, defaults, _OPTIONS);
        loadCustomCss().then(function() {
            if (!_hasBeenInitialized) {
                ROOT = $(OPTIONS.rootElement);
                ROOT_CLONE = ROOT.clone();
                composePage(currentScroll)
                    .then(function() {
                        updatePageCount();
                        registerEventHandlers();
                        if (window.location.hash !== '') {
                            hashChangeHandler();
                        }
                        _hasBeenInitialized = true;
                    });
            } else {
                resizeHandler();
            }
        });
    }

    function disable() {
        if (!_disabled) {
            ROOT.replaceWith(ROOT_CLONE.clone());
            if (!OPTIONS.displayScrollbar) {
                $('body').css('overflow-y', '');
            }
            unregisterEventHandlers();
            removePageCount();
            _disabled = true;
        }
    }

    function enable() {
        if (_disabled) {
            resizeHandler();
            registerEventHandlers();
            _disabled = false;
        }
    }

    /**
     * Takes a page number or URL fragment (#) and goes to that page.
     * @param target
     */
    function goTo(target) {
        var pageNumber;
        if (target.substr(0, 1) === "#") {
            hashChangeHandler(target);
        } else {
            // TODO: verify target is valid integer
            pageNumber = target;
            PAGE_COLLECTION.showPage(pageNumber);
        }
    }

    function next() {
        var current = PAGE_COLLECTION.currentPage;
        var last = PAGE_COLLECTION.length;

        if (current < last) {
            var scrollTop = PAGE_COLLECTION.getPage(current + 1).midPoint;
            $(window).scrollTop(scrollTop);
        }
    }

    function previous() {
        var current = PAGE_COLLECTION.currentPage;

        if (1 < current) {
            var scrollTop = PAGE_COLLECTION.getPage(current - 1).midPoint;
            $(window).scrollTop(scrollTop);
        }
    }

    function registerEventHandlers() {
        $(window).on('resize', resizeHandler);
        $(window).on('keydown', keydownHandler);
        $(window).on('scroll', scrollHandler);
        $(window).on('hashchange', hashChangeHandler);
        $(window).on('touchstart pointerdown MSPointerDown', touchstartHandler);
        $(window).on('touchend pointerup MSPointerUp', touchendHandler);
        $(window).on('touchmove pointermove MSPointerMove', touchmoveHandler);
        $(window.document).on('wheel', mousewheelHandler);
        $('a').on('click', linkHandler);
    }

    function unregisterEventHandlers() {
        $(window).off('resize', resizeHandler);
        $(window).off('keydown', keydownHandler);
        $(window).off('scroll', scrollHandler);
        $(window).off('hashchange', hashChangeHandler);
        $(window).off('touchstart pointerdown MSPointerDown', touchstartHandler);
        $(window).off('touchend pointerup MSPointerUp', touchendHandler);
        $(window).off('touchmove pointermove MSPointerMove', touchmoveHandler);
        $(window.document).off('wheel', mousewheelHandler);
        $('a').off('click', linkHandler);
    }

    /**
     * Loads any custom CSS file into an inline <style> tag in the document header. This method is
     * preferred over simply loading a <link> element, because browser support for detecting the "load"
     * event of dynamically loaded CSS files is currently very poor and inconsistent. Therefore we use
     * AJAX to load the CSS file and just put the contents in the head. That way we can guarantee that it
     * is loaded before continuing, in a cross-browser compatible way.
     * @returns {*}
     */
    function loadCustomCss() {

        var deferred = new $.Deferred();

        if (OPTIONS.customCssFile) {
            $.get(OPTIONS.customCssFile).then(success);
        } else {
            $('#hrz-custom-css').remove();
            deferred.resolve();
        }
        return deferred.promise();

        function success(data) {
            CUSTOM_CSS = data;
            deferred.resolve();
        }
    }

    /**
     * Return the public API
     */
    return {
        init: init,
        disable: disable,
        enable: enable,
        goTo: goTo,
        next: next,
        previous: previous
    };
}

window.horizonal = new Horizonal();

/**
 * This is the main method that converts the document to a collection of pages. Since this method can be slow (depending
 * on the number of DOM elements in the document), it runs async and returns a promise.
 * @param currentScroll
 */
function composePage(currentScroll) {

    var deferred = new $.Deferred();
    ROOT = $(OPTIONS.rootElement);
    var fragment = createDocumentFragment();
    CONTAINER = $(fragment.querySelector('#hrz-container'));
    CONTAINER.css({
        'display': 'none', // setting display:none considerably speeds up rendering
        'top': 0,
        'left': 0
    });
    VIEWPORT_HEIGHT = $(window).height() - OPTIONS.pageMargin * 2;

    displayLoadingIndicator().then(function() {
        // a setTimeout is used to force async execution and allow the loadingIndicator to display before the
        // heavy computations of composePage() are begun.
        setTimeout(function() {

            if (!OPTIONS.displayScrollbar) {
                $('body').css('overflow-y', 'hidden');
            }

            var allNodes = new NodeCollection(OPTIONS.selector);

            PAGE_COLLECTION = pageCollectionGenerator.fromNodeCollection(allNodes);
            PAGE_COLLECTION.appendToDom(currentScroll);

            // remove any DOM nodes that are not included in the selector,
            // since they will just be left floating around in the wrong place.
            CONTAINER.children().not('.hrz-page').filter(':visible').remove();
            ROOT.empty().append(fragment);

            // add the theme's custom CSS to the document now so that it can be
            // used in calculating the elements' styles.
            addCustomCssToDocument();

            PAGE_COLLECTION.forEach(function(page) {
                page.nodes.forEach(function(node) {
                   node.renderStyles(page);
                });
            });

            CONTAINER.css('display', '');

            var documentHeight = PAGE_COLLECTION.last().bottom / OPTIONS.scrollbarShortenRatio + VIEWPORT_HEIGHT;
            ROOT.height(documentHeight);
            renderPageCount();
            removeLoadingIndicator();
            deferred.resolve();
        }, 0);
    });

    return deferred.promise();
}

/**
 * Add the CSS text loaded by loadCustomCss() into the document head.
 */
function addCustomCssToDocument() {
    var $customCssElement = $('#hrz-custom-css');
    if (0 < $customCssElement.length) {
        $customCssElement.text(CUSTOM_CSS);
    } else {
        $('head').append('<style id="hrz-custom-css" type="text/css">' + CUSTOM_CSS + '</style>');
    }
}

/**
 * Building up a documentFragment and then appending it all at once to the DOM
 * is done to improve performance.
 * @returns {*}
 */
function createDocumentFragment() {
    var fragment = document.createDocumentFragment();
    var containerDiv = document.createElement('div');
    containerDiv.id = 'hrz-container';
    fragment.appendChild(containerDiv);
    return fragment;
}

function displayLoadingIndicator() {
    var deferred = new $.Deferred();
    if ($('.hrz-loading-indicator').length === 0) {
        $('body').append('<div class="hrz-loading-indicator" style="display:none;"><p class="hrz-loading-indicator">Loading...</p></div>');
        $('div.hrz-loading-indicator').fadeIn(50, function() {
            deferred.resolve();
        });
    }
    return deferred.promise();
}

function removeLoadingIndicator() {
    setTimeout(function() {
        $('div.hrz-loading-indicator').fadeOut(50, function() {
            $(this).remove();
        });
    }, 300);
}

function renderPageCount() {
    if ($('.hrz-page-count').length === 0) {
        var pageCountDiv = $('<div class="hrz-page-count"></div>');
        $('body').append(pageCountDiv);
        pageCountDiv.append('<span id="hrz-current-page"></span> / <span id="hrz-total-pages"></span>');
        $('#hrz-total-pages').html(PAGE_COLLECTION.length);
        if (!OPTIONS.displayPageCount) {
            pageCountDiv.addClass('hidden');
        }
    }
}

function removePageCount() {
    $('.hrz-page-count').remove();
}

function updatePageCount() {
    $('#hrz-current-page').html(PAGE_COLLECTION.currentPage);
}

/**
 * + Jonas Raoni Soares Silva
 * @ http://jsfromhell.com/array/shuffle [v1.0]
 * @param o
 * @returns {*}
 */
function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function noop() {}
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
/**
 * A helper service for JavaScript-based transition animations. Using this service ensures that only a single
 * requestAnimationFrame loop is created, and all animation functions are executed within this single loop.
 *
 * The `animator` object is passed as an argument to the callback functions defined in the config object.
 */
var animator = function() {
    var module = {};
    var animationFunctions = [];

    module.start = function(fn) {
        animationFunctions.push(fn);
        if (animationFunctions.length === 1) {
            window.requestAnimationFrame(tick);
        }
    };

    module.stop = function(fn) {
        animationFunctions.splice(animationFunctions.indexOf(fn), 1);
    };

    function tick(timestamp) {
        animationFunctions.forEach(function(fn) {
            fn.call(fn, timestamp);
        });
        if (0 < animationFunctions.length) {
            window.requestAnimationFrame(tick);
        }
    }

    return module;
}();
/**
 * A Node object represents a DOM element. An actual reference to the HTMLElement object is contained in the 'domNode' property.
 * @param domNode
 * @param index
 * @constructor
 */
function Node(domNode, index) {
    this.domNode = domNode;
    this.index = index;
    this.isClone = false;
    this.layout = this.getLayout();
    this.isTall = false;
    this.pageOverhang = 0;
    this.originalComputedStyle = this.cloneComputedStyle();
    this.staggerOrder = 0;
}

Node.prototype = {

    /**
     * In order to ensure a faithful visual reproduction of the original page, before we do anything with the DOM, we
     * need to store a copy of *all* of the computed CSS style rules that apply to this DOM node. We will use this
     * information at the final rendering step in order to perform a diff and inline any changed styles.
     * @returns {*}
     */
    cloneComputedStyle: function() {
        var computedStyleClone = document.createElement('div').style;
        var computedStyle = window.getComputedStyle(this.domNode);
        for (var i = 0; i < computedStyle.length; i++) {
            var name = computedStyle[i];
            computedStyleClone.setProperty(name,
                computedStyle.getPropertyValue(name),
                computedStyle.getPropertyPriority(name));
        }
        return computedStyleClone;
    },

    /**
     * Calculate the bounding box and absolute position of the node and return it as an object.
     * @returns {{top: number, left: number, bottom: number, width: number, height: number}}
     */
    getLayout: function() {
        var $node = $(this.domNode),
            left = $node.offset().left - ROOT.offset().left,
            top = $node.offset().top - ROOT.offset().top - parseInt($node.css('margin-top')),
            width = $node.width() + parseInt($node.css('padding-left')) + parseInt($node.css('padding-right')),
            height = $node.height() + parseInt($node.css('padding-top')) + parseInt($node.css('padding-bottom')),
            bottom = top + height;

        return {
            top: top,
            left: left,
            bottom: bottom,
            width: width,
            height: height
        };
    },

    /**
     * When a node is over half the height of the viewport, and also extends off the bottom of a given page,
     * we need to clone it and put the clone on the next page, to give the impression that the node is spanning
     * two (or more) pages. Depending on the height of the node, it will be cloned however many times are
     * required to allow the entire node to be displayed over successive pages.
     * @param index
     */
    makeClone: function(index) {
        var clonedDomNode = $(this.domNode).clone()[0];
        var clone = new Node(clonedDomNode, index);
        clone.layout = {
            'top' : this.layout.top,
            'left' : this.layout.left,
            'width' : this.layout.width,
            'height' : this.layout.height,
            'bottom' : this.layout.bottom
        };
        clone.isClone = true;

        return clone;
    },

    /**
     * Append the DOM node to the correct page div
     * @param parentPage
     */
    appendToDom: function(parentPage) {
        $(this.domNode).addClass(parentPage.pageId);
        CONTAINER.find('#' + parentPage.pageId).append(this.domNode);
    },

    /**
     * Apply the CSS styles that ensure the node looks the same as it did in the
     * original document.
     * @param parentPage
     */
    renderStyles: function(parentPage) {
        this.applyStyleDiff();
        $(this.domNode).addClass('hrz-element');
        this.setCssPosition(parentPage);
        this.setTransitionDelay();
        this.setRestorePoint();
    },

    /**
     * Apply the style rules needed to make the
     * DOM node appear identical to the original form.
     */
    applyStyleDiff: function() {
        var styleDiff = this.getStyleDiff();
        $(this.domNode).css(styleDiff);
    },

    /**
     * Apply the absolute positioning to make the DOM node appear in
     * the correct place on the page.
     * @param parentPage
     */
    setCssPosition: function(parentPage) {
        var pageMargin = parentPage.pageNumber === 1 ? 0 : OPTIONS.pageMargin;
        $(this.domNode).css({
            'position': 'absolute',
            'top' : this.layout.top - parentPage.top + pageMargin + 'px',
            'left' : this.layout.left + 'px',
            'width' : this.layout.width + 'px',
            'height' : this.layout.height + 'px'
        });
    },

    /**
     * If the staggerDelay option is set, then we check to see if this node has either a CSS transition or CSS animation
     * style rule applied to it. If so, we dynamically set the transition-delay or animation-delay value to give the
     * stagger effect.
     */
    setTransitionDelay: function() {
        var stagger = this.getStaggerDelay();
        if (0 < stagger) {
            var css = $(this.domNode).css.bind($(this.domNode));
            var transitionDurationIsDefined = existsAndIsNotZero(css('transition-duration')) || existsAndIsNotZero(css('-webkit-transition-duration'));
            var animationDurationIsDefined = existsAndIsNotZero(css('animation-duration')) || existsAndIsNotZero(css('-webkit-animation-duration'));
            if (transitionDurationIsDefined) {
                css({
                    'transition-delay': stagger + 's',
                    '-webkit-transition-delay': stagger + 's'
                });
            }
            if (animationDurationIsDefined) {
                css({
                    'animation-delay': stagger + 's',
                    '-webkit-animation-delay': stagger + 's'
                });
            }
        }

        function existsAndIsNotZero(property) {
            return typeof property !== 'undefined' && property !== '0s';
        }
    },

    getStaggerDelay: function() {
        var delay = OPTIONS.staggerDelay * this.staggerOrder;
        return Math.round(delay * 100) / 100;
    },

    /**
     * In order to make the final rendered DOM node appear identical to how it did on the original page,
     * we took a snapshot of all the computed CSS styles before making any changes to the page layout.
     * Now that we have removed the DOM node from the original place in the document, any cascaded
     * styles from parent divs will have been lost.
     *
     * This diff method gets the current computed CSS styles for the node, and compares them to the
     * snapshot we took with the cloneComputedStyle() method. If any of the style rules are not equal,
     * we add them to the styleDiff object so we can apply them inline to the DOM node.
     * @returns {{}}
     */
    getStyleDiff: function() {
        var styleDiff = {};
        var newComputedStyles = window.getComputedStyle(this.domNode);

        for (var i = 0; i < newComputedStyles.length; i++) {
            var name = newComputedStyles[i];
            var oldPropertyValue = this.originalComputedStyle.getPropertyValue(name);

            if (newComputedStyles.getPropertyValue(name) != oldPropertyValue) {
                // Internet Explorer has strange behaviour with its own deprecated prefixed version of transition, animation and
                // others. This breaks these CSS features in that browser, so the workaround here is to just omit all those
                // IE-specific prefixes.
                if ( name.substring(0, 3) == "-ms") {
                    continue;
                }
                if (oldPropertyValue !== null) {
                    styleDiff[newComputedStyles[i]] = oldPropertyValue;
                }
            }
        }

        return styleDiff;
    },

    /**
     * Trigger the onNodeTransition callback and pass this node and the type of transition:
     * - toForeground
     * - toBackground
     * - toFocusFromFore
     * - toFocusFromBack
     * @param type
     */
    moveTo: function(type) {
        var self = this;
        setTimeout(function() {
            OPTIONS.onNodeTransition(type, self.getPublicObject(), animator);
        }, this.getStaggerDelay() * 1000);
    },

    /**
     * Store a copy of the final computed inline style so that the node
     * can be easily restored to the style it had after initialization.
     * The cloneNode() method is necessary as otherwise we will just
     * get a reference to the current style, which will change as the
     * current style changes.
     */
    setRestorePoint: function() {
        this.inlineStyle = this.domNode.cloneNode().style;
    },

    /**
     * Restore the domNode to the style it had after initialization.
     * This method is intended as a convenient helper for those writing
     * JavaScript-based transitions.
     */
    restore: function() {
        var name, i;
        // first we need to delete all the style rules
        // currently defined on the element
        for (i = this.domNode.style.length; i >= 0; i--) {
            name = this.domNode.style[i];
            this.domNode.style.removeProperty(name);
        }
        // now we loop through the original CSSStyleDeclaration
        // object and set each property to its original value
        for (i = this.inlineStyle.length; i >= 0; i--) {
            name = this.inlineStyle[i];
            this.domNode.style.setProperty(name,
                this.inlineStyle.getPropertyValue(name),
                priority = this.inlineStyle.getPropertyPriority(name));
        }
    },

    /**
     * Return an object containing a subset of properties of the private Node object, for use in
     * the javascript callbacks set up in the horizonal config object.
     *
     * @returns {{domNode: *, index: *, staggerOrder: *}}
     */
    getPublicObject: function() {
        return {
            domNode: this.domNode,
            index: this.index,
            staggerOrder: this.staggerOrder,
            restore: this.restore.bind(this)
        };
    }
};



function NodeCollection(selector) {
    if (typeof selector !== 'undefined') {
        this.fromSelector(selector);
    }
}

var NodeCollectionAPI = {

    fromSelector: function(selector) {
        var self = this;
        var allNodes = ROOT.find(selector).filter(':visible').not('.hrz-loading-indicator');

        var topLevelNodes = $([]);
        allNodes.each(function(index, domNode) {
            if ($(domNode).parents(selector).length === 0) {
                topLevelNodes = topLevelNodes.add(domNode);
            }
        });

        topLevelNodes.each(function(index, domNode) {
            var node = new Node(domNode, index);
            self.push(node);
        });
    },

    appendToDom: function(parentPage) {
        // at this stage we can assign an appropriate staggerOrder to
        // the nodes, since we now know how many are on each page.
        var staggerOrder = [];
        for (var i = 1; i <= this.length; i++) {
            staggerOrder.push(i);
        }
        if (OPTIONS.stagger === 'random') {
            staggerOrder = shuffle(staggerOrder);
        }

        this.forEach(function(node, index) {
            node.staggerOrder = staggerOrder[index];
            node.appendToDom(parentPage);
        });
    }
};

NodeCollection.prototype = [];
$.extend(NodeCollection.prototype, NodeCollectionAPI);

function Page(pageNumber) {
    this.top = 0;
    this.bottom = 0;
    this.height = 0;
    this.nodes = new NodeCollection();
    this.pageNumber = pageNumber || 0;
    this.domNode = null;
    this.hideTimer = null;

    Object.defineProperty(this, "pageId", {
        get: function() {
            return "hrz-page-" + this.pageNumber;
        }
    });

    Object.defineProperty(this, "midPoint", {
        get: function() {
            return (this.bottom + this.top) / 2 / OPTIONS.scrollbarShortenRatio;
        }
    });
}

Page.prototype = {

    addNode: function(node) {
        this.nodes.push(node);
    },

    appendToDom: function(currentPage) {
        var zClass = "";
        if (this.pageNumber < currentPage) {
            zClass = "hrz-back hrz-hidden";
        } else if (currentPage < this.pageNumber) {
            zClass = "hrz-fore hrz-hidden";
        } else {
            zClass = "hrz-focus-from-fore";
        }
        CONTAINER.append('<div class="hrz-page ' + zClass + '" id="' + this.pageId + '" />');
        this.domNode = CONTAINER.find('#' + this.pageId)[0];
        this.nodes.appendToDom(this);
    },

    moveToForeground: function() {
        OPTIONS.onPageTransition('toForeground', this.getPublicObject(), animator);
        $(this.domNode).addClass('hrz-fore').removeClass('hrz-back hrz-focus-from-back hrz-focus-from-fore');
        this.hideAfterDelay();
        this.nodes.forEach(function(node) {
            node.moveTo('toForeground');
        });
    },

    moveToBackground: function() {
        OPTIONS.onPageTransition('toBackground', this.getPublicObject(), animator);
        $(this.domNode).addClass('hrz-back').removeClass('hrz-fore hrz-focus-from-back hrz-focus-from-fore');
        this.hideAfterDelay();
        this.nodes.forEach(function(node) {
            node.moveTo('toBackground');
        });
    },

    moveToFocusFromBackground: function() {
        OPTIONS.onPageTransition('toFocusFromBack', this.getPublicObject(), animator);
        $(this.domNode).addClass('hrz-focus-from-back');
        this._moveToFocus('toFocusFromBack');
    },

    moveToFocusFromForeground: function() {
        OPTIONS.onPageTransition('toFocusFromFore', this.getPublicObject(), animator);
        $(this.domNode).addClass('hrz-focus-from-fore');
        this._moveToFocus('toFocusFromFore');
    },

    _moveToFocus: function(type) {
        $(this.domNode).removeClass('hrz-fore hrz-back hrz-hidden');
        if (this.hideTimer !== null) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
        this.nodes.forEach(function(node) {
            node.moveTo(type);
        });
    },

    hideAfterDelay: function() {
        var $thisNode = $(this.domNode);
        this.hideTimer = setTimeout( function() {
            $thisNode.addClass('hrz-hidden');
        }, OPTIONS.pageHideDelay * 1000);
    },

    /**
     * Return an object containing a subset of properties of the private Page object, for use in
     * the javascript callbacks set up in the horizonal config object.
     *
     * @returns {{domNode: *, index: *, staggerOrder: *}}
     */
    getPublicObject: function() {
        return {
            domNode: this.domNode,
            pageNumber: this.pageNumber
        };
    }
};
function PageCollection() {

    var _currentPage = 1;

    Object.defineProperty(this, "currentPage", {
        get: function() {
            return _currentPage;
        },
        set: function(val) {
            if (this.last() < val) {
                _currentPage = this.last();
            } else if (val < 1) {
                _currentPage = 1;
            } else {
                _currentPage = val;
            }
        }
    });
}

var PageCollectionAPI = {

    getPage: function(pageNumber) {
        if (0 < pageNumber && pageNumber <= this.length) {
            return this[pageNumber - 1];
        } else {
            return new Page();
        }
    },

    getCurrent: function() {
        return this.getPage(this.currentPage);
    },

    getNext: function() {
        return this.getPage(this.currentPage + 1);
    },

    getPrevious: function() {
        return this.getPage(this.currentPage - 1);
    },

    add: function() {
        var pageNumber = this.length + 1;
        var newPage = new Page(pageNumber);
        newPage.top = this.getPage(this.length).bottom;
        this.push(newPage);
    },

    last: function() {
        return this[this.length - 1];
    },

    getLastOffset: function() {
        if (this.length <= 1) {
            return 0;
        } else {
            return this.last().top;
        }
    },

    /**
     * Given a y-axis offset in pixels, return the page in the collection which contains this
     * offset between its top and bottom properties. If the offset is not valid, return the
     * first page.
     * @param offset
     */
    getPageAtOffset: function(offset) {
        return this.filter(function(page) {
            return (page.top <= offset && offset < page.bottom);
        })[0] || this[0];
    },

    /**
     * Appends all the pages and page elements to the documentFragment referenced by CONTAINER
     * @param currentScroll
     */
    appendToDom: function(currentScroll) {
        var self = this;
        currentScroll = currentScroll || 0;
        this.currentPage = this.getPageAtOffset(currentScroll * OPTIONS.scrollbarShortenRatio).pageNumber;
        this.forEach(function(page) {
            page.appendToDom(self.currentPage);
        });
    },

    /**
     * To show a given page, we just need to remove the -fore and -back CSS classes
     * from the page and the nodes on that page. Lower-ordered pages have the -fore
     * class added, and higher-ordered pages have the -back class added.
     *
     *
     * @param pageNumber
     */
    showPage: function(pageNumber) {
        var oldPageNumber = this.currentPage;
        this.currentPage = pageNumber;
        var newPageNumber = this.currentPage;

        if (oldPageNumber === 0) {
            this.getPage(newPageNumber)._moveToFocus();
        } else {
            var i;
            if (oldPageNumber < newPageNumber) {
                for (i = oldPageNumber; i < newPageNumber; i ++) {
                    this.getPage(i).moveToBackground();
                }
                this.getPage(newPageNumber).moveToFocusFromForeground();
            } else if (newPageNumber < oldPageNumber) {
                for (i = oldPageNumber; newPageNumber < i; i --) {
                    this.getPage(i).moveToForeground();
                }
                this.getPage(newPageNumber).moveToFocusFromBackground();
            }
        }
    }
};

PageCollection.prototype = [];
$.extend(PageCollection.prototype, PageCollectionAPI);
})(jQuery, window, document);