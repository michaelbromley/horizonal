(function($, window, document) {
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
    if (e.which === 40 || e.which === 39) {
        scrollTo = PAGE_COLLECTION.getCurrent().bottom  / OPTIONS.scrollStep + 10;
    } else if (e.which === 38 || e.which === 37) {
        scrollTo = PAGE_COLLECTION.getPrevious().top  / OPTIONS.scrollStep;
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
    var currentPage = PAGE_COLLECTION.currentPage;
    var lowerBound = PAGE_COLLECTION.getCurrent().top / OPTIONS.scrollStep;
    var upperBound = PAGE_COLLECTION.getCurrent().bottom / OPTIONS.scrollStep;

    if (scrollTop < lowerBound) {
        PAGE_COLLECTION.showPage(currentPage - 1);
    } else if (upperBound < scrollTop) {
        PAGE_COLLECTION.showPage(currentPage + 1);
    }
}
function Node(domNode, index) {
    this.domNode = domNode;
    this.index = index;
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
     * @param parentPage
     */
    renderToDom: function(parentPage) {
        $(this.domNode).addClass(parentPage.pageId);
        $('#' + parentPage.pageId).append(this.domNode);
        this.setCssProperties(parentPage.top);
    },

    setCssProperties: function(pageOffset) {
        var delay = this.getStaggerDelay();
        var pageMargin = this.page === 1 ? 0 : OPTIONS.pageMargin;
        $(this.domNode).css({
            'position': 'fixed',
            'top' : this.layout.top - pageOffset + pageMargin + 'px',
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

    moveToForeground: function() {
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

    splitIntoPages: function() {
        var lastPage = 1;
        var index;
        var pageCollection = new PageCollection();

        for (index = 0; index < this.length; index ++) {
            var node = this[index];
            var pageUpperBound = pageCollection.getLastOffset() + VIEWPORT_HEIGHT;

            var nodeIsTallAndDoesNotFitOnPage = VIEWPORT_HEIGHT / 2 < node.layout.height && pageUpperBound < node.layout.bottom;
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
                    this.splice(cloneIndex, 0 , clone);
                    pageOverhang = pageOverhang - VIEWPORT_HEIGHT;
                    i ++;
                }
            }
            lastPage = this.calculateLastPageAndPageOffset(node, pageCollection, lastPage);

            pageCollection.getPage(lastPage).addNode(node);
        }

        return pageCollection;
    },

    /**
     * For a given node, we need to know what page it should be on, and whether it extends off the bottom
     * off the current page (lastPage). If so, we need to start a new page. Sorry about the complexity.
     * @param node
     * @param lastPage
     * @param pageCollection
     */
    calculateLastPageAndPageOffset: function(node, pageCollection, lastPage) {
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
    },

    renderToDom: function(parentPage) {
        this.forEach(function(node) {
            node.renderToDom(parentPage);
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

    Object.defineProperty(this, "pageId", {
        get: function() {
            return "hrz-page-" + this.pageNumber;
        }
    });
}

Page.prototype = {

    addNode: function(node) {
        this.nodes.push(node);
    },

    renderToDom: function() {
        CONTAINER.prepend('<div class="hrz-page hrz-fore" id="' + this.pageId + '" />');
        this.domNode = $('#' + this.pageId)[0];
        this.nodes.renderToDom(this);
    },

    moveToForeground: function() {
        $(this.domNode).addClass('hrz-fore');
        this.nodes.forEach(function(node) {
            node.moveToForeground();
        });
    },

    moveToBackground: function() {
        $(this.domNode).addClass('hrz-back');
        this.nodes.forEach(function(node) {
            node.moveToBackground();
        });
    },

    moveToFocus: function() {
        $(this.domNode).removeClass('hrz-fore hrz-back');
        this.nodes.forEach(function(node) {
            node.moveToFocus();
        });
    }
};
function PageCollection() {

    var _currentPage = 0;

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

    renderToDom: function() {
        this.forEach(function(page) {
            page.renderToDom();
        });
    },

    /**
     * To show a given page, we just need to remove the -fore and -back CSS classes
     * from the page and the nodes on that page. Lower-ordered pages have the -fore
     * class added, and higher-ordered pages have the -back class added.
     *
     * @param pageNumber
     */
    showPage: function(pageNumber) {
        var oldPageNumber = this.currentPage;
        this.currentPage = pageNumber;
        var newPageNumber = this.currentPage;

        if (oldPageNumber === 0) {
            this.getPage(newPageNumber).moveToFocus();
        } else {
            if (oldPageNumber < newPageNumber) {
                this.getPage(oldPageNumber).moveToBackground();
                this.getPage(newPageNumber).moveToFocus();
            } else if (newPageNumber < oldPageNumber) {
                this.getPage(oldPageNumber).moveToForeground();
                this.getPage(newPageNumber).moveToFocus();
            }
        }
    }
};

PageCollection.prototype = [];
$.extend(PageCollection.prototype, PageCollectionAPI);


window.horizonal = (function() {
    var instance = new Horizonal();

    return {
        init: instance.init
    };
})();

})(jQuery, window, document);