# Horizonal.js

Horizonal.js takes any static HTML document and transform it into a collection of discrete "pages". The
transitions between one page an the next can then be programmed via CSS transforms, CSS animations, JavaScript, or any combination of
these.

## Demo

### [Check out Horizonal in action here](http://www.michaelbromley.co.uk/horizonal/demo/).

## Dependencies

Horizonal.js requires jQuery. Tested with jQuery 2.x, but should work with 1.8+.

## Installation

 1. Download `horizonal.min.js` and include it in your document *after* jQuery.
 2. Include the style rules from horizonal.css either by directly referencing the .css file, or copying the rules to
 your existing stylesheet.
 3. Initialize Horizonal by calling `horizonal.init()`. Ideally this should be done in jQuery's `$(window).load()` method so that any
 images get loaded first. Optionally pass a config object as the argument of the `init()` method (see below for available options).
 4. Create transitions by defining CSS style rules in your stylesheet and/or a JavaScript callback in the config object (see below for
 example of these).

## Creating Transitions: The Basics

When Horizonal converts the document into a page collection, the DOM structure will be transformed into the following pattern:

```
container
     |
     |----> Page
     |       |---> element
     |       |---> element
     |       |---> element
     |       |---> ...
     |----> Page
     |       |---> element
     |       |---> element
     |       |---> ...
     |----> Page
     |       |---> element
     |       |---> element
     |       |---> element
     |       |---> ...
     |----> ...
```

One page, and all its child element, will be displayed at a time. Horizonal includes scroll, keyboard and touch event handlers to
allow intuitive paging through the collection. It also enables programmable transitions from one page to the next via two methods: CSS and JavaScript.

### CSS

When a page collection is created, each page in the collection is in one of four states, each defined by a CSS class:

* `.hrz-fore`: The page is in the "foreground" - it has not been viewed yet. If we are on page 1, page 2, 3, etc. will all be in the foreground.
* `.hrz-back`: The page is in the "background" - it has been viewed. If we are on page 3, pages 1 and 2 will be in the background.
* `.hrz-focus-from-fore`: The page has come into "focus", having previously been in the foreground.
* `.hrz-focus-from-back`: The page has come into "focus", having previously been in the background.

As we page though the collection, these classes will be added and removed from the pages. We can therefore target either the page itself, or each
individual element on the page by defining CSS rules:

```CSS
/* Add a simple fade effect from one page to the next */
.hrz-page {
    transition: opacity 1s;
    opacity: 1;
}

.hrz-page.hrz-fore {
    opacity: 0;
}

.hrz-page.hrz-back {
    opacity: 0;
}
```

For more information and examples of CSS-based transitions, see the advanced section later in this document.

### JavaScript

Using the config object, you can specify a JavaScript callback which will be invoked on each page element whenever a page transition occurs.

## API

The `horizonal` object has the following methods:

### `init([object] config)`
Must be called before any of the other methods. Gets everything going. Before this method is invoked, you have a regular HTML document. Afterwards, you have a Horizonal page collection.
Takes a config object that is described in detail in the next section.

### `disable()`
Once the `init()` method has been invoked, you can revert the document to its original state with this method.

### `enable()`
If `disable()` has been called, `enable()` will convert the document back into a Horizonal page collection.

### `goTo([string/number] target)`
If the target is a number, attempt to jump to that page. If target is a URL fragment (e.g. `#myFragment`) jump to the location of that ID.

### `next()`
Go to the next page.

### `previous()`
Go to the previous page.

## Config

The `horizonal.init()` method takes an optional config object as its argument. The available options and their defaults are listed below,
followed by an explanation of each.

```JavaScript
var defaults = {
    selector: 'h1, h2, h3, h4, h5, h6, p, li, img, table',
    staggerDelay: 0.1,
    stagger: 'random',
    customCssFile: false,
    displayScrollbar: true,
    scrollbarShortenRatio: 2,
    pageMargin: 20,
    displayPageCount: true,
    rootElement: 'body',
    newPageClass: 'hrz-start-new-page',
    pageHideDelay: 1,
    onResize: noop,
    onNodeTransition: noop
};
```

|Option          |Type      |Description                    |
| -------------- | -------- | ----------------------------- |
| selector       | string   | jQuery selector used to determine which elements of your document will be included in the processed pages. Can be any [valid jQuery selector string](http://api.jquery.com/category/selectors/).|
| staggerDelay   | number   | Set a time in seconds to delay the transition of each subsequent element on a page.
| stagger        | string   | If you specify a non-zero `staggerDelay`, you can specify whether the page's elements should appear in `sequence` or in a `random` order.
| customCssFile  | string   | You may specify an external .css file which contains the style definitions for your theme. This file will be loaded asynchronously when `init()` is called.
| displayScrollbar| boolean | Specify whether or not to display the scroll bar.
| scrollbarShortenRatio| number | If the scrollbar is enabled, there may be too much scrolling required to get from one page to the next. Increase the ratio to shorten the amount of scrolling needed to move from one page to the next.
| pageMargin     | number   | Margin height in pixels that will get added to the top and bottom of each page, preventing the content extending all the way to the upper or lower edge of the viewport.
| displayPageCount| boolean | Specify whether to display the page count.
| rootElement    | string   | If you do not wish to apply Horizonal to the entire BODY, for example if you have other page content you wish to remain unaffected (as in the demo page), specify a different element as the root via a jQuery selector string.
| newPageClass   | string   | You can force Horizonal to create a new page whenever it encounters a selected element that has this class.
| pageHideDelay  | number   | When a page more from focus into the fore-or background, it will be hidden (i.e. moved out of the viewport) after this number of seconds.
| onResize       | function | Specify a callback that will be invoked whenever the page is resized.
| onNodeTransition|function | Specify a callback that will be invoked for each individual DOM element whenever a page transition occurs. Used to define JavaScript-based transitions.

