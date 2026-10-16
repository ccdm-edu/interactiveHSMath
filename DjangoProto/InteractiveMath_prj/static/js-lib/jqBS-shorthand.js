/**
 * Written by Gemini AI, a "sugar" sweetener to bridge between jquery format which i really like and
 * getting rid of jquery bloated library
 */
/* ============================================================================
 * COMPONENT: Client side Javascript
 * FILE:      jqBS-shorthand.js
 * ============================================================================
 * 
 * DESCRIPTION:
 * This is a "sugar" sweetner to bridge between jquery format (which I wish to preserve) and getting
 * rid of the bloated jquery library.  It also acts as a set of "macros" to lift the minimal Bootstrap
 * functionality that I use so that I don't need to keep that library around as well.  It is loaded
 * into every client file
 * 
 * DEPENDENCIES:
 * - All static files, such as this js, are served over cloud service such as Cloudflare
 * 
 * ARCHITECTURE NOTES:
 * There is no jquery or bootstrap dependency, we do use a "sugar" file that has 
 *    the parts of those libraries we need but uses native HTML/JS:  jqBS-shorthand.js
 * 
 * FIRST PRODUCTION VERSION: 2026-06-07
 * AUTHOR:     Gemini AI, comments added by CDeMeyer
 * ============================================================================
 */

//Find a single element with a given identifier and attach all the shorthand jquery methods to it via extendElement.
const $ = (selector, context = document) => {
	// Prevent execution if the selector is not a valid string
	if (typeof selector !== 'string') {
		console.warn('Invalid selector passed to $:', selector);
		return null;
	}

	const el = context.querySelector(selector);
	return el ? extendElement(el) : null;
};

//Find ALL the elements matching an identifier, attach jquery methods to each element via extendElement
//then convert all the elements of the resulting NodeList to an Array allowing the each() method with a specified
//callback function with parameters el and index(array index) operating on each element.
//Operates only on Array of extendElement DOM elements.  Loops through every element, does not stop early
//Example: $$('.classname').each(...)
const $$ = (selector, context = document) => {
	const elements = Array.from(context.querySelectorAll(selector));

	for (let i = 0; i < elements.length; i++) {
		extendElement(elements[i]);
	}

	// PRESERVED: Your original (el, index) order for backward compatibility
	elements.each = function(callback) {
		for (let i = 0; i < this.length; i++) {
			callback.call(this[i], this[i], i);
		}
		return this;
	};

	elements.hide = function() {
		for (let i = 0; i < this.length; i++) this[i].hide();
		return this;
	};

	elements.show = function() {
		for (let i = 0; i < this.length; i++) this[i].show();
		return this;
	};

	return elements;
};

// Element Extension Factory to give a DOM element all the JQuery shorthand methods
function extendElement(el) {
	if (!el || el._sugarized) return el;

	el.on = (events, callback, options) => {
		events.split(' ').forEach(event => el.addEventListener(event, callback, options));
		return el;
	};

	// No more infinite call stack loops on click
	el.click = (callback) => {
		if (typeof callback === 'function') return el.on('click', callback);
		HTMLElement.prototype.click.call(el);
		return el;
	};

	el.css = (propertyName, value) => {
		if (value === undefined) return getComputedStyle(el)[propertyName];
		el.style[propertyName] = value;
		return el;
	};

	el.addClass = (className) => {
		if (className) className.split(' ').forEach(c => c && el.classList.add(c));
		return el;
	};

	el.removeClass = (className) => {
		if (className) className.split(' ').forEach(c => c && el.classList.remove(c));
		return el;
	};

	el.toggleClass = (className) => {
		if (className) el.classList.toggle(className);
		return el;
	};

	el.html = (htmlString) => {
		if (htmlString === undefined) return el.innerHTML;
		el.innerHTML = htmlString;
		return el;
	};

	// custom .text() method syntax, safely isolated
	if (!Object.prototype.hasOwnProperty.call(el, 'text')) {
		Object.defineProperty(el, 'text', {
			value: (textString) => {
				if (textString === undefined) return el.textContent;
				el.textContent = textString;
				return el;
			},
			configurable: true,
			writable: true
		});
	}

	el.val = (newValue) => {
		if (newValue === undefined) return el.value;
		el.value = newValue;
		return el;
	};

	el.attr = (name, value) => {
		if (value === undefined) return el.getAttribute(name);
		el.setAttribute(name, value);
		return el;
	};

	el.prop = function(propertyName, value) {
		if (value === undefined) return this[propertyName];
		this[propertyName] = value;
		return this;
	};

	el.parent = () => el.parentElement ? extendElement(el.parentElement) : null;

	el.findChildren = (selector) => {
		const childList = Array.from(el.children);
		const filtered = selector ? childList.filter(child => child.matches(selector)) : childList;
		// Run your custom element extension function on each matching child
		filtered.forEach(child => extendElement(child));

		// Instead of attaching a custom .each, just return the array.
		// Anyone using this function can natively use .forEach(child, index) out of the box!

		return filtered;
	};

	//Native Element.prototype.remove is no longer destroyed
	el.remove = () => {
		if (Element.prototype.remove) {
			Element.prototype.remove.call(el);
		} else if (el.parentNode) {
			el.parentNode.removeChild(el);
		}
	};

	el.empty = () => {
		el.innerHTML = '';
		return el;
	};

	el.append = (content) => {
		if (typeof content === 'string') {
			el.insertAdjacentHTML('beforeend', content);
		} else if (content instanceof Node) {
			el.appendChild(content);
		}
		return el;
	};

	el.hide = () => {
		el.style.display = 'none';
		return el;
	};

	el.show = () => {
		el.style.display = '';
		return el;
	};

	el.toggleDisplay = () => {
		el.style.display = el.style.display === 'none' ? '' : 'none';
		return el;
	};

	el.find = (selector) => $(selector, el);
	el.findAll = (selector) => $$(selector, el);
	
	//Used primarily for buttons
	el.disable = () => {
		el.disabled = true;
		return el; // Keeps the shim chainable
	};

	el.enable = () => {
		el.disabled = false;
		return el; // Keeps the shim chainable
	};
	
	
	

	el._sugarized = true;
	return el;
}




