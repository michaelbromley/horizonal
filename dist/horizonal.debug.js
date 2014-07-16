(function($, window, document) {
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
        var currentScroll = $(window).scrollTop();
        composePage(currentScroll);
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

function composePage(currentScroll) {
    $('body').wrapInner('<div id="hrz-container"></div>');
    CONTAINER = $('#hrz-container');
    VIEWPORT_HEIGHT =  $(window).height() - OPTIONS.pageMargin * 2;
    var allNodes = new NodeCollection(OPTIONS.selector);
    PAGE_COLLECTION = allNodes.splitIntoPages();
    PAGE_COLLECTION.renderToDom(currentScroll);
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
/**
 * When the window is re-sized, we need to re-calculate the layout of the all the elements.
 * To ensure that we get the same results as the initial load, we simple purge the entire <body> element
 * and replace it with the clone that we made right at the start of the init() method.
 */
function resizeHandler() {
    var currentScroll = PAGE_COLLECTION.getCurrent().nodes[0].layout.top / OPTIONS.scrollStep;
    $('body').replaceWith(BODY_CLONE.clone());
    composePage(currentScroll);
    $(window).scrollTop(currentScroll);
    updatePageCount();
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
        scrollTo = PAGE_COLLECTION.getPrevious().top  / OPTIONS.scrollStep + OPTIONS.pageMargin * 2 + 10;
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

    var newPageNumber = PAGE_COLLECTION.getPageAtOffset(scrollTop * OPTIONS.scrollStep).pageNumber;
    if (newPageNumber !== currentPageNumber) {
        PAGE_COLLECTION.showPage(newPageNumber);
        updatePageCount();
    }
}
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
        var computedStyle = window.getComputedStyle(this.domNode);
        return $.extend({}, computedStyle);
    },

    /**
     * Calculate the bounding box and absolute position of the node and return it as an object.
     * @param node
     * @returns {{top: number, left: number, bottom: number, width: number, height: number}}
     */
    getLayout: function() {
        var $node = $(this.domNode),
            left = $node.offset().left,
            top = $node.offset().top - parseInt($node.css('margin-top')),
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
     * Append the DOM node to the correct page div and apply the positioning and CSS style diff rules.
     * @param parentPage
     */
    renderToDom: function(parentPage) {
        $(this.domNode).addClass(parentPage.pageId);
        $('#' + parentPage.pageId).append(this.domNode);
        this.applyStyleDiff();
        var zClass = "";
        if (parentPage.pageNumber < PAGE_COLLECTION.currentPage) {
            zClass = "hrz-back";
        } else if (PAGE_COLLECTION.currentPage < parentPage.pageNumber) {
            zClass = "hrz-fore";
        }
        $(this.domNode).addClass('hrz-element ' + zClass);
        this.setCssPosition(parentPage.top);
        this.setTransitionDelay();
    },

    /**
     * Apply the style rules needed to make the
     * DOM node appear identical to the original form.
     * @param pageOffset
     */
    applyStyleDiff: function() {
        var styleDiff = this.getStyleDiff();
        $(this.domNode).css(styleDiff);
    },

    /**
     * Apply the absolute positioning to make the DOM node appear in
     * the correct place on the page.
     * @param pageOffset
     */
    setCssPosition: function(pageOffset) {
        var pageMargin = this.page === 1 ? 0 : OPTIONS.pageMargin;
        $(this.domNode).css({
            'position': 'fixed',
            'top' : this.layout.top - pageOffset + pageMargin + 'px',
            'left' : this.layout.left + 'px',
            'width' : this.layout.width + 'px',
            'height' : this.layout.height + 'px'
        });
    },

    setTransitionDelay: function() {
        var stagger = this.getStaggerDelay();
        var transition = window.getComputedStyle(this.domNode).transition;
        var webkitTransition = window.getComputedStyle(this.domNode)['-webkit-transition'];

        transition = replaceDelayValue(transition);
        webkitTransition = replaceDelayValue(webkitTransition);

        function replaceDelayValue(original) {
            if (typeof original !== 'undefined') {
                return original.replace(/(\S+\s)([0-9\.]+)s(,|$)/g, function(match, p1, p2, p3) {
                    var delay = parseInt(p2) + stagger;
                    return p1 + delay + 's' + p3;
                });
            } else {
                return "";
            }
        }

        $(this.domNode).css({
            'transition': transition,
            '-webkit-transition': webkitTransition
        });
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
        var self = this;
        $.each(newComputedStyles, function(index, property) {
            var camelCasedProperty = property.replace(/\-(\w)/g, function (strMatch, property){
                return property.toUpperCase();
            });
            if (newComputedStyles[property] != self.originalComputedStyle[camelCasedProperty]) {
                styleDiff[property] = self.originalComputedStyle[camelCasedProperty];
            }
        });
        return styleDiff;
    },

    getStaggerDelay: function() {
        var delay = OPTIONS.staggerDelay * this.staggerOrder;
        return Math.round(delay * 100) / 100;
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
            var node = new Node(domNode, index);
            self.push(node);
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
        // at this stage we can assign an appropriate staggerOrder to
        // the nodes, since we now know how many are on each page.
        var staggerOrder = [];
        for (var i = 1; i <= this.length; i++) {
            staggerOrder.push(i);
        }
        if (OPTIONS.stagger === 'random') {
            staggerOrder = this.shuffle(staggerOrder);
        }

        this.forEach(function(node, index) {
            node.staggerOrder = staggerOrder[index];
            node.renderToDom(parentPage);
        });
    },

    /**
     * + Jonas Raoni Soares Silva
     * @ http://jsfromhell.com/array/shuffle [v1.0]
     * @param o
     * @returns {*}
     */
    shuffle: function(o){
        for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
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

    renderToDom: function(currentPage) {
        var zClass = "";
        if (this.pageNumber < currentPage) {
            zClass = "hrz-back";
        } else if (currentPage < this.pageNumber) {
            zClass = "hrz-fore";
        }
        CONTAINER.append('<div class="hrz-page ' + zClass + '" id="' + this.pageId + '" />');
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
     * offset between its top and bottom properties.
     * @param offset
     */
    getPageAtOffset: function(offset) {
        return this.filter(function(page) {
            return (page.top <= offset && offset < page.bottom);
        })[0];
    },

    renderToDom: function(currentScroll) {
        var self = this;
        currentScroll = currentScroll || 0;
        this.currentPage = this.getPageAtOffset(currentScroll * OPTIONS.scrollStep).pageNumber;
        this.forEach(function(page) {
            page.renderToDom(self.currentPage);
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
        init: instance.init,
        disable: instance.disable,
        enable: instance.enable
    };
})();

})(jQuery, window, document);