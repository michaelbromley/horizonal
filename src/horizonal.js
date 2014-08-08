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
        staggerDelay: 0.1,
        stagger: 'random',
        customCssFile: false,
        displayScrollbar: true,
        scrollbarShortenRatio: 2, // long scrolling between pages can be a pain, so a higher value here will shorten the scroll distance between pages
        pageMargin: 20,
        displayPageCount: true,
        rootElement: 'body',
        newPageClass: 'hrz-start-new-page',
        pageHideDelay: 1, // seconds before the 'hrz-hidden' class gets added to a page the is not in focus
        onResize: noop,
        onNodeTransition: noop
    };

    function init(_OPTIONS) {
        var currentScroll = $(window).scrollTop();
        OPTIONS = $.extend( {}, defaults, _OPTIONS);
        addCustomCssToHead().then(function() {
            if (!_hasBeenInitialized) {
                ROOT = $(OPTIONS.rootElement);
                ROOT_CLONE = ROOT.clone();
                composePage(currentScroll).then(function() {
                    updatePageCount();
                    registerEventHandlers();
                    if (window.location.hash !== '') {
                        hashChangeHandler();
                    }
                    _hasBeenInitialized = true;
                });
            } else {
                resizeHandler();
                //registerEventHandlers();
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
    function addCustomCssToHead() {
        var $customCssElement;
        var deferred = new $.Deferred();

        if (OPTIONS.customCssFile) {
            $.get(OPTIONS.customCssFile).then(success);
        } else {
            $('#hrz-custom-css').remove();
            deferred.resolve();
        }
        return deferred.promise();

        function success(data) {
            $customCssElement = $('#hrz-custom-css');
            if (0 < $customCssElement.length) {
                $customCssElement.text(data);
            } else {
                $('head').append('<style id="hrz-custom-css" type="text/css">' + data + '</style>');
            }
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
