(function($, window, document) {
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
        onResize: noop,
        onNodeTransition: noop,
        onPageTransition: noop
    };

    function init(_OPTIONS) {
        var currentScroll = $(window).scrollTop();
        OPTIONS = $.extend( {}, defaults, _OPTIONS);

        addCustomCssToHead().then(function() {
            if (!_hasBeenInitialized) {
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
            if (window.location.hash !== '') {
                hashChangeHandler();
            }
        });

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
        enable: enable,
        disable: disable,
        goTo: goTo,
        next: next,
        previous: previous
    };
}

window.horizonal = new Horizonal();

function composePage(currentScroll) {
    ROOT = $(OPTIONS.rootElement);
    ROOT.wrapInner('<div id="hrz-container"></div>');
    CONTAINER = $('#hrz-container');
    CONTAINER.width(ROOT.width());
    VIEWPORT_HEIGHT =  $(window).height() - OPTIONS.pageMargin * 2;
    var allNodes = new NodeCollection(OPTIONS.selector);

    PAGE_COLLECTION = allNodes.splitIntoPages();
    PAGE_COLLECTION.renderToDom(currentScroll);
    // remove any DOM nodes that are not included in the selector,
    // since they will just be left floating around in the wrong place.
    CONTAINER.children().not('.hrz-page').filter(':visible').remove();

    var documentHeight = PAGE_COLLECTION.last().bottom / OPTIONS.scrollbarShortenRatio + VIEWPORT_HEIGHT;
    ROOT.height(documentHeight);
    if (!OPTIONS.displayScrollbar) {
        ROOT.css('overflow-y', 'hidden');
    }
    renderPageCount();
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
 * To ensure that we get the same results as the initial load, we simple purge the entire <body> element
 * and replace it with the clone that we made right at the start of the init() method.
 */
function resizeHandler() {
    var currentScroll = PAGE_COLLECTION.getCurrent().nodes[0].layout.top / OPTIONS.scrollbarShortenRatio;
    ROOT.replaceWith(ROOT_CLONE.clone());
    composePage(currentScroll);
    $(window).scrollTop(currentScroll);
    updatePageCount();
    OPTIONS.onResize();
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
        if (PAGE_COLLECTION.currentPage < PAGE_COLLECTION.length) {
            scrollTo = PAGE_COLLECTION.getNext().midPoint;
        }
    } else if (e.which === 38 || e.which === 37) {
        if (PAGE_COLLECTION.currentPage === 2) {
            scrollTo = 0;
        } else if (1 < PAGE_COLLECTION.currentPage) {
            scrollTo = PAGE_COLLECTION.getPrevious().midPoint;
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
    var currentPageNumber = PAGE_COLLECTION.currentPage;

    var newPageNumber = PAGE_COLLECTION.getPageAtOffset(scrollTop * OPTIONS.scrollbarShortenRatio).pageNumber;
    if (newPageNumber !== currentPageNumber) {
        PAGE_COLLECTION.showPage(newPageNumber);
        updatePageCount();
    }
}

function hashChangeHandler() {
    var hash = window.location.hash;
    if (hash !== "") {
        var page = $(hash).closest('.hrz-page');
        var pageNumber = parseInt(page.attr('id').replace(/^\D+/g, ''));
        PAGE_COLLECTION.showPage(pageNumber);
        $(window).scrollTop(PAGE_COLLECTION.getCurrent().midPoint);
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
     * Append the DOM node to the correct page div and apply the positioning and CSS style diff rules.
     * @param parentPage
     */
    renderToDom: function(parentPage) {
        $(this.domNode).addClass(parentPage.pageId);
        $('#' + parentPage.pageId).append(this.domNode);
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
            'position': 'fixed',
            'top' : this.layout.top - parentPage.top + pageMargin + 'px',
            'left' : this.layout.left + 'px',
            'width' : this.layout.width + 'px',
            'height' : this.layout.height + 'px'
        });
    },

    setTransitionDelay: function() {
        var stagger = this.getStaggerDelay();
        if (0 < stagger) {
            var cssProp = $(this.domNode).css.bind($(this.domNode));
            var transitionDurationIsDefined = existsAndIsNotZero(cssProp('transition-duration')) || existsAndIsNotZero(cssProp('-webkit-transition-duration'));
            var animationDurationIsDefined = existsAndIsNotZero(cssProp('animation-duration')) || existsAndIsNotZero(cssProp('-webkit-animation-duration'));
            if (transitionDurationIsDefined) {
                $(this.domNode).css({
                    'transition-delay': stagger + 's',
                    '-webkit-transition-delay': stagger + 's'
                });
            }
            if (animationDurationIsDefined) {
                $(this.domNode).css({
                    'animation-delay': stagger + 's',
                    '-webkit-animation-delay': stagger + 's'
                });
            }
        }

        function existsAndIsNotZero(property) {
            return typeof property !== 'undefined' && property !== '0s';
        }
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
       // $(this.domNode).removeClass('hrz-back').addClass('hrz-fore');
        OPTIONS.onNodeTransition('toForeground', this.getPublicObject());
    },

    moveToBackground: function() {
       // $(this.domNode).removeClass('hrz-fore').addClass('hrz-back');
        var self = this;
       /* setTimeout(function() {
        OPTIONS.onNodeTransition('toBackground', self.getPublicObject());
        }, this.getStaggerDelay() * 1000);*/
        OPTIONS.onNodeTransition('toBackground', self.getPublicObject());
    },

    moveToFocus: function() {
       // $(this.domNode).removeClass('hrz-fore hrz-back');
        OPTIONS.onNodeTransition('toFocus', this.getPublicObject());
    },

    /**
     * Store a copy of the final computed inline style so that the node
     * can be easily restored to the style it had after initialization.
     */
    setRestorePoint: function() {
        this.inlineStyle = $(this.domNode).attr('style');
    },

    /**
     * Restore the domNode to the style it had after initialization.
     * This method is intended as a convenient helper for those writing
     * JavaScript-based transitions.
     */
    restore: function() {
        $(this.domNode).attr('style', this.inlineStyle);
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
        var allNodes = $(selector).filter(':visible');

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

    splitIntoPages: function() {
        var lastPage = 1;
        var index;
        var pageCollection = new PageCollection();

        for (index = 0; index < this.length; index ++) {
            var node = this[index];
            var pageUpperBound = pageCollection.getLastOffset() + VIEWPORT_HEIGHT;

            var nodeIsTallAndDoesNotFitOnPage = this.isNodeTall(node, pageUpperBound);
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

    isNodeTall: function(node, pageUpperBound) {
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
    },

    /**
     * For a given node, we need to know what page it should be on, and whether it extends off the bottom
     * off the current page (lastPage). If so, we need to start a new page. Sorry about the complexity.
     * @param node
     * @param lastPage
     * @param pageCollection
     */
    calculateLastPageAndPageOffset: function(node, pageCollection, lastPage) {
        if ($(node.domNode).hasClass(OPTIONS.newPageClass)) {
            lastPage ++;
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
    },

    renderToDom: function(parentPage) {
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

    renderToDom: function(currentPage) {
        var zClass = "";
        if (this.pageNumber < currentPage) {
            zClass = "hrz-back hrz-hidden";
        } else if (currentPage < this.pageNumber) {
            zClass = "hrz-fore hrz-hidden";
        } else {
            zClass = "hrz-focus-from-fore";
        }
        CONTAINER.append('<div class="hrz-page ' + zClass + '" id="' + this.pageId + '" />');
        this.domNode = $('#' + this.pageId)[0];
        this.nodes.renderToDom(this);
    },

    moveToForeground: function() {
        $(this.domNode).removeClass('hrz-back hrz-focus-from-back hrz-focus-from-fore').addClass('hrz-fore');
        this.hideAfterDelay();
        this.nodes.forEach(function(node) {
            node.moveToForeground();
        });
    },

    moveToBackground: function() {
        $(this.domNode).removeClass('hrz-fore hrz-focus-from-back hrz-focus-from-fore').addClass('hrz-back');
        this.hideAfterDelay();
        this.nodes.forEach(function(node) {
            node.moveToBackground();
        });
    },

    moveToFocusFromBackground: function() {
        $(this.domNode).addClass('hrz-focus-from-back');
        this.moveToFocus();
    },

    moveToFocusFromForeground: function() {
        $(this.domNode).addClass('hrz-focus-from-fore');
        this.moveToFocus();
    },

    moveToFocus: function() {
        $(this.domNode).removeClass('hrz-fore hrz-back hrz-hidden');
        if (this.hideTimer !== null) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
        this.nodes.forEach(function(node) {
            node.moveToFocus();
        });
    },

    hideAfterDelay: function() {
        var $thisNode = $(this.domNode);
        this.hideTimer = setTimeout( function() {
            $thisNode.addClass('hrz-hidden');
        }, OPTIONS.pageHideDelay * 1000);
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

    renderToDom: function(currentScroll) {
        var self = this;
        currentScroll = currentScroll || 0;
        this.currentPage = this.getPageAtOffset(currentScroll * OPTIONS.scrollbarShortenRatio).pageNumber;
        this.forEach(function(page) {
            page.renderToDom(self.currentPage);
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
            this.getPage(newPageNumber).moveToFocus();
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