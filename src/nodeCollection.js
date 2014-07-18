
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
