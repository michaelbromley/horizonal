
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
            self.push(new Node(domNode, index));
        });
    },

    calculateNodePositionsAndPages: function(environment) {
        var viewportHeight = environment.viewportHeight;
        var lastPage = 1;
        var index;

        for (index = 0; index < this.length; index ++) {
            var node = this[index];
            var pageLowerBound = PAGE_OFFSETS[lastPage-1] === undefined ? 0 : PAGE_OFFSETS[lastPage-1];
            var pageUpperBound = pageLowerBound + viewportHeight;

            var nodeIsTallAndDoesNotFitOnPage = viewportHeight / 2 < node.layout.height && pageUpperBound < node.layout.bottom;
            if (nodeIsTallAndDoesNotFitOnPage) {
                if (!node.isClone) {
                    node.isTall = true;
                    var pageOverhang = node.layout.bottom - pageUpperBound;
                    var i = 1;
                    // As long as the node hangs over the edge of the page, we need to keep
                    // adding clones that will each appear on subsequent pages.
                    while(0 < pageOverhang) {
                        var cloneIndex = index + i;
                        var clone = node.makeClone(cloneIndex);
                        clone.pageOverhang = pageOverhang;
                        NODE_COLLECTION.splice(cloneIndex, 0 , clone);
                        pageOverhang = pageOverhang - viewportHeight;
                        i ++;
                    }
                }
            }
            calculateLastPageAndPageOffset(node);

            node.setPage(lastPage);
        }

        $.each(this, function(index, node) {
            node.setCssProperties();
        });

        var documentHeight = PAGE_OFFSETS[PAGE_OFFSETS.length - 1] + viewportHeight;
        $('body').height(documentHeight);
        if (!OPTIONS.displayScrollbar) {
            $('body').css('overflow-y', 'hidden');
        }

        /**
         * For a given node, we need to know what page it should be on, and whether it extends off the bottom
         * off the current page (lastPage). If so, we need to start a new page. Sorry about the complexity.
         * @param node
         */
        function calculateLastPageAndPageOffset(node) {
            if (PAGE_OFFSETS[lastPage] !== undefined) {
                if (PAGE_OFFSETS[lastPage] <= node.layout.bottom) {
                    var nodeDoesNotFitOnPage = pageUpperBound < node.layout.bottom;
                    if (!node.isTall) {
                        if (nodeDoesNotFitOnPage || node.isClone) {
                            lastPage ++;
                            if (viewportHeight < node.layout.height) {
                                PAGE_OFFSETS[lastPage] = pageUpperBound;
                                if (node.pageOverhang) {
                                    PAGE_OFFSETS[lastPage] += Math.min(node.pageOverhang, viewportHeight);
                                }
                            } else {
                                PAGE_OFFSETS[lastPage] = node.layout.bottom;
                            }
                        } else {
                            PAGE_OFFSETS[lastPage] = node.layout.bottom;
                        }
                    } else {
                        if (nodeDoesNotFitOnPage) {
                            PAGE_OFFSETS[lastPage] = pageUpperBound;
                        }
                    }
                }
            } else {
                PAGE_OFFSETS[lastPage] = node.layout.bottom;
            }
        }
    }

};

NodeCollection.prototype = [];
$.extend(NodeCollection.prototype, NodeCollectionAPI);
