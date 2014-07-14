var PAGE_COLLECTION;
var OPTIONS;
var CONTAINER;
var BODY_CLONE;
var VIEWPORT_HEIGHT;


function Horizonal() {

    var defaults = {
        selector: 'h1, h2, h3, h4, h5, h6, p, li, img, table',
        stagger: 'random',
        staggerDelay: 0.1,
        transitionSpeed: 1,
        customCssFile: false,
        displayScrollbar: true,
        scrollStep: 2,
        pageMargin: 20
    };

    this.init = function(_OPTIONS) {
        OPTIONS = $.extend( {}, defaults, _OPTIONS);
        BODY_CLONE = $('body').clone();
        $('body').wrapInner('<div id="hrz-container"></div>');
        CONTAINER = $('#hrz-container');
        VIEWPORT_HEIGHT =  $(window).height() - OPTIONS.pageMargin * 2;

        addCustomCssToHead();

        var allNodes = new NodeCollection(OPTIONS.selector);
        PAGE_COLLECTION = allNodes.splitIntoPages();
        PAGE_COLLECTION.renderToDom();
        PAGE_COLLECTION.showPage(1);
        registerEventHandlers();

        // remove any DOM nodes that are not included in the selector, since they will just be left
        // floating around in the wrong place
        CONTAINER.children().not('.hrz-page').filter(':visible').remove();

        var documentHeight = PAGE_COLLECTION.last().bottom / OPTIONS.scrollStep + VIEWPORT_HEIGHT;
        $('body').height(documentHeight);
        if (!OPTIONS.displayScrollbar) {
            $('body').css('overflow-y', 'hidden');
        }
    };
}

/**
 * Register the event handlers
 */
function registerEventHandlers() {
    $(window).on('resize', debounce(resizeHandler, 250));
    $(window).on('keydown', keydownHandler);
    $(window).on('scroll', scrollHandler);
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