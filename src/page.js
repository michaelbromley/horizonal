function Page(pageNumber) {
    this.top = 0;
    this.bottom = 0;
    this.height = 0;
    this.nodes = new NodeCollection();
    this.pageNumber = pageNumber || 0;
    this.domNode = null;

    Object.defineProperty(this, "pageId", {
        get: function() {
            return "hrz-page-" + this.pageNumber;
        }
    });
}

Page.prototype = {

    addNode: function(node) {
        this.nodes.push(node);
    },

    renderToDom: function(currentPage) {
        var zClass = "";
        if (this.pageNumber < currentPage) {
            zClass = "hrz-back";
        } else if (currentPage < this.pageNumber) {
            zClass = "hrz-fore";
        }
        CONTAINER.append('<div class="hrz-page ' + zClass + '" id="' + this.pageId + '" />');
        this.domNode = $('#' + this.pageId)[0];
        this.nodes.renderToDom(this);
    },

    moveToForeground: function() {
        $(this.domNode).addClass('hrz-fore');
        this.nodes.forEach(function(node) {
            node.moveToForeground();
        });
    },

    moveToBackground: function() {
        $(this.domNode).addClass('hrz-back');
        this.nodes.forEach(function(node) {
            node.moveToBackground();
        });
    },

    moveToFocus: function() {
        $(this.domNode).removeClass('hrz-fore hrz-back');
        this.nodes.forEach(function(node) {
            node.moveToFocus();
        });
    }
};