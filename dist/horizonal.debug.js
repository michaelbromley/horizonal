/**
 * Created by Michael on 05/07/14.
 */

var horizonal = function($, window, document) {

    var PAGE_MARGIN = 0,
        $bodyClone,
        allNodes,
        currentPage,
        lastPage,
        pageOffsets,
        options;

    var defaults = {
        selector: 'body *:not(:has(*))',
        stagger: 'random',
        transitionSpeed: 1,
        customCssFile: false,
        displayScrollbar: true
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
    }

    function calculateNodePositionsAndPages(allNodes) {
        var documentHeight,
            viewportHeight,
            nodePageOrder = 0;

        viewportHeight = $(window).height() - PAGE_MARGIN * 2;
        pageOffsets = [0];
        lastPage = 1;

        // add wrapper div to hold the page contents
        $('body').wrapInner('<div id="hrz-container"></div>');

        var allNodesLength = allNodes.length;
        for (var index = 0; index < allNodesLength; index ++) {
            var node = allNodes[index];
            var pageLowerBound = pageOffsets[lastPage-1] === undefined ? 0 : pageOffsets[lastPage-1];
            var pageUpperBound = pageLowerBound + viewportHeight;
            var $node = $(node),
                left = node.hrzCssPosition ? node.hrzCssPosition.left : $node.offset().left,
                top = node.hrzCssPosition ? node.hrzCssPosition.top : $node.offset().top - parseInt($node.css('margin-top')),
                width = node.hrzCssPosition ? node.hrzCssPosition.width : $node.width(),
                height = node.hrzCssPosition ? node.hrzCssPosition.height : $node.height(),
                isTall = false;
            if (node.hrzOverhang) {
                //top -= node.hrzOverhang;
            }
            var nodeBottom = top + height;

            // if the element is more than half the height of the viewport, we should make it span pages to avoid
            // large areas of white space. To do this we need to clone the node and have it appear on both this page
            // and the clone on the next, with the clone being offset on the y axis so that we only see the lower half.
            if (viewportHeight / 2 < height && pageUpperBound < nodeBottom) {
                if (node.hrzIsClone !== true) {
                    isTall = true;

                    var overhang = nodeBottom - pageUpperBound;
                    var i = 1;
                    while(0 < overhang) {
                        var clone = $node.clone()[0];
                        $(clone).attr('data-is-clone', true);
                        allNodes.splice(index + i, 0 , clone);
                        allNodesLength ++;
                        clone.hrzCssPosition = {
                            'top' : top,
                            'left' : left,
                            'width' : width,
                            'height' : height
                        };
                        clone.hrzIsClone = true;
                        clone.hrzOverhang = overhang;

                        overhang = overhang - viewportHeight;
                        i ++;
                    }
                }
            }

            if (pageOffsets[lastPage] !== undefined) {
                if (pageOffsets[lastPage] <= nodeBottom) {
                    //pageLowerBound = pageOffsets[lastPage-1] === undefined ? 0 : pageOffsets[lastPage-1];
                    var nodeDoesNotFitOnPage = (pageLowerBound + viewportHeight) < nodeBottom;
                    if (!isTall) {
                        if (nodeDoesNotFitOnPage || node.hrzIsClone) {
                            lastPage ++;
                            if (viewportHeight < height) {
                                pageOffsets[lastPage] = pageLowerBound + viewportHeight;
                                if (node.hrzOverhang) {
                                    pageOffsets[lastPage] += Math.min(node.hrzOverhang, viewportHeight);
                                }
                            } else {
                                pageOffsets[lastPage] = nodeBottom;
                            }
                            nodePageOrder = 0;
                        } else {
                            pageOffsets[lastPage] = nodeBottom;
                        }
                    } else {
                        if (nodeDoesNotFitOnPage) {
                            pageOffsets[lastPage] = pageLowerBound + viewportHeight;
                        }
                    }
                }
            } else {
                pageOffsets[lastPage] = nodeBottom;
            }
            $node.addClass("hrz-page-" + lastPage);
            node.hrzPage = lastPage;
            node.pageOrder = nodePageOrder;
            nodePageOrder ++;

            node.hrzCssPosition = {
                'top' : top,
                'left' : left,
                'width' : width,
                'height' : height
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
            var pos = node.hrzCssPosition;
            var offsetTop = pageOffsets[node.hrzPage - 1];
            var delay = getStaggerDelay(node);
            var pageMargin = node.hrzPage === 1 ? 0 : PAGE_MARGIN;
            $node.css({
                'position': 'fixed',
                'top' : pos.top - offsetTop + pageMargin + 'px',
                'left' : pos.left + 'px',
                'width' : pos.width + 'px',
                'height' : pos.height + 'px',
                'transition': 'transform ' + delay + 's, opacity ' + delay + 's',
                '-webkit-transition': '-webkit-transform ' + delay + 's, opacity ' + delay + 's'
            });
            $('#hrz-page-' + node.hrzPage).append($node);
        });

        allNodes.addClass('hrz-element hrz-fore');

        documentHeight = pageOffsets[pageOffsets.length - 1] + viewportHeight;
        $('body').height(documentHeight);
        if (!options.displayScrollbar) {
            $("body").css('overflow-y', 'hidden');
        }

        // remove any DOM nodes that are not included in the selector, since they will just be left
        // floating around in the wrong place
        $('#hrz-container > *').not('.hrz-page').filter(':visible').remove();
    }

    function getStaggerDelay(node) {
        var delay;
        if (options.stagger === 'random') {
            delay = Math.random() *  0.5 + 0.7 ;
        } else if (options.stagger === 'sequence') {
            delay = Math.log(node.pageOrder + 2);
        } else {
            delay = 1;
        }
        return delay / options.transitionSpeed;
    }

    function showPage(pageNumber) {
        for (var i = 1; i <= lastPage; i++) {
            if (i < pageNumber) {
                $('#hrz-page-' + i).addClass('hrz-back');
            } else if (pageNumber < i) {
                $('#hrz-page-' + i).addClass('hrz-fore');
            } else {
                $('#hrz-page-' + i).removeClass('hrz-fore hrz-back');
            }
        }
        allNodes.each(function(index, node) {
            if (node.hrzPage < pageNumber) {
                $(node).addClass('hrz-back');
            } else if (pageNumber < node.hrzPage) {
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

    /**
     * Define the event handler functions
     */
    // When the window is re-sized, we need to re-calculate the layout of the elements.
    function resizeHandler() {
        $('body').replaceWith($bodyClone.clone());
        allNodes = $(options.selector).filter(':visible');
        calculateNodePositionsAndPages(allNodes);
        showPage(currentPage);
    }

    function debounce(fun, mil){
        var timer;
        return function(){
            clearTimeout(timer);
            timer = setTimeout(function(){
                fun();
            }, mil);
        };
    }

    function keydownHandler(e) {
        var scrollTo;
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
     * Register the event handlers
     */
    $(window).on('resize', debounce(resizeHandler, 500));
    $(window).on('keydown', keydownHandler);
    $(window).on('scroll', scrollHandler);

    /**
     * Public API
     */
    return {
        init: init
    };

}(jQuery, window, document);