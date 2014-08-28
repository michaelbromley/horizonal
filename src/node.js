/**
 * A Node object represents a DOM element. An actual reference to the HTMLElement object is contained in the 'domNode' property.
 * @param domNode
 * @param index
 * @constructor
 */
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
        var computedStyleClone = document.createElement('div').style;
        var computedStyle = window.getComputedStyle(this.domNode);
        for (var i = 0; i < computedStyle.length; i++) {
            var name = computedStyle[i];
            computedStyleClone.setProperty(name,
                computedStyle.getPropertyValue(name),
                computedStyle.getPropertyPriority(name));
        }
        return computedStyleClone;
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
     * Append the DOM node to the correct page div
     * @param parentPage
     */
    appendToDom: function(parentPage) {
        $(this.domNode).addClass(parentPage.pageId);
        CONTAINER.find('#' + parentPage.pageId).append(this.domNode);
    },

    /**
     * Apply the CSS styles that ensure the node looks the same as it did in the
     * original document.
     * @param parentPage
     */
    renderStyles: function(parentPage) {
        this.applyStyleDiff();
        $(this.domNode).addClass('hrz-element');
        this.setCssPosition(parentPage);
        this.setTransitionDelay();
        this.setRestorePoint();
    },

    /**
     * Apply the style rules needed to make the
     * DOM node appear identical to the original form.
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
            'position': 'absolute',
            'top' : this.layout.top - parentPage.top + pageMargin + 'px',
            'left' : this.layout.left + 'px',
            'width' : this.layout.width + 'px',
            'height' : this.layout.height + 'px'
        });
    },

    /**
     * If the staggerDelay option is set, then we check to see if this node has either a CSS transition or CSS animation
     * style rule applied to it. If so, we dynamically set the transition-delay or animation-delay value to give the
     * stagger effect.
     */
    setTransitionDelay: function() {
        var stagger = this.getStaggerDelay();
        if (0 < stagger) {
            var css = $(this.domNode).css.bind($(this.domNode));
            var transitionDurationIsDefined = existsAndIsNotZero(css('transition-duration')) || existsAndIsNotZero(css('-webkit-transition-duration'));
            var animationDurationIsDefined = existsAndIsNotZero(css('animation-duration')) || existsAndIsNotZero(css('-webkit-animation-duration'));
            if (transitionDurationIsDefined) {
                css({
                    'transition-delay': stagger + 's',
                    '-webkit-transition-delay': stagger + 's'
                });
            }
            if (animationDurationIsDefined) {
                css({
                    'animation-delay': stagger + 's',
                    '-webkit-animation-delay': stagger + 's'
                });
            }
        }

        function existsAndIsNotZero(property) {
            return typeof property !== 'undefined' && property !== '0s';
        }
    },

    getStaggerDelay: function() {
        var delay = OPTIONS.staggerDelay * this.staggerOrder;
        return Math.round(delay * 100) / 100;
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

        for (var i = 0; i < newComputedStyles.length; i++) {
            var name = newComputedStyles[i];
            var oldPropertyValue = this.originalComputedStyle.getPropertyValue(name);

            if (newComputedStyles.getPropertyValue(name) != oldPropertyValue) {
                // Internet Explorer has strange behaviour with its own deprecated prefixed version of transition, animation and
                // others. This breaks these CSS features in that browser, so the workaround here is to just omit all those
                // IE-specific prefixes.
                if ( name.substring(0, 3) == "-ms") {
                    continue;
                }
                if (oldPropertyValue !== null) {
                    styleDiff[newComputedStyles[i]] = oldPropertyValue;
                }
            }
        }

        return styleDiff;
    },

    /**
     * Trigger the onNodeTransition callback and pass this node and the type of transition:
     * - toForeground
     * - toBackground
     * - toFocusFromFore
     * - toFocusFromBack
     * @param type
     */
    moveTo: function(type) {
        var self = this;
        setTimeout(function() {
            OPTIONS.onNodeTransition(type, self.getPublicObject(), animator);
        }, this.getStaggerDelay() * 1000);
    },

    /**
     * Store a copy of the final computed inline style so that the node
     * can be easily restored to the style it had after initialization.
     * The cloneNode() method is necessary as otherwise we will just
     * get a reference to the current style, which will change as the
     * current style changes.
     */
    setRestorePoint: function() {
        this.inlineStyle = this.domNode.cloneNode().style;
    },

    /**
     * Restore the domNode to the style it had after initialization.
     * This method is intended as a convenient helper for those writing
     * JavaScript-based transitions.
     */
    restore: function() {
        var name, i;
        // first we need to delete all the style rules
        // currently defined on the element
        for (i = this.domNode.style.length; i >= 0; i--) {
            name = this.domNode.style[i];
            this.domNode.style.removeProperty(name);
        }
        // now we loop through the original CSSStyleDeclaration
        // object and set each property to its original value
        for (i = this.inlineStyle.length; i >= 0; i--) {
            name = this.inlineStyle[i];
            this.domNode.style.setProperty(name,
                this.inlineStyle.getPropertyValue(name),
                priority = this.inlineStyle.getPropertyPriority(name));
        }
    },

    /**
     * Return an object containing a subset of properties of the private Node object, for use in
     * the javascript callbacks set up in the horizonal config object.
     *
     * @returns {{domNode: *, index: *, staggerOrder: *}}
     */
    getPublicObject: function() {
        return {
            domNode: this.domNode,
            index: this.index,
            staggerOrder: this.staggerOrder,
            restore: this.restore.bind(this)
        };
    }
};

