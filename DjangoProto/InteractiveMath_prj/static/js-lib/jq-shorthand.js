/**
 * Written by Gemini AI, a "sugar" sweetener to bridge between jquery format which i really like and
 * getting rid of jquery bloated library
 */
/* ============================================================================
 * COMPONENT: Client side Javascript
 * FILE:      jq-shorthand.js
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
 *    the parts of those libraries we need but uses native HTML/JS:  jq-shorthand.js
 * 
 * FIRST PRODUCTION VERSION: 2026-06-07
 * AUTHOR:     Gemini AI
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
	elements.forEach(extendElement);
	elements.each = (callback) => {
		elements.forEach((el, index) => callback.call(el, el, index));
		return elements;
	};
	return elements;
};

// Global Object Loops ($.each).  Can operate on NodeList, standard array, native objects (which means key value pairs, unlike elements.each)
//Example: $.each(myArray, ...) or $.each(myObject, ...)
//const user = { name: "Alice", age: 30, role: "Admin" };
//$.each(user, function(key, value) {
//    console.log(`${key}: ${value}`); // Logs "name: Alice", etc.
//});
//Unlike elements.each, this can break early, here is an example:
//$.each(numbers, function(index, value) {
//    if (value > 25) return false; // This acts like a 'break' statement!
//    console.log(value); // Only prints 10 and 20
//});
$.each = (collection, callback) => {
	if (Array.isArray(collection) || collection.length !== undefined) {
		for (let i = 0; i < collection.length; i++) {
			if (callback.call(collection[i], i, collection[i]) === false) break;
		}
	} else if (typeof collection === 'object' && collection !== null) {
		const keys = Object.keys(collection);
		for (let i = 0; i < keys.length; i++) {
			if (callback.call(collection[keys[i]], keys[i], collection[keys[i]]) === false) break;
		}
	}
	return collection;
};

// Modern Fetch-based Ajax
$.ajax = async (options = {}) => {
	const { url, method = 'GET', data = null, headers = {}, success, error, dataType = 'json' } = options;
	const fetchOptions = { method: method.toUpperCase(), headers: { ...headers } };
	if (data) {
		if (typeof data === 'object' && !(data instanceof FormData)) {
			fetchOptions.headers['Content-Type'] = 'application/json';
			fetchOptions.body = JSON.stringify(data);
		} else {
			fetchOptions.body = data;
		}
	}
	try {
		const response = await fetch(url, fetchOptions);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		const result = dataType === 'json' ? await response.json() : await response.text();
		if (success) success(result, response.statusText, response);
		return result;
	} catch (err) {
		if (error) error(err, err.message);
		throw err;
	}
};

// Element Extension Factory to give a DOM element all the JQuery shorthand methods
function extendElement(el) {
	if (el._sugarized) return el;

	// Generic Event Listener & Shorthands
	el.on = (events, callback, options) => {
		events.split(' ').forEach(event => el.addEventListener(event, callback, options));
		return el;
	};
	el.click = (callback) => el.on('click', callback);
	el.change = (callback) => el.on('change', callback);
	el.submit = (callback) => el.on('submit', callback);

	// Classes & Content
	el.addClass = (className) => { className.split(' ').forEach(c => el.classList.add(c)); return el; };
	el.removeClass = (className) => { className.split(' ').forEach(c => el.classList.remove(c)); return el; };
	el.toggleClass = (className) => { el.classList.toggle(className); return el; };
	el.html = (htmlString) => { if (htmlString === undefined) return el.innerHTML; el.innerHTML = htmlString; return el; };
	// Safe Object.defineProperty to bypass native <a> tag conflicts
	Object.defineProperty(el, 'text', {
		value: (textString) => {
			if (textString === undefined) return el.textContent;
			el.textContent = textString;
			return el;
		},
		configurable: true,
		writable: true
	});

	// Form Values, Attributes, and Properties (.prop())
	el.val = (newValue) => { if (newValue === undefined) return el.value; el.value = newValue; return el; };
	el.attr = (name, value) => { if (value === undefined) return el.getAttribute(name); el.setAttribute(name, value); return el; };

	// NEW: Element Properties (.prop())
	el.prop = (propertyName, value) => {
		if (value === undefined) return el[propertyName];
		el[propertyName] = value;
		return el;
	};

	// DOM Tree Traversal
	el.parent = () => { return el.parentElement ? extendElement(el.parentElement) : null; };
	el.children = (selector) => {
		const childList = Array.from(el.children);
		const filtered = selector ? childList.filter(child => child.matches(selector)) : childList;
		filtered.forEach(extendElement);
		filtered.each = (callback) => { filtered.forEach((child, index) => callback.call(child, child, index)); return filtered; };
		return filtered;
	};

	// DOM Destruction & Cleanup
	el.remove = () => { el.parentNode && el.parentNode.removeChild(el); };
	el.empty = () => { el.innerHTML = ''; return el; };

	// DOM Manipulation & Visibility
	el.append = (content) => { if (typeof content === 'string') { el.insertAdjacentHTML('beforeend', content); } else { el.appendChild(content); } return el; };
	el.prepend = (content) => { if (typeof content === 'string') { el.insertAdjacentHTML('afterbegin', content); } else { el.insertBefore(content, el.firstChild); } return el; };
	el.hide = () => { el.style.display = 'none'; return el; };
	el.show = () => { el.style.display = ''; return el; };
	el.toggleDisplay = () => { el.style.display = el.style.display === 'none' ? '' : 'none'; return el; };

	// Traversal
	el.find = (selector) => $(selector, el);
	el.findAll = (selector) => $$(selector, el);

	el._sugarized = true;
	return el;
}
