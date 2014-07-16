function Page(pageNumber) {
    this.top = 0;
    this.bottom = 0;
    this.height = 0;
    this.nodes = new NodeCollection();
    this.pageNumber = pageNumber || 0;
    this.domNode = null;
    this.hideTimer = null;

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
            zClass = "hrz-back hrz-hidden";
        } else if (currentPage < this.pageNumber) {
            zClass = "hrz-fore hrz-hidden";
        }
        CONTAINER.append('<div class="hrz-page ' + zClass + '" id="' + this.pageId + '" />');
        this.domNode = $('#' + this.pageId)[0];
        this.nodes.renderToDom(this);
    },

    moveToForeground: function() {
        $(this.domNode).removeClass('hrz-back').addClass('hrz-fore');
        this.hideAfterDelay();
        this.nodes.forEach(function(node) {
            node.moveToForeground();
        });
    },

    moveToBackground: function() {
        $(this.domNode).removeClass('hrz-fore').addClass('hrz-back');
        this.hideAfterDelay();
        this.nodes.forEach(function(node) {
            node.moveToBackground();
        });
    },

    moveToFocus: function() {
        $(this.domNode).removeClass('hrz-fore hrz-back hrz-hidden');
        if (this.hideTimer !== null) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
        this.nodes.forEach(function(node) {
            node.moveToFocus();
        });
    },

    hideAfterDelay: function() {
        var $thisNode = $(this.domNode);
        this.hideTimer = setTimeout( function() {
            $thisNode.addClass('hrz-hidden');
        }, OPTIONS.pageHideDelay * 1000);
    }
};