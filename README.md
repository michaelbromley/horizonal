# Horizonal.js

Horizonal.js takes any static HTML document and transform it into a collection of discrete "pages". The
transitions between one page an the next can then be programmed via CSS transforms, CSS animations, JavaScript, or any combination of
these.

![What Horizonal.js Does](/demo/assets/how-it-works.png?raw=true)

## Demo

### [Check out Horizonal in action here](http://www.michaelbromley.co.uk/horizonal/demo/).

## Dependencies

Horizonal.js requires jQuery. Tested with 1.11.1 and 2.1.1. 2.x is recommended since it is smaller, and Horizonal uses ES5 features that make it incompatible with
older browsers (IE8 and lower), so there is no reason to use 1.x unless you already use it in your project.

## Installation

You can install Horizonal by:

* Using Bower: `bower install horizonal`. This will automatically pull in jQuery if you don't already have it.
* Download the [zip archive](https://github.com/michaelbromley/horizonal/blob/master/dist/horizonal.zip?raw=true) of the necessary files.
* Download the individual files: [`horizonal.min.js`](https://raw.githubusercontent.com/michaelbromley/horizonal/master/dist/horizonal.min.js)/[`horizonal.debug.js`](https://raw.githubusercontent.com/michaelbromley/horizonal/master/dist/horizonal.debug.js) (the former is minified, the latter not) and [`horizonal.css`](https://raw.githubusercontent.com/michaelbromley/horizonal/master/dist/horizonal.css)

## Setup

 1. Include Horizonal *after* jQuery in your document.
 2. Include the style rules from horizonal.css either by directly referencing the .css file, or copying the rules to
 your existing stylesheet.
 3. Initialize Horizonal by calling `horizonal.init()`. This should be done inside jQuery's `$(window).load()` method so that any
 images get loaded first. Pass a config object as the argument of the `init()` method (see below for available options).
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

One page, and all its child elements, will be displayed at a time. Horizonal includes scroll, keyboard and touch event handlers to
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

**For more information and examples of CSS-based transitions, see the [Writing CSS Transitions guide](https://github.com/michaelbromley/horizonal/wiki/Writing-CSS-Transitions).**

### JavaScript

Using the config object, you can specify a JavaScript callback which will be invoked on each page and/or page element whenever a page transition occurs:

```JavaScript
horizonal.init({
    onPageTransition: function(type, page, animator) {
        // Use whatever JavaScript you like to transform the node
    }
    onNodeTransition: function(type, node, animator) {
        // Use whatever JavaScript you like to transform the node
    }
});
```

The callback functions that you define will be passed the following arguments:

#### `type`
This is a string containing one of four values which indicate what type of transition this node is performing:

* `toForeground`
* `toBackground`
* `toFocusFromFore`
* `toFocusFromBack`

#### `page`
Passed to the `onPageTransition` callback only. This is an object representing the page which is affected by the transition (it is either moving into focus or out of focus,
according to the `type` value above). It has the following properties:

* `domNode [HTMLElement]` This is the actual [HTMLElement object](https://developer.mozilla.org/en/docs/Web/API/HTMLElement) of the page container div which contains the individual page elements.
* `pageNumber [int]` The ordinal number of this page.


#### `node`
Passed to the `onNodeTransition` callback only. This is an object representing an individual HTML element which is affected by the page transition (it is either moving into focus or out of focus,
according to the `type` value above). It has the following properties and methods:

* `domNode [HTMLElement]` This is the actual [HTMLElement object](https://developer.mozilla.org/en/docs/Web/API/HTMLElement) of the particular element in question.
* `index [int]` This is the index of this element relative to the entire document.
* `staggerOrder [int]` This a number representing the sequence in which this element appears if there is a staggerDelay applied in the config.
* `restore() [function]` This method will restore any inline style which has been applied to this element. Basically a helper method to easily reset the element's state if
you have done some manipulations that need to be undone at the end of the transition.

#### `animator`
This is a helper object which provides a simple API for writing efficient JavaScript animations. It allows you to specify animation functions without worrying about managing
an animation loop. It has two methods:

* `start([function])`
* `stop([function])`

**For instructions on how to use the animator API, as well as examples of putting all the above elements together,
please see the [Writing JavaScript Transitions guide](https://github.com/michaelbromley/horizonal/wiki/Writing-JavaScript-Transitions).**

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
    onNodeTransition: noop,
    onPageTransition: noop
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
| onPageTransition|function | Specify a callback that will be invoked for each affected page whenever a transition occurs. Used to define JavaScript-based transitions.

## Controls

Paging forward and backward through the collection can be controlled by the following methods:

1. Scrolling via mouse wheel or by using the browser's scroll bar (unless the scroll bar is disabled in the config options)
2. Keyboard arrow keys: &darr; or &rarr; page forward; &uarr; or &larr; page backward.
3. For touch enabled devices, swiping up or left pages forward; swiping down or right pages backward.

You can of course program your own controls by using the built-in API methods listed above.

## Browser Compatibility

Horizonal uses some ES5 features which means it will not work on IE8 or below.

I have tested it in the latest versions of Chrome (36), Firefox (31) and IE (11) in Windows and IE10 on Windows Phone 8.

CSS transforms are not yet mature and as a result, support and behaviour across browsers can be unreliable. Typically, writing a
theme will involve a lot of testing in different browsers and making tweaks to get around various quirks.

IE in particular seems to have problems with CSS 3D transforms that use the z-axis. Expect unexpected results here.

Since I don't have a Mac or an iPhone, I've not been able to do much testing on those. Bug reports welcome!

## Contribution

This is an experimental project and has much scope for refinement. Pull requests are welcome.

If you write a cool theme that you think should be included on the demo page, send in a pull requests and ideally include a
link to a working demo (use the [Horizonal playground](http://plnkr.co/edit/OxlWVuxXwEf2bhDAss9p?p=info) on Plunker).

## Licence

Horizonal.js is made available under the MIT licence.
