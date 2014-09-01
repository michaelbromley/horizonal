var themes = themes || {};

themes["Hacker Console"] = {
    options: {
        customCssFile: 'themes/hacker-console.css',
        stagger: 'random',
        staggerDelay: 0,
        pageMargin: 50,
        selector: 'p,img,h1,h2,h3, h4, .h, .thumbnail, em, li',
        rootElement: '#root',
        onPageTransition: function(type, page) {

            if (type === 'toFocusFromFore' || type === 'toFocusFromBack') {
                page.domNode.style.opacity = 0;

                // make images green
                if (isIE()) {
                    $(page.domNode).find('img').replaceWith(svgReplace);
                    $(page.domNode).find('svg').hide();
                } else {
                    $(page.domNode).find('img').hide();
                }
                window.setTimeout(function() {
                    page.domNode.style.opacity = 1;
                }, 200);

                $(page.domNode).find('svg, img').each(function(idx, el) {
                    var delay = (Math.random() + 0.5) * 500;
                    window.setTimeout(function() {
                        $(el).fadeIn(100);
                    }, delay);
                });

                // add caret to all textual element while they are typing
                $('.caret').remove();
                $(page.domNode).find('p, h1, h2, h3, h4, li').each(function() {
                    var fontSize = $(this).css('font-size');
                    $(this).append('<span class="caret" style="height: ' + fontSize + '"></span>');
                });
                // after all typing completed, remove carets from all but last textual element
                window.setTimeout(function() {
                    $('.caret').slice(0, -1).remove();
                }, 1000);
            }

            /**
             * Internet Explorer can only apply SVG filters to an image if it is embedded within an SVG element.
             *
             * Concept and aspects of code borrowed from Karl Horky https://github.com/karlhorky/gray
             *
             * @returns {*|jQuery|HTMLElement}
             */
            function svgReplace() {
                var $img = $(this);
                var $svgElement = $('<svg xmlns="http://www.w3.org/2000/svg" class="svgroot hrz-element" viewBox="0 0 '+$img.width()+' '+$img.height()+'" width="'+$img.width()+'" height="'+$img.height()+'">' +
                    '<defs>' +
                    '<filter id="green">' +
                    '<feColorMatrix type="matrix" values="0 0 0 0 0, 2.8 6.6 0.5 0 -1.2, 0 0 0 0 0, 0 0 0 0.7 0" />' +
                    '</filter>' +
                    '</defs>' +
                    '<image filter="url(&quot;#green&quot;)" x="0" y="0" width="'+$img.width()+'" height="'+$img.height()+'" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="'+$img.attr('src')+'" />' +
                    '</svg>');
                $svgElement[0].style.cssText = $img[0].style.cssText;
                return $svgElement;
            }

            /**
             * Browser detection for IE.
             * @returns {boolean}
             */
            function isIE() {
                var ms_ie = false;
                var ua = window.navigator.userAgent;
                var old_ie = ua.indexOf('MSIE ');
                var new_ie = ua.indexOf('Trident/');

                if ((old_ie > -1) || (new_ie > -1)) {
                    ms_ie = true;
                }

                return ms_ie;
            }
        },
        onNodeTransition: function(type, node, animator) {
            var start, elapsed;
            var $node = $(node.domNode);


            if (type === 'toFocusFromFore' || type === 'toFocusFromBack') {
                typeIn(1000);
            }

            function typeIn(duration) {

                var textNodes = $node.find('*').addBack().filter(function() {
                    return containsText($(this));
                }).get().map(function(node) {
                    return {
                        $node: $(node),
                        childNodesTextValues: []
                    };
                });

                clearTextNodes(textNodes);

                animator.start(function(timestamp) {
                    if (typeof start === 'undefined') start = timestamp;
                    elapsed = timestamp - start;

                    var totalIterations = Math.round(duration / 1000 * 60);
                    var currentIteration = Math.round(elapsed / 1000 * 60);
                    typeTextNodesText(textNodes, currentIteration, totalIterations);

                    if (duration < elapsed) {
                        animator.stop(this);
                    }
                });
            }

            function clearTextNodes(textNodes) {
                textNodes.forEach(function(nodeObject) {
                    var nodeList = nodeObject.$node[0].childNodes;
                    for (var i = 0; i < nodeList.length; ++i) {
                        var childNode = nodeList[i];
                        if (childNode.nodeType === 3) {
                            nodeObject.childNodesTextValues.push(childNode.nodeValue);
                            childNode.nodeValue = '';
                        } else {
                            nodeObject.childNodesTextValues.push(null);
                        }
                    }
                });
            }

            function typeTextNodesText(textNodes, currentIteration, totalIterations) {
                textNodes.forEach(function(nodeObject) {
                    var nodeList = nodeObject.$node[0].childNodes;
                    for (var i = 0; i < nodeList.length; ++i) {
                        var childNode = nodeList[i];
                        if (childNode.nodeType === 3) {
                            var substringLength = Math.ceil(currentIteration / totalIterations * nodeObject.childNodesTextValues[i].length);
                            childNode.nodeValue = nodeObject.childNodesTextValues[i].substring(0, substringLength);
                        }
                    }
                });
            }

            function containsText(node) {
                return 0 < node.eq(0).contents().filter(function() {
                    return this.nodeType === 3 && 0 < this.nodeValue.trim().length;
                }).length;
            }
        }
    }
};