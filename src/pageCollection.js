function PageCollection() {

    var _currentPage = 1;

    Object.defineProperty(this, "currentPage", {
        get: function() {
            return _currentPage;
        },
        set: function(val) {
            if (this.last() < val) {
                _currentPage = this.last();
            } else if (val < 1) {
                _currentPage = 1;
            } else {
                _currentPage = val;
            }
        }
    });
}

var PageCollectionAPI = {

    getPage: function(pageNumber) {
        if (0 < pageNumber && pageNumber <= this.length) {
            return this[pageNumber - 1];
        } else {
            return new Page();
        }
    },

    getCurrent: function() {
        return this.getPage(this.currentPage);
    },

    getNext: function() {
        return this.getPage(this.currentPage + 1);
    },

    getPrevious: function() {
        return this.getPage(this.currentPage - 1);
    },

    add: function() {
        var pageNumber = this.length + 1;
        var newPage = new Page(pageNumber);
        newPage.top = this.getPage(this.length).bottom;
        this.push(newPage);
    },

    last: function() {
        return this[this.length - 1];
    },

    getLastOffset: function() {
        if (this.length <= 1) {
            return 0;
        } else {
            return this.last().top;
        }
    },

    /**
     * Given a y-axis offset in pixels, return the page in the collection which contains this
     * offset between its top and bottom properties. If the offset is not valid, return the
     * first page.
     * @param offset
     */
    getPageAtOffset: function(offset) {
        return this.filter(function(page) {
            return (page.top <= offset && offset < page.bottom);
        })[0] || this[0];
    },

    /**
     * Appends all the pages and page elements to the documentFragment referenced by CONTAINER
     * @param currentScroll
     */
    appendToDom: function(currentScroll) {
        var self = this;
        currentScroll = currentScroll || 0;
        this.currentPage = this.getPageAtOffset(currentScroll * OPTIONS.scrollbarShortenRatio).pageNumber;
        this.forEach(function(page) {
            page.appendToDom(self.currentPage);
        });
    },

    /**
     * To show a given page, we just need to remove the -fore and -back CSS classes
     * from the page and the nodes on that page. Lower-ordered pages have the -fore
     * class added, and higher-ordered pages have the -back class added.
     *
     *
     * @param pageNumber
     */
    showPage: function(pageNumber) {
        var oldPageNumber = this.currentPage;
        this.currentPage = pageNumber;
        var newPageNumber = this.currentPage;

        if (oldPageNumber === 0) {
            this.getPage(newPageNumber)._moveToFocus();
        } else {
            var i;
            if (oldPageNumber < newPageNumber) {
                for (i = oldPageNumber; i < newPageNumber; i ++) {
                    this.getPage(i).moveToBackground();
                }
                this.getPage(newPageNumber).moveToFocusFromForeground();
            } else if (newPageNumber < oldPageNumber) {
                for (i = oldPageNumber; newPageNumber < i; i --) {
                    this.getPage(i).moveToForeground();
                }
                this.getPage(newPageNumber).moveToFocusFromBackground();
            }
        }
    }
};

PageCollection.prototype = [];
$.extend(PageCollection.prototype, PageCollectionAPI);