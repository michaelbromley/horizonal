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

    appendToDom: function(currentPage) {
        var zClass = "";
        if (this.pageNumber < currentPage) {
            zClass = "hrz-back hrz-hidden";
        } else if (currentPage < this.pageNumber) {
            zClass = "hrz-fore hrz-hidden";
        } else {
            zClass = "hrz-focus-from-fore";
        }
        CONTAINER.append('<div class="hrz-page ' + zClass + '" id="' + this.pageId + '" />');
        this.domNode = CONTAINER.find('#' + this.pageId)[0];
        this.nodes.appendToDom(this);
    },

    moveToForeground: function() {
        OPTIONS.onPageTransition('toForeground', this.getPublicObject(), animator);
        $(this.domNode).addClass('hrz-fore').removeClass('hrz-back hrz-focus-from-back hrz-focus-from-fore');
        this.hideAfterDelay();
        this.nodes.forEach(function(node) {
            node.moveTo('toForeground');
        });
    },

    moveToBackground: function() {
        OPTIONS.onPageTransition('toBackground', this.getPublicObject(), animator);
        $(this.domNode).addClass('hrz-back').removeClass('hrz-fore hrz-focus-from-back hrz-focus-from-fore');
        this.hideAfterDelay();
        this.nodes.forEach(function(node) {
            node.moveTo('toBackground');
        });
    },

    moveToFocusFromBackground: function() {
        OPTIONS.onPageTransition('toFocusFromBack', this.getPublicObject(), animator);
        $(this.domNode).addClass('hrz-focus-from-back');
        this._moveToFocus('toFocusFromBack');
    },

    moveToFocusFromForeground: function() {
        OPTIONS.onPageTransition('toFocusFromFore', this.getPublicObject(), animator);
        $(this.domNode).addClass('hrz-focus-from-fore');
        this._moveToFocus('toFocusFromFore');
    },

    _moveToFocus: function(type) {
        $(this.domNode).removeClass('hrz-fore hrz-back hrz-hidden');
        if (this.hideTimer !== null) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
        this.nodes.forEach(function(node) {
            node.moveTo(type);
        });
    },

    hideAfterDelay: function() {
        var $thisNode = $(this.domNode);
        this.hideTimer = setTimeout( function() {
            $thisNode.addClass('hrz-hidden');
        }, OPTIONS.pageHideDelay * 1000);
    },

    /**
     * Return an object containing a subset of properties of the private Page object, for use in
     * the javascript callbacks set up in the horizonal config object.
     *
     * @returns {{domNode: *, index: *, staggerOrder: *}}
     */
    getPublicObject: function() {
        return {
            domNode: this.domNode,
            pageNumber: this.pageNumber
        };
    }
};