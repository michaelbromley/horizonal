(function($, window, document) {

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
function Node(domNode, index) {
    this.domNode = domNode;
    this.index = index;
    this.page = null;
    this.isClone = false;
    this.layout = this.getLayout();
    this.isTall = false;
    this.pageOverhang = 0;
    $(this.domNode).addClass('hrz-element hrz-fore');
}

Node.prototype = {
    /**
     * Calculate the bounding box of the node and return it as an object. The isTall property is used to
     * signal that this node is over 1/2 the height of the current viewport height.
     * @param node
     * @returns {{top: number, left: number, bottom: number, width: number, height: number}}
     */
    getLayout: function() {
        var $node = $(this.domNode),
            left = $node.offset().left,
            top = $node.offset().top - parseInt($node.css('margin-top')),
            width = $node.width(),
            height = $node.height(),
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
     * Set which page this node should appear on.
     * @param pageNumber
     */
    setPage: function(pageNumber) {
        this.page = pageNumber;
        $(this.domNode).addClass("hrz-page-" + pageNumber);
        if ($('#hrz-page-' + this.page).length === 0) {
            CONTAINER.prepend('<div class="hrz-page" id="hrz-page-' + this.page + '" />');
        }
        $('#hrz-page-' + this.page).append(this.domNode);
    },

    setCssProperties: function() {
        var offsetTop = PAGE_OFFSETS[this.page - 1];
        var delay = this.getStaggerDelay();
        var pageMargin = this.page === 1 ? 0 : OPTIONS.pageMargin;
        $(this.domNode).css({
            'position': 'fixed',
            'top' : this.layout.top - offsetTop + pageMargin + 'px',
            'left' : this.layout.left + 'px',
            'width' : this.layout.width + 'px',
            'height' : this.layout.height + 'px',
            'transition': 'transform ' + delay + 's, opacity ' + delay + 's',
            '-webkit-transition': '-webkit-transform ' + delay + 's, opacity ' + delay + 's'
        });
    },

    getStaggerDelay: function() {
        var delay;
        if (OPTIONS.stagger === 'random') {
            delay = Math.random() *  0.5 + 0.7 ;
        } else if (OPTIONS.stagger === 'sequence') {
            delay = Math.log(this.pageOrder + 2);
        } else {
            delay = 1;
        }
        return delay / OPTIONS.transitionSpeed;
    },

    moveToForground: function() {
        $(this.domNode).addClass('hrz-fore');
    },

    moveToBackground: function() {
        $(this.domNode).addClass('hrz-back');
    },

    moveToFocus: function() {
        $(this.domNode).removeClass('hrz-fore hrz-back');
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
        var allNodes = $(selector).filter(':visible');
        allNodes.each(function(index, domNode) {
            self.push(new Node(domNode, index));
        });
    },

    calculateNodePositionsAndPages: function(environment) {
        var viewportHeight = environment.viewportHeight;
        var lastPage = 1;
        var index;

        for (index = 0; index < this.length; index ++) {
            var node = this[index];
            var pageLowerBound = PAGE_OFFSETS[lastPage-1] === undefined ? 0 : PAGE_OFFSETS[lastPage-1];
            var pageUpperBound = pageLowerBound + viewportHeight;

            var nodeIsTallAndDoesNotFitOnPage = viewportHeight / 2 < node.layout.height && pageUpperBound < node.layout.bottom;
            if (nodeIsTallAndDoesNotFitOnPage) {
                if (!node.isClone) {
                    node.isTall = true;
                    var pageOverhang = node.layout.bottom - pageUpperBound;
                    var i = 1;
                    // As long as the node hangs over the edge of the page, we need to keep
                    // adding clones that will each appear on subsequent pages.
                    while(0 < pageOverhang) {
                        var cloneIndex = index + i;
                        var clone = node.makeClone(cloneIndex);
                        clone.pageOverhang = pageOverhang;
                        NODE_COLLECTION.splice(cloneIndex, 0 , clone);
                        pageOverhang = pageOverhang - viewportHeight;
                        i ++;
                    }
                }
            }
            calculateLastPageAndPageOffset(node);

            node.setPage(lastPage);
        }

        $.each(this, function(index, node) {
            node.setCssProperties();
        });

        var documentHeight = PAGE_OFFSETS[PAGE_OFFSETS.length - 1] + viewportHeight;
        $('body').height(documentHeight);
        if (!OPTIONS.displayScrollbar) {
            $('body').css('overflow-y', 'hidden');
        }

        /**
         * For a given node, we need to know what page it should be on, and whether it extends off the bottom
         * off the current page (lastPage). If so, we need to start a new page. Sorry about the complexity.
         * @param node
         */
        function calculateLastPageAndPageOffset(node) {
            if (PAGE_OFFSETS[lastPage] !== undefined) {
                if (PAGE_OFFSETS[lastPage] <= node.layout.bottom) {
                    var nodeDoesNotFitOnPage = pageUpperBound < node.layout.bottom;
                    if (!node.isTall) {
                        if (nodeDoesNotFitOnPage || node.isClone) {
                            lastPage ++;
                            if (viewportHeight < node.layout.height) {
                                PAGE_OFFSETS[lastPage] = pageUpperBound;
                                if (node.pageOverhang) {
                                    PAGE_OFFSETS[lastPage] += Math.min(node.pageOverhang, viewportHeight);
                                }
                            } else {
                                PAGE_OFFSETS[lastPage] = node.layout.bottom;
                            }
                        } else {
                            PAGE_OFFSETS[lastPage] = node.layout.bottom;
                        }
                    } else {
                        if (nodeDoesNotFitOnPage) {
                            PAGE_OFFSETS[lastPage] = pageUpperBound;
                        }
                    }
                }
            } else {
                PAGE_OFFSETS[lastPage] = node.layout.bottom;
            }
        }
    }

};

NodeCollection.prototype = [];
$.extend(NodeCollection.prototype, NodeCollectionAPI);



window.horizonal = (function() {
    var instance = new Horizonal();

    return {
        init: instance.init
    };
})();

})(jQuery, window, document);