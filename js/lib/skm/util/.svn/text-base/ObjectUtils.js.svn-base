// SKM Object utils definition

define([], function()
{
'use strict';


var Util = {};


/**
 * Object utils
 */
var ObjectUtil = {
  /**
   * my.class extend method
   * @author jie http://myjs.fr/my-class/
   * 
   * @param  {Object} obj     target object
   * @param  {Object} extension   template/extension object
   * @param  {Boolean} override   if extension prop overrides the target prop
   */
  include: function(obj, extension, override) {
    var prop;
    if (override === false) {
      for (prop in extension) {
        if ((prop in obj)) continue;
        obj[prop] = extension[prop];
      }
    } else {
      for (prop in extension) {
        if (extension.hasOwnProperty(prop))
          obj[prop] = extension[prop];
        // if (extension.toString !== Object.prototype.toString)
        //   obj.toString = extension.toString;
      }
    }
    return obj;
  },

  /**
   * TO BE REMOVED
   * 
   * Merges two or more objects
   * 
   * @description the merge will overrite previously declaredy attributes
   * @param  {[type]} target the object that should be merged to
   * @return {Object}    target merged object
   */
  merge: function(target) {
    var targetObject = target;
    var extension = Array.prototype.slice.call(arguments, 1);
    // for each object extension, merge into target object
    ArrayUtil.forEach(extension, function(item) {
      if(ObjectUtil.isObject(item) == false)
        throw new Error('Merged/Extension argument must be of type Object; [ObjectUtil.merge]');
      ObjectUtil.include(target, item || {});
    });
    return target;
  },

  isObject: function(object) {
    return Object.prototype.toString.apply(object) === '[object Object]';
  }
};


/**
 * Array utils
 * @type {Object}
 */ 
var ArrayUtil = {
  forEach: function(arr, callback, ctx) {
    if(arr == null)
      return;
    var i, len = arr.length;
    for(i = 0; i < len; i++)
      callback.call(ctx || this, arr[i], i);
  },

  isArray: function(object) {
    return Object.prototype.toString.apply(object) === '[object Array]';
  }
};


return {
	ArrayUtil: ArrayUtil,
	ObjectUtil: ObjectUtil
}


});