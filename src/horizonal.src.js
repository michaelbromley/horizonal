/**
 * Created by Michael on 05/07/14.
 */

var horizonal = function($, window, document) {

    var PAGE_MARGIN = 20,
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
        $bodyClone = $('body').clone(); // make a copy of the entire body DOM so that we can re-calculate the layout later
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

        // add wrapper divs to hold the page contents
        $('body').wrapInner('<div id="hrz-container"></div>');

        allNodes.each(function(index, node) {
            var pageLowerBound;
            var $node = $(node),
                left = $node.offset().left,
                top = $node.offset().top - parseInt($node.css('margin-top')),
                width = $node.width(),
                height = $node.height(),
                nodeBottom = top + height;

            if (pageOffsets[lastPage] !== undefined) {
                if (pageOffsets[lastPage] < nodeBottom) {
                    pageLowerBound = pageOffsets[lastPage-1] === undefined ? 0 : pageOffsets[lastPage-1];
                    if ((pageLowerBound + viewportHeight) < nodeBottom) {
                        lastPage ++;
                        nodePageOrder = 0;
                    } else {
                        pageOffsets[lastPage] = nodeBottom;
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
        });

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
        $("body").height(documentHeight);
        if (!options.displayScrollbar) {
            $("body").css('overflow-y', 'hidden');
        }
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

    function showPage(page) {
        for (var i = 1; i <= lastPage; i++) {
            if (i < page) {
                $('#hrz-page-' + i).addClass('hrz-back');
            } else if (page < i) {
                $('#hrz-page-' + i).addClass('hrz-fore');
            } else {
                $('#hrz-page-' + i).removeClass('hrz-fore hrz-back');
            }
        }
        allNodes.each(function(index, node) {
            if (node.hrzPage < page) {
                $(node).addClass('hrz-back');
            } else if (page < node.hrzPage) {
                $(node).addClass('hrz-fore');
            } else {
                $(node).removeClass('hrz-fore hrz-back');
            }
        });
    }

    function addCustomCssToHead() {
        if (options.customCssFile) {
            if (0 < $('#hrz-custom-css').length) {
                $('#hrz-custom-css').attr('href', options.customCssFile);
            } else {
                $('head').append('<link rel="stylesheet" id="hrz-custom-css" href="' + options.customCssFile + '" type="text/css" />');
            }
        }
    }

    $(window).on('resize', debounce(resize, 500));

    /**
     * When the window is resized, we need to re-calculate the layout of the elements.
     */
    function resize() {
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

    $(window).on('scroll', function() {
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
    });

    $(window).on('keydown', function(e) {
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
    });

    return {
        init: init
    };

}(jQuery, window, document);