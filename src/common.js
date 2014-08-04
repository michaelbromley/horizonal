/**
 * This is the main method that converts the document to a collection of pages. Since this method can be slow (depending
 * on the number of DOM elements in the document), it runs async and returns a promise.
 * @param currentScroll
 */
function composePage(currentScroll) {
    var deferred = new $.Deferred();
    ROOT = $(OPTIONS.rootElement);
    ROOT.wrapInner('<div id="hrz-container"></div>');
    CONTAINER = $('#hrz-container');
    CONTAINER.width(ROOT.width());
    VIEWPORT_HEIGHT =  $(window).height() - OPTIONS.pageMargin * 2;

    displayLoadingIndicator().then(function() {
        // a setTimeout is used to force async execution and allow the loadingIndicator to display before the
        // heavy computations of composePage() are begun.
        setTimeout(function() {
            var allNodes = new NodeCollection(OPTIONS.selector);

            PAGE_COLLECTION = allNodes.splitIntoPages();
            PAGE_COLLECTION.renderToDom(currentScroll);
            // remove any DOM nodes that are not included in the selector,
            // since they will just be left floating around in the wrong place.
            CONTAINER.children().not('.hrz-page').filter(':visible').remove();

            var documentHeight = PAGE_COLLECTION.last().bottom / OPTIONS.scrollbarShortenRatio + VIEWPORT_HEIGHT;
            ROOT.height(documentHeight);
            if (!OPTIONS.displayScrollbar) {
                $('body').css('overflow-y', 'hidden');
            }
            renderPageCount();
            removeLoadingIndicator();
            deferred.resolve();
        }, 500);
    });

    return deferred.promise();
}

function displayLoadingIndicator() {
    var deferred = new $.Deferred();
    if ($('#loadingIndicator').length === 0) {
        $('body').append('<div id="loadingIndicator" style="display:none;"><p class="loading">Loading...</p></div>');
        $('#loadingIndicator').fadeIn(500, function() {
            deferred.resolve();
        });
    }
    return deferred.promise();
}

function removeLoadingIndicator() {
    setTimeout(function() {
        $('#loadingIndicator').fadeOut(500, function() {
            $(this).remove();
        });
    }, 300);
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

function removePageCount() {
    $('.hrz-page-count').remove();
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