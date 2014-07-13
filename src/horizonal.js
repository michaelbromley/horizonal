
var CURRENT_PAGE;
var BODY_CLONE;
var PAGE_OFFSETS;
var NODE_COLLECTION;
var OPTIONS;
var CONTAINER;


function Horizonal() {

    var defaults = {
        selector: 'h1, h2, h3, h4, h5, h6, p, li, img, table',
        stagger: 'random',
        staggerDelay: 0.1,
        transitionSpeed: 1,
        customCssFile: false,
        displayScrollbar: true,
        pageMargin: 20
    };

    this.init = function(_OPTIONS) {
        PAGE_OFFSETS = [0];
        CURRENT_PAGE = 1;
        OPTIONS = $.extend( {}, defaults, _OPTIONS);
        NODE_COLLECTION = new NodeCollection(OPTIONS.selector);
        // make a copy of the entire body DOM so that we 
        // can re-calculate the layout later if needed (ie on re-size)
        BODY_CLONE = $('body').clone();
        $('body').wrapInner('<div id="hrz-container"></div>');
        CONTAINER = $('#hrz-container');

        var environment = {
            viewportHeight: $(window).height() - OPTIONS.pageMargin * 2
        };
        NODE_COLLECTION.calculateNodePositionsAndPages(environment);
        addCustomCssToHead();
        showPage(CURRENT_PAGE);
        registerEventHandlers();
        // remove any DOM nodes that are not included in the selector, since they will just be left
        // floating around in the wrong place
        CONTAINER.children().not('.hrz-page').filter(':visible').remove();
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

/**
 * To show a given page, we just need to remove the -fore and -back CSS classes
 * from the page and the nodes on that page. Lower-ordered pages have the -fore
 * class added, and higher-ordered pages have the -back class added.
 *
 * @param pageNumber
 */
function showPage(pageNumber) {
    var totalPages = PAGE_OFFSETS.length - 1;
    for (var i = 1; i <= totalPages; i++) {
        if (i < pageNumber) {
            $('#hrz-page-' + i).addClass('hrz-back');
        } else if (pageNumber < i) {
            $('#hrz-page-' + i).addClass('hrz-fore');
        } else {
            $('#hrz-page-' + i).removeClass('hrz-fore hrz-back');
        }
    }
    $.each(NODE_COLLECTION, function(index, node) {
        if (node.page < pageNumber) {
            node.moveToBackground();
        } else if (pageNumber < node.page) {
            node.moveToForground();
        } else {
            node.moveToFocus();
        }
    });
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