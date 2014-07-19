var PAGE_COLLECTION;
var OPTIONS;
var CONTAINER;
var ROOT;
var ROOT_CLONE;
var VIEWPORT_HEIGHT;


function Horizonal() {

    var _hasBeenInitialized = false;
    var _disabled = false;

    var defaults = {
        selector: 'h1, h2, h3, h4, h5, h6, p, li, img, table',
        stagger: 'random',
        staggerDelay: 0.1,
        customCssFile: false,
        displayScrollbar: true,
        scrollbarShortenRatio: 2, // long scrolling between pages can be a pain, so a higher value here will shorten the scroll distance between pages
        pageMargin: 20,
        displayPageCount: true,
        rootElement: 'body',
        newPageClass: 'hrz-start-new-page',
        pageHideDelay: 1, // seconds before the 'hrz-hidden' class gets added to a page the is not in focus
        onResize: noop
    };

    function init(_OPTIONS) {
        var currentScroll = $(window).scrollTop();
        OPTIONS = $.extend( {}, defaults, _OPTIONS);

        if (!_hasBeenInitialized) {
            // TODO: do some checks to make sure the specified options are okay
            ROOT = $(OPTIONS.rootElement);
            ROOT_CLONE = ROOT.clone();
            registerEventHandlers();
            composePage(currentScroll);
            updatePageCount();
            _hasBeenInitialized = true;
        } else {
            resizeHandler();
            registerEventHandlers();
        }
        addCustomCssToHead();

        if (window.location.hash !== '') {
            hashChangeHandler();
        }
    }

    function disable() {
        if (!_disabled) {
            ROOT.replaceWith(ROOT_CLONE.clone());
            unregisterEventHandlers();
            _disabled = true;
        }
    }

    function enable() {
        if (_disabled) {
            resizeHandler();
            registerEventHandlers();
            if (window.location.hash !== '') {
                hashChangeHandler();
            }
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
        $(window).on('resize', debounce(resizeHandler, 250));
        $(window).on('keydown', keydownHandler);
        $(window).on('scroll', scrollHandler);
        $(window).on('hashchange', hashChangeHandler);
    }

    function unregisterEventHandlers() {
        $(window).off('resize', debounce(resizeHandler, 250));
        $(window).off('keydown', keydownHandler);
        $(window).off('scroll', scrollHandler);
        $(window).off('hashchange', hashChangeHandler);
    }

    function addCustomCssToHead() {
        var $customCssElement;
        if (OPTIONS.customCssFile) {
            $customCssElement = $('#hrz-custom-css');
            if (0 < $customCssElement.length) {
                $customCssElement.attr('href', OPTIONS.customCssFile);
            } else {
                $('head').append('<link rel="stylesheet" id="hrz-custom-css" href="' + OPTIONS.customCssFile + '" type="text/css" />');
            }
        }
    }

    /**
     * Return the public API
     */
    return {
        init: init,
        enable: enable,
        disable: disable,
        goTo: goTo,
        next: next,
        previous: previous
    };
}

window.horizonal = new Horizonal();
