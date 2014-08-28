/**
 * This is the main method that converts the document to a collection of pages. Since this method can be slow (depending
 * on the number of DOM elements in the document), it runs async and returns a promise.
 * @param currentScroll
 */
function composePage(currentScroll) {

    var deferred = new $.Deferred();
    ROOT = $(OPTIONS.rootElement);
    var fragment = createDocumentFragment();
    CONTAINER = $(fragment.querySelector('#hrz-container'));
    CONTAINER.css({
        'display': 'none', // setting display:none considerably speeds up rendering
        'top': 0,
        'left': 0
    });
    VIEWPORT_HEIGHT = $(window).height() - OPTIONS.pageMargin * 2;

    displayLoadingIndicator().then(function() {
        // a setTimeout is used to force async execution and allow the loadingIndicator to display before the
        // heavy computations of composePage() are begun.
        setTimeout(function() {
            var allNodes = new NodeCollection(OPTIONS.selector);

            PAGE_COLLECTION = pageCollectionGenerator.fromNodeCollection(allNodes);
            PAGE_COLLECTION.appendToDom(currentScroll);

            // remove any DOM nodes that are not included in the selector,
            // since they will just be left floating around in the wrong place.
            CONTAINER.children().not('.hrz-page').filter(':visible').remove();
            ROOT.empty().append(fragment);

            // add the theme's custom CSS to the document now so that it can be
            // used in calculating the elements' styles.
            addCustomCssToDocument();

            PAGE_COLLECTION.forEach(function(page) {
                page.nodes.forEach(function(node) {
                   node.renderStyles(page);
                });
            });

            CONTAINER.css('display', '');

            var documentHeight = PAGE_COLLECTION.last().bottom / OPTIONS.scrollbarShortenRatio + VIEWPORT_HEIGHT;
            ROOT.height(documentHeight);
            if (!OPTIONS.displayScrollbar) {
                $('body').css('overflow-y', 'hidden');
            }
            renderPageCount();
            removeLoadingIndicator();
            deferred.resolve();
        }, 0);
    });

    return deferred.promise();
}

/**
 * Add the CSS text loaded by loadCustomCss() into the document head.
 */
function addCustomCssToDocument() {
    var $customCssElement = $('#hrz-custom-css');
    if (0 < $customCssElement.length) {
        $customCssElement.text(CUSTOM_CSS);
    } else {
        $('head').append('<style id="hrz-custom-css" type="text/css">' + CUSTOM_CSS + '</style>');
    }
}

/**
 * Building up a documentFragment and then appending it all at once to the DOM
 * is done to improve performance.
 * @returns {*}
 */
function createDocumentFragment() {
    var fragment = document.createDocumentFragment();
    var containerDiv = document.createElement('div');
    containerDiv.id = 'hrz-container';
    fragment.appendChild(containerDiv);
    return fragment;
}

function displayLoadingIndicator() {
    var deferred = new $.Deferred();
    if ($('.hrz-loading-indicator').length === 0) {
        $('body').append('<div class="hrz-loading-indicator" style="display:none;"><p class="hrz-loading-indicator">Loading...</p></div>');
        $('div.hrz-loading-indicator').fadeIn(50, function() {
            deferred.resolve();
        });
    }
    return deferred.promise();
}

function removeLoadingIndicator() {
    setTimeout(function() {
        $('div.hrz-loading-indicator').fadeOut(50, function() {
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