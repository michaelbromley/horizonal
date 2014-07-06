/**
 * Created by Michael on 05/07/14.
 */

var horizonal = function($, window, document) {

    var PAGE_MARGIN = 20,
        allNodes,
        currentPage,
        lastPage,
        pageOffsets,
        options;

    var defaults = {
        selector: 'body *:not(:has(*))',
        stagger: 'random',
        transitionSpeed: 1,
        perspective: 500
    };

    function init(_options) {
        var viewportHeight;
        var documentHeight;
        var nodePageOrder = 0;
        options = $.extend( {}, defaults, _options);
        pageOffsets = [0];
        lastPage = 1;
        currentPage = 1;
        allNodes = $(options.selector);

        // add a <style> block to the header which will contain custom CSS styles passed in by the options object
        $("head").append("<style type='text/css' id='hrz-custom-styles'></style>");

        // add wrapper divs to hold the page contents
        $('body').wrapInner('<div id="hrz-container"><div class="hrz-page"></div></div>');
        allNodes.addClass('hrz-element hrz-fore');

        viewportHeight = $(window).height() - PAGE_MARGIN * 2;

        allNodes.each(function(index, node) {
            var $node = $(node),
                left = $node.offset().left,
                top = $node.offset().top - parseInt($node.css('margin-top')),
                width = $node.width(),
                height = $node.height(),
                nodeBottom = top + height;

            if (pageOffsets[lastPage] !== undefined) {
                if (pageOffsets[lastPage] < nodeBottom) {
                    var pageLowerBound = pageOffsets[lastPage-1] === undefined ? 0 : pageOffsets[lastPage-1];
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
        });

        documentHeight = pageOffsets[pageOffsets.length - 1] + viewportHeight;
        $("body").height(documentHeight);
        addCustomCssToHead();
        showPage(currentPage);
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
        var customCss;
        if (options.perspective != defaults.perspective) {
            customCss = ".hrz-page {-webkit-perspective: " + options.perspective + "px; perspective: " + options.perspective + "px;}";
        }
        $('#hrz-custom-styles').html(customCss);
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
        var midpoint;
        if (e.which === 40 || e.which === 39) {
            if (currentPage !== lastPage) {
                $(window).scrollTop(pageOffsets[currentPage] + 10);
            }
        } else if (e.which === 38 || e.which === 37) {
            if (currentPage === 1) {
                $(window).scrollTop(pageOffsets[currentPage - 1]);
            } else {
                $(window).scrollTop(pageOffsets[currentPage - 2]);
            }
        }
    });

    return {
        init: init
    };

}(jQuery, window, document);