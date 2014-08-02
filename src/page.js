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

    Object.defineProperty(this, "midPoint", {
        get: function() {
            return (this.bottom + this.top) / 2 / OPTIONS.scrollbarShortenRatio;
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
        } else {
            zClass = "hrz-focus-from-fore";
        }
        CONTAINER.append('<div class="hrz-page ' + zClass + '" id="' + this.pageId + '" />');
        this.domNode = $('#' + this.pageId)[0];
        this.nodes.renderToDom(this);
    },

    moveToForeground: function() {
        $(this.domNode).addClass('hrz-fore').removeClass('hrz-back hrz-focus-from-back hrz-focus-from-fore');
        this.hideAfterDelay();
        this.nodes.forEach(function(node) {
            node.moveToForeground();
        });
    },

    moveToBackground: function() {
        $(this.domNode).addClass('hrz-back').removeClass('hrz-fore hrz-focus-from-back hrz-focus-from-fore');
        this.hideAfterDelay();
        this.nodes.forEach(function(node) {
            node.moveToBackground();
        });
    },

    moveToFocusFromBackground: function() {
        $(this.domNode).addClass('hrz-focus-from-back');
        this.moveToFocus();
    },

    moveToFocusFromForeground: function() {
        $(this.domNode).addClass('hrz-focus-from-fore');
        this.moveToFocus();
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