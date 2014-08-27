/**
 * This object is responsible for taking a nodeCollection and splitting it up into the correct number of pages,
 * placing the correct nodes on each page.
 */
var pageCollectionGenerator = function() {
    var module = {};

    function fromNodeCollection(nodeCollection) {
        var lastPage = 1;
        var index;
        var pageCollection = new PageCollection();

        for (index = 0; index < nodeCollection.length; index ++) {
            var node = nodeCollection[index];
            var pageUpperBound = pageCollection.getLastOffset() + VIEWPORT_HEIGHT;

            var nodeIsTallAndDoesNotFitOnPage = isNodeTall(node, pageUpperBound);
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
                    nodeCollection.splice(cloneIndex, 0 , clone);
                    pageOverhang = pageOverhang - VIEWPORT_HEIGHT;
                    i ++;
                }
            }
            lastPage = calculateLastPageAndPageOffset(node, pageCollection, lastPage);

            var pageToAddTo;
            var nodeIsBottomMostElement = pageCollection.last().bottom === node.layout.bottom;
            if (nodeIsBottomMostElement || node.isClone || node.newPage) {
                pageToAddTo = lastPage;
            } else {
                pageToAddTo = pageCollection.getPageAtOffset(node.layout.top).pageNumber;
            }

            pageCollection.getPage(pageToAddTo).addNode(node);
        }

        return pageCollection;
    }

    function isNodeTall(node, pageUpperBound) {
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
    }

    /**
     * For a given node, we need to know what page it should be on, and whether it extends off the bottom
     * off the current page (lastPage). If so, we need to start a new page. Sorry about the complexity.
     * @param node
     * @param lastPage
     * @param pageCollection
     */
    function calculateLastPageAndPageOffset(node, pageCollection, lastPage) {
        if ($(node.domNode).hasClass(OPTIONS.newPageClass)) {
            lastPage ++;
            node.newPage = true;
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
    }

    module.fromNodeCollection = fromNodeCollection;
    return module;
}();