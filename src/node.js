function Node(domNode, index) {
    this.domNode = domNode;
    this.index = index;
    this.isClone = false;
    this.layout = this.getLayout();
    this.isTall = false;
    this.pageOverhang = 0;
    this.originalComputedStyle = this.cloneComputedStyle();
    this.staggerOrder = 0;
}

Node.prototype = {

    /**
     * In order to ensure a faithful visual reproduction of the original page, before we do anything with the DOM, we
     * need to store a copy of *all* of the computed CSS style rules that apply to this DOM node. We will use this
     * information at the final rendering step in order to perform a diff and inline any changed styles.
     * @returns {*}
     */
    cloneComputedStyle: function() {
        var computedStyle = window.getComputedStyle(this.domNode);
        return $.extend({}, computedStyle);
    },

    /**
     * Calculate the bounding box and absolute position of the node and return it as an object.
     * @returns {{top: number, left: number, bottom: number, width: number, height: number}}
     */
    getLayout: function() {
        var $node = $(this.domNode),
            left = $node.offset().left - ROOT.offset().left,
            top = $node.offset().top - ROOT.offset().top - parseInt($node.css('margin-top')),
            width = $node.width() + parseInt($node.css('padding-left')) + parseInt($node.css('padding-right')),
            height = $node.height() + parseInt($node.css('padding-top')) + parseInt($node.css('padding-bottom')),
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
     * Append the DOM node to the correct page div and apply the positioning and CSS style diff rules.
     * @param parentPage
     */
    renderToDom: function(parentPage) {
        $(this.domNode).addClass(parentPage.pageId);
        $('#' + parentPage.pageId).append(this.domNode);
        this.applyStyleDiff();
        var zClass = "";
        if (parentPage.pageNumber < PAGE_COLLECTION.currentPage) {
            zClass = "hrz-back";
        } else if (PAGE_COLLECTION.currentPage < parentPage.pageNumber) {
            zClass = "hrz-fore";
        }
        $(this.domNode).addClass('hrz-element ' + zClass);
        this.setCssPosition(parentPage);
        this.setTransitionDelay();
    },

    /**
     * Apply the style rules needed to make the
     * DOM node appear identical to the original form.
     * @param pageOffset
     */
    applyStyleDiff: function() {
        var styleDiff = this.getStyleDiff();
        $(this.domNode).css(styleDiff);
    },

    /**
     * Apply the absolute positioning to make the DOM node appear in
     * the correct place on the page.
     * @param parentPage
     */
    setCssPosition: function(parentPage) {
        var pageMargin = parentPage.pageNumber === 1 ? 0 : OPTIONS.pageMargin;
        $(this.domNode).css({
            'position': 'fixed',
            'top' : this.layout.top - parentPage.top + pageMargin + 'px',
            'left' : this.layout.left + 'px',
            'width' : this.layout.width + 'px',
            'height' : this.layout.height + 'px'
        });
    },

    setTransitionDelay: function() {
        var stagger = this.getStaggerDelay();
        var transition = window.getComputedStyle(this.domNode).transition;
        var webkitTransition = window.getComputedStyle(this.domNode)['-webkit-transition'];

        transition = replaceDelayValue(transition);
        webkitTransition = replaceDelayValue(webkitTransition);

        function replaceDelayValue(original) {
            if (typeof original !== 'undefined') {
                return original.replace(/(\S+\s)([0-9\.]+)s(,|$)/g, function(match, p1, p2, p3) {
                    var delay = parseInt(p2) + stagger;
                    return p1 + delay + 's' + p3;
                });
            } else {
                return "";
            }
        }

        $(this.domNode).css({
            'transition': transition,
            '-webkit-transition': webkitTransition
        });
    },

    /**
     * In order to make the final rendered DOM node appear identical to how it did on the original page,
     * we took a snapshot of all the computed CSS styles before making any changes to the page layout.
     * Now that we have removed the DOM node from the original place in the document, any cascaded
     * styles from parent divs will have been lost.
     *
     * This diff method gets the current computed CSS styles for the node, and compares them to the
     * snapshot we took with the cloneComputedStyle() method. If any of the style rules are not equal,
     * we add them to the styleDiff object so we can apply them inline to the DOM node.
     * @returns {{}}
     */
    getStyleDiff: function() {
        var styleDiff = {};
        var newComputedStyles = window.getComputedStyle(this.domNode);
        var self = this;
        $.each(newComputedStyles, function(index, property) {
            var camelCasedProperty = property.replace(/\-(\w)/g, function (strMatch, property){
                return property.toUpperCase();
            });
            if (newComputedStyles[property] != self.originalComputedStyle[camelCasedProperty]) {
                styleDiff[property] = self.originalComputedStyle[camelCasedProperty];
            }
        });
        return styleDiff;
    },

    getStaggerDelay: function() {
        var delay = OPTIONS.staggerDelay * this.staggerOrder;
        return Math.round(delay * 100) / 100;
    },

    moveToForeground: function() {
        $(this.domNode).removeClass('hrz-back').addClass('hrz-fore');
    },

    moveToBackground: function() {
        $(this.domNode).removeClass('hrz-fore').addClass('hrz-back');
    },

    moveToFocus: function() {
        $(this.domNode).removeClass('hrz-fore hrz-back');
    }
};

