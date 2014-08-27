
function NodeCollection(selector) {
    if (typeof selector !== 'undefined') {
        this.fromSelector(selector);
    }
}

var NodeCollectionAPI = {

    fromSelector: function(selector) {
        var self = this;
        var allNodes = ROOT.find(selector).filter(':visible').not('.hrz-loading-indicator');

        var topLevelNodes = $([]);
        allNodes.each(function(index, domNode) {
            if ($(domNode).parents(selector).length === 0) {
                topLevelNodes = topLevelNodes.add(domNode);
            }
        });

        topLevelNodes.each(function(index, domNode) {
            var node = new Node(domNode, index);
            self.push(node);
        });
    },

    appendToDom: function(parentPage) {
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
            node.appendToDom(parentPage);
        });
    }
};

NodeCollection.prototype = [];
$.extend(NodeCollection.prototype, NodeCollectionAPI);
