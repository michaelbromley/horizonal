/**
 * Created by Michael on 05/07/14.
 */

var horizonal = function($, window, document) {

    var $bodyClone,
        allNodes,
        currentPage,
        pageOffsets,
        options;

    var defaults = {
        selector: 'h1, h2, h3, h4, h5, h6, p, li, img, table',
        stagger: 'random',
        staggerDelay: 0.1,
        transitionSpeed: 1,
        customCssFile: false,
        displayScrollbar: true,
        pageMargin: 20
    };

    function init(_options) {
        options = $.extend( {}, defaults, _options);
        currentPage = 1;
        // make a copy of the entire body DOM so that we can re-calculate the layout later if needed (ie on re-size)
        $bodyClone = $('body').clone();
        allNodes = $(options.selector).filter(':visible');

        calculateNodePositionsAndPages(allNodes);
        addCustomCssToHead();
        showPage(currentPage);
        registerEventHandlers();
    }

    /**
     * Register the event handlers
     */
    function registerEventHandlers() {
        $(window).on('resize', debounce(resizeHandler, 250));
        $(window).on('keydown', keydownHandler);
        $(window).on('scroll', scrollHandler);
    }

    function calculateNodePositionsAndPages(allNodes) {
        var viewportHeight = $(window).height() - options.pageMargin * 2;
        var nodePageOrder = 0;
        var lastPage = 1;
        var $body = $('body');
        var index;

        pageOffsets = [0];
        $body.wrapInner('<div id="hrz-container"></div>');

        for (index = 0; index < allNodes.length; index ++) {
            var node = allNodes[index];
            node.hrz = node.hrz || {}; // this object will store all the customer properties used by horizonal
            var pageLowerBound = pageOffsets[lastPage-1] === undefined ? 0 : pageOffsets[lastPage-1];
            var pageUpperBound = pageLowerBound + viewportHeight;
            var nodeProperties = getNodeProperties(node);

            var nodeIsTallAndDoesNotFitOnPage = viewportHeight / 2 < nodeProperties.height && pageUpperBound < nodeProperties.bottom;
            if (nodeIsTallAndDoesNotFitOnPage) {
                if (node.hrz.isClone !== true) {
                    makeNodeClones(node, nodeProperties, allNodes, pageUpperBound);
                }
            }
            calculateLastPageAndPageOffset(node);

            $(node).addClass("hrz-page-" + lastPage);
            node.hrz.page = lastPage;
            node.hrz.pageOrder = nodePageOrder;
            nodePageOrder ++;

            node.hrz.cssPosition = {
                'top' : nodeProperties.top,
                'left' : nodeProperties.left,
                'width' : nodeProperties.width,
                'height' : nodeProperties.height
            };
        }

        // now that we know how many pages there will be, we can create the page container divs and put them in the
        // main container.
        $.each(pageOffsets, function(index) {
            if (index !== 0) {
                $('#hrz-container').prepend('<div class="hrz-page" id="hrz-page-' + index + '" />');
            }
        });

        allNodes.each(function(index, node) {
            var $node = $(node);
            var pos = node.hrz.cssPosition;
            var offsetTop = pageOffsets[node.hrz.page - 1];
            var delay = getStaggerDelay(node);
            var pageMargin = node.hrz.page === 1 ? 0 : options.pageMargin;
            $node.css({
                'position': 'fixed',
                'top' : pos.top - offsetTop + pageMargin + 'px',
                'left' : pos.left + 'px',
                'width' : pos.width + 'px',
                'height' : pos.height + 'px',
                'transition': 'transform ' + delay + 's, opacity ' + delay + 's',
                '-webkit-transition': '-webkit-transform ' + delay + 's, opacity ' + delay + 's'
            });
            // append this node to its respective page
            $('#hrz-page-' + node.hrz.page).append($node);
        });

        allNodes.addClass('hrz-element hrz-fore');

        var documentHeight = pageOffsets[pageOffsets.length - 1] + viewportHeight;
        $body.height(documentHeight);
        if (!options.displayScrollbar) {
            $body.css('overflow-y', 'hidden');
        }

        // remove any DOM nodes that are not included in the selector, since they will just be left
        // floating around in the wrong place
        $('#hrz-container > *').not('.hrz-page').filter(':visible').remove();


        /*
         Helper functions for calculateNodePositionsAndPages(). They have been refactored out in this way
         primarily for reasons of readability. They make use of certain variables local to the outer function,
         such as lastPage, viewportHeight, and index.
         */

        /**
         * When a node is over half the height of the viewport, and also extends off the bottom of a given page,
         * we need to clone it and put the clone on the next page, to give the impression that the node is spanning
         * two (or more) pages. Depending on the height of the node, it will be cloned however many times are
         * required to allow the entire node to be displayed over successive pages.
         * @param node
         * @param nodeProperties
         * @param allNodes
         * @param pageUpperBound
         */
        function makeNodeClones(node, nodeProperties, allNodes, pageUpperBound) {
            nodeProperties.isTall = true;

            var pageOverhang = nodeProperties.bottom - pageUpperBound;
            var i = 1;
            // As long as the node hangs over the edge of the page, we need to keep
            // adding clones that will each appear on subsequent pages.
            while(0 < pageOverhang) {
                var clone = $(node).clone()[0];
                $(clone).attr('data-is-clone', true);
                allNodes.splice(index + i, 0 , clone);
                clone.hrz = {};
                clone.hrz.cssPosition = {
                    'top' : nodeProperties.top,
                    'left' : nodeProperties.left,
                    'width' : nodeProperties.width,
                    'height' : nodeProperties.height
                };
                clone.hrz.isClone = true;
                clone.hrz.pageOverhang = pageOverhang;

                pageOverhang = pageOverhang - viewportHeight;
                i ++;
            }
        }

        /**
         * Calculate the bounding box of the node and return it as an object. The isTall property is used to
         * signal that this node is over 1/2 the height of the current viewport height.
         * @param node
         * @returns {{top: *, left: *, bottom: *, width: *, height: *, isTall: boolean}}
         */
        function getNodeProperties(node) {
            var $node = $(node),
                left = node.hrz.cssPosition ? node.hrz.cssPosition.left : $node.offset().left,
                top = node.hrz.cssPosition ? node.hrz.cssPosition.top : $node.offset().top - parseInt($node.css('margin-top')),
                width = node.hrz.cssPosition ? node.hrz.cssPosition.width : $node.width(),
                height = node.hrz.cssPosition ? node.hrz.cssPosition.height : $node.height(),
                bottom = top + height;

            return {
                top: top,
                left: left,
                bottom: bottom,
                width: width,
                height: height,
                isTall: false
            };
        }

        /**
         * For a given node, we need to know what page it should be on, and whether it extends off the bottom
         * off the current page (lastPage). If so, we need to start a new page. Sorry about the complexity.
         * @param node
         */
        function calculateLastPageAndPageOffset(node) {
            if (pageOffsets[lastPage] !== undefined) {
                if (pageOffsets[lastPage] <= nodeProperties.bottom) {
                    var nodeDoesNotFitOnPage = pageUpperBound < nodeProperties.bottom;
                    if (!nodeProperties.isTall) {
                        if (nodeDoesNotFitOnPage || node.hrz.isClone) {
                            lastPage ++;
                            if (viewportHeight < nodeProperties.height) {
                                pageOffsets[lastPage] = pageUpperBound;
                                if (node.hrz.pageOverhang) {
                                    pageOffsets[lastPage] += Math.min(node.hrz.pageOverhang, viewportHeight);
                                }
                            } else {
                                pageOffsets[lastPage] = nodeProperties.bottom;
                            }
                            nodePageOrder = 0;
                        } else {
                            pageOffsets[lastPage] = nodeProperties.bottom;
                        }
                    } else {
                        if (nodeDoesNotFitOnPage) {
                            pageOffsets[lastPage] = pageUpperBound;
                        }
                    }
                }
            } else {
                pageOffsets[lastPage] = nodeProperties.bottom;
            }
        }
    }

    function getStaggerDelay(node) {
        var delay;
        if (options.stagger === 'random') {
            delay = Math.random() *  0.5 + 0.7 ;
        } else if (options.stagger === 'sequence') {
            delay = Math.log(node.hrz.pageOrder + 2);
        } else {
            delay = 1;
        }
        return delay / options.transitionSpeed;
    }

    /**
     * To show a given page, we just need to remove the -fore and -back CSS classes
     * from the page and the nodes on that page. Lower-ordered pages have the -fore
     * class added, and higher-ordered pages have the -back class added.
     *
     * @param pageNumber
     */
    function showPage(pageNumber) {
        var totalPages = pageOffsets.length - 1;
        for (var i = 1; i <= totalPages; i++) {
            if (i < pageNumber) {
                $('#hrz-page-' + i).addClass('hrz-back');
            } else if (pageNumber < i) {
                $('#hrz-page-' + i).addClass('hrz-fore');
            } else {
                $('#hrz-page-' + i).removeClass('hrz-fore hrz-back');
            }
        }
        allNodes.each(function(index, node) {
            if (node.hrz.page < pageNumber) {
                $(node).addClass('hrz-back');
            } else if (pageNumber < node.hrz.page) {
                $(node).addClass('hrz-fore');
            } else {
                $(node).removeClass('hrz-fore hrz-back');
            }
        });
    }

    function addCustomCssToHead() {
        var $customCssElement;
        if (options.customCssFile) {
            $customCssElement = $('#hrz-custom-css');
            if (0 < $customCssElement.length) {
                $customCssElement.attr('href', options.customCssFile);
            } else {
                $('head').append('<link rel="stylesheet" id="hrz-custom-css" href="' + options.customCssFile + '" type="text/css" />');
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
        $('body').replaceWith($bodyClone.clone());
        allNodes = $(options.selector).filter(':visible');
        calculateNodePositionsAndPages(allNodes);
        showPage(currentPage);
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
        var lastPage = pageOffsets.length - 1;
        if (e.which === 40 || e.which === 39) {
            if (currentPage !== lastPage) {
                scrollTo = pageOffsets[currentPage] + 10;
            }
        } else if (e.which === 38 || e.which === 37) {
            if (currentPage === 1) {
                scrollTo = pageOffsets[currentPage - 1];
            } else {
                scrollTo = pageOffsets[currentPage - 2];
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
        var lowerBound = currentPage === 0 ? 0 : pageOffsets[currentPage - 1];
        var upperBound = pageOffsets[currentPage];

        if (scrollTop < lowerBound) {
            currentPage --;
            showPage(currentPage);
        } else if (upperBound < scrollTop) {
            currentPage ++;
            showPage(currentPage);
        }
    }


    /**
     * Public API
     */
    return {
        init: init
    };

}(jQuery, window, document);