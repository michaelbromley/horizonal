var PAGE_COLLECTION;
var OPTIONS;
var CONTAINER;
var BODY_CLONE;
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
        scrollStep: 2,
        pageMargin: 20,
        displayPageCount: true
    };

    this.init = function(_OPTIONS) {
        if (!_hasBeenInitialized) {
            BODY_CLONE = $('body').clone();
            registerEventHandlers();
        }
        OPTIONS = $.extend( {}, defaults, _OPTIONS);
        addCustomCssToHead();
        composePage();
        PAGE_COLLECTION.showPage(1);
        updatePageCount();
    };

    this.disable = function() {
        if (!_disabled) {
            $('body').replaceWith(BODY_CLONE.clone());
            unregisterEventHandlers();
            _disabled = true;
        }
    };

    this.enable = function() {
        if (_disabled) {
            resizeHandler();
            registerEventHandlers();
            _disabled = false;
        }
    };
}

function composePage() {
    $('body').wrapInner('<div id="hrz-container"></div>');
    CONTAINER = $('#hrz-container');
    VIEWPORT_HEIGHT =  $(window).height() - OPTIONS.pageMargin * 2;
    var allNodes = new NodeCollection(OPTIONS.selector);
    PAGE_COLLECTION = allNodes.splitIntoPages();
    PAGE_COLLECTION.renderToDom();
    // remove any DOM nodes that are not included in the selector,
    // since they will just be left floating around in the wrong place.
    CONTAINER.children().not('.hrz-page').filter(':visible').remove();

    var documentHeight = PAGE_COLLECTION.last().bottom / OPTIONS.scrollStep + VIEWPORT_HEIGHT;
    $('body').height(documentHeight);
    if (!OPTIONS.displayScrollbar) {
        $('body').css('overflow-y', 'hidden');
    }
    renderPageCount();
}

function renderPageCount() {
    var pageCountDiv = $('<div class="hrz-page-count"></div>');
    $('body').append(pageCountDiv);
    pageCountDiv.append('<span id="hrz-current-page"></span> / <span id="hrz-total-pages"></span>');
    $('#hrz-total-pages').html(PAGE_COLLECTION.length);
    if (!OPTIONS.displayPageCount) {
        pageCountDiv.addClass('hidden');
    }
}

function updatePageCount() {
    $('#hrz-current-page').html(PAGE_COLLECTION.currentPage);
}

/**
 * Register the event handlers
 */
function registerEventHandlers() {
    $(window).on('resize', debounce(resizeHandler, 250));
    $(window).on('keydown', keydownHandler);
    $(window).on('scroll', scrollHandler);
}

function unregisterEventHandlers() {
    $(window).off('resize', debounce(resizeHandler, 250));
    $(window).off('keydown', keydownHandler);
    $(window).off('scroll', scrollHandler);
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