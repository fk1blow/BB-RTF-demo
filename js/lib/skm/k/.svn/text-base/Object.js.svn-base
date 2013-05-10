  
// SKM Core Object definition

define([], function()
{
'use strict';


// Shorthand method
var slice = Array.prototype.slice;


/**
 * Extends a given object with a given
 * array of extension objects
 * 
 * @param  {Object} target Destination object
 */
var extend = function(target) {
  var ext = [].slice.call(arguments, 1);
  var i, prop, extension, extLen = ext.length;
  for (i = 0; i < extLen; i++) {
    extension = ext[i];
    for (prop in extension) {
      if (extension.hasOwnProperty(prop))
        target[prop] = extension[prop];
    }
  }
}


/**
 * Safer test for an Object
 * though it excludes null and Array
 * 
 * @param  {Mixed}  obj The object to test
 * @return {Boolean}     
 */
var isObject = function(obj) {
  return Object.prototype.toString.apply(obj) === '[object Object]';
}


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * @description Taken from google's closure library
 * @link http://closure-library.googlecode.com/svn/docs/closure_goog_base.js.source.html
 */
var inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.__super__ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  /** @override */
  childCtor.prototype.constructor = childCtor;
};


var SKMObject = function() {};


/**
 * Creates a constructor function based its prototype
 * to an SKMObject definition
 * 
 * @param  {Object} mixins     A list of zero or more Objects
 * that represent the definition of this constructor
 * @return {Function}  function  constructor function used as a 
 * template for the new SKMObject
 */
SKMObject.extend = function(mixins) {
  var args = slice.call(arguments);
  var parent = this, child = null;
  var i, argsLen = args.length, mixin;
  // Use the initialize function as a function constructor
  /*if ( extension && ( 'initialize' in extension ) ) {
    child = extension.initialize;
  } else {
    child = function() {
      parent.apply(this, arguments);
    }
  }*/
  child = function() {
    parent.apply(this, arguments);
  }

  // Establish the base prototype chain
  inherits(child, parent);

  // Add static methods directly to child
  // function constructor
  extend(child, parent);

  // Inject every extension Object to [this.prototype]
  // and see if the mixin is an Object
  for (i = 0; i < argsLen; i++) {
    if ( isObject(mixin = args[i]) )
      extend(child.prototype, mixin);
  }

  return child;
}

/**
 * Creates (instantiates) and object
 * based on [this]
 *
 * @param {Object} options A single object to be 
 * injected to the newly created object
 * @return {Object}
 */
SKMObject.create = function(options) {
  // Create the instance object of 'this' constructor
  var instance = new this();

  // Takes the object passed at create
  // and adds it, directly to the instance
  if ( arguments.length ) {
    extend(instance, options);
  }

  // Try to call the initialize function
  if ( typeof instance.initialize === 'function' ) {
    instance.initialize.apply(instance, arguments);
  }

  return instance;
}

/**
 * Merges [this.prototype] with an Object
 * or a function constructor's prototype
 */
SKMObject.mixin = function() {
  var i, mixin, len = arguments.length;
  for (i = 0; i < len; i++) {
    if ( isObject(mixin = arguments[i]) )
      extend(this.prototype, mixin);
  }
}


return SKMObject;


});