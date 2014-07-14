function Node(domNode, index) {
    this.domNode = domNode;
    this.index = index;
    this.isClone = false;
    this.layout = this.getLayout();
    this.isTall = false;
    this.pageOverhang = 0;
    $(this.domNode).addClass('hrz-element hrz-fore');
}

Node.prototype = {
    /**
     * Calculate the bounding box of the node and return it as an object. The isTall property is used to
     * signal that this node is over 1/2 the height of the current viewport height.
     * @param node
     * @returns {{top: number, left: number, bottom: number, width: number, height: number}}
     */
    getLayout: function() {
        var $node = $(this.domNode),
            left = $node.offset().left,
            top = $node.offset().top - parseInt($node.css('margin-top')),
            width = $node.width(),
            height = $node.height(),
            bottom = top + height;

        return {
            top: top,
            left: left,
            bottom: bottom,
            width: width,
            height: height
        };
    },

    /**
     * When a node is over half the height of the viewport, and also extends off the bottom of a given page,
     * we need to clone it and put the clone on the next page, to give the impression that the node is spanning
     * two (or more) pages. Depending on the height of the node, it will be cloned however many times are
     * required to allow the entire node to be displayed over successive pages.
     * @param index
     */
    makeClone: function(index) {
        var clonedDomNode = $(this.domNode).clone()[0];
        var clone = new Node(clonedDomNode, index);
        clone.layout = {
            'top' : this.layout.top,
            'left' : this.layout.left,
            'width' : this.layout.width,
            'height' : this.layout.height,
            'bottom' : this.layout.bottom
        };
        clone.isClone = true;

        return clone;
    },

    /**
     * Set which page this node should appear on.
     * @param parentPage
     */
    renderToDom: function(parentPage) {
        $(this.domNode).addClass(parentPage.pageId);
        $('#' + parentPage.pageId).append(this.domNode);
        this.setCssProperties(parentPage.top);
    },

    setCssProperties: function(pageOffset) {
        var delay = this.getStaggerDelay();
        var pageMargin = this.page === 1 ? 0 : OPTIONS.pageMargin;
        $(this.domNode).css({
            'position': 'fixed',
            'top' : this.layout.top - pageOffset + pageMargin + 'px',
            'left' : this.layout.left + 'px',
            'width' : this.layout.width + 'px',
            'height' : this.layout.height + 'px',
            'transition': 'transform ' + delay + 's, opacity ' + delay + 's',
            '-webkit-transition': '-webkit-transform ' + delay + 's, opacity ' + delay + 's'
        });
    },

    getStaggerDelay: function() {
        var delay;
        if (OPTIONS.stagger === 'random') {
            delay = Math.random() *  0.5 + 0.7 ;
        } else if (OPTIONS.stagger === 'sequence') {
            delay = Math.log(this.pageOrder + 2);
        } else {
            delay = 1;
        }
        return delay / OPTIONS.transitionSpeed;
    },

    moveToForeground: function() {
        $(this.domNode).addClass('hrz-fore');
    },

    moveToBackground: function() {
        $(this.domNode).addClass('hrz-back');
    },

    moveToFocus: function() {
        $(this.domNode).removeClass('hrz-fore hrz-back');
    }
};

