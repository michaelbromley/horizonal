/**
 * Created by Michael on 05/07/14.
 */

var horizonal = function($) {

    var PAGE_MARGIN = 20;
    var allNodes;
    var currentPage = 0;
    var lastPage = 0;
    var pageOffsets;

    function init(options) {
        var viewportHeight;
        var documentHeight;
        allNodes = $('body *:not(:has(*))');
        //var allNodes = $('body *');
        $('body').wrapInner('<div id="hrz-container"><div class="hrz-page"></div></div>');
        allNodes.addClass('hrz-element');

        pageOffsets = [];
        viewportHeight = $(window).height() - PAGE_MARGIN * 2;

        allNodes.each(function(index, node) {
            var nodePage;
            var $node = $(node);
            var left = $node.offset().left;
            var top = $node.offset().top - parseInt($node.css('margin-top'));
            var width = $node.width();
            var height = $node.height();
            var nodeBottom = top + height;

            if (pageOffsets[lastPage] !== undefined) {
                if (pageOffsets[lastPage] < nodeBottom) {
                    var pageLowerBound = pageOffsets[lastPage-1] === undefined ? 0 : pageOffsets[lastPage-1];
                    if ((pageLowerBound + viewportHeight) < nodeBottom) {
                        lastPage ++;
                    } else {
                        pageOffsets[lastPage] = nodeBottom;
                    }
                }
            } else {
                pageOffsets[lastPage] = nodeBottom;
            }
            $node.addClass("hrz-page-" + lastPage);
            node.hrzPage = lastPage;

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
            var offsetTop = node.hrzPage === 0 ? 0 : pageOffsets[node.hrzPage - 1];
            var delay = Math.random() *  0.5 + 0.7 ;
            var pageMargin = node.hrzPage === 0 ? 0 : PAGE_MARGIN;
            $node.css({
                'position': 'fixed',
                'top' : pos.top - offsetTop + pageMargin + 'px',
                'left' : pos.left + 'px',
                'width' : pos.width + 'px',
                'height' : pos.height + 'px',
                '-webkit-transition': '-webkit-transform ' + delay + 's, opacity 1s'
            });
        });

        documentHeight = pageOffsets[pageOffsets.length - 1] + viewportHeight;
        $("body").height(documentHeight);
        showPage(currentPage);
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

    return {
        init: init
    };

}(jQuery);