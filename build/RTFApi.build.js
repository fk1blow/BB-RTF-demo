
/**
 * almond 0.2.5 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("lib/almond", function(){});

  
// SKM Core Object definition

define('skm/k/Object',[], function()
{



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

// skm Logger module

define('skm/util/Logger',['skm/k/Object'],
	function(SKMObject)
{



var slice = [].slice;


/**
 * Logger singleton object
 * 
 * @description  Adds a convenient and safe method to use the console 
 * even in browser that don't support it
 * @author Paul Irish, linked from http://www.jquery4u.com/snippets/lightweight-wrapper-firebug-console-log/#.T-2xA-HWRhE
 */
var Logger = SKMObject.extend({
	TYPE: 'Logger',

	_instance: null,

	_console: null,

	_enabled: true,

	initialize: function(options) {
	  this._prepareConsole();
	},

	consoleUnavailable: function() {
	  return typeof (window.console !== 'undefined');
	},

	/* Now, for every console method, check if it's a function(Because IE that's why) */

	debug: function() {
	  if(typeof this._console.debug === 'function')
	    this._console.debug.apply(console, slice.call(arguments));
	},

	info: function() {
	  if(typeof this._console.info === 'function')
	    this._console.info.apply(console, slice.call(arguments));
	},

	warn: function() {
	  if(typeof this._console.warn === 'function')
	    this._console.warn.apply(console, slice.call(arguments));
	},

	error: function() {
	  if(typeof this._console.error === 'function')
	    this._console.error.apply(console, slice.call(arguments));
	},

	_prepareConsole: function() {
	  this._console = window.console;
	  // if the browser does not support console(IE, mobiles, etc)
	  if ( this.consoleUnavailable() )
	    this._clearUndefinedConsole();
	},

	/**
	 * Better console wrapper
	 * @see paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
	 */
	_clearUndefinedConsole: function() {
	  var c = this._console || {};
	  for(var d="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),a;a=d.pop();)c[a]=c[a] || function() {};
	  // is it safe?!
	  this._console = c;
	}
});


// a small shortcut for console.log
// only for development debugging!!!
if ( window.console )
	window.cl = console.log;
else
	window.cl = function() {};


return Logger;


});

// skm Subscribable mixin

define('skm/util/Subscribable',[], function()
{



/**
 * Event/Subscribable Mixin
 * 
 * @author Jeremy Ashkenas, DocumentCloud Inc
 * @link http://documentcloud.github.com/backbone/
 */
 
 
var eventSplitter = /\s+/;


// Implement fancy features of the Events API such as multiple event
// names `"change blur"` and jQuery-style event maps `{change: action}`
// in terms of the existing API.
var eventsApi = function(obj, action, name, rest) {
  if (!name) return true;
  if (typeof name === 'object') {
    for (var key in name) {
      obj[action].apply(obj, [key, name[key]].concat(rest));
    }
  } else if (eventSplitter.test(name)) {
    var names = name.split(eventSplitter);
    for (var i = 0, l = names.length; i < l; i++) {
      obj[action].apply(obj, [names[i]].concat(rest));
    }
  } else {
    return true;
  }
};


// Optimized internal dispatch function for triggering events. Tries to
// keep the usual cases speedy (most Backbone events have 3 arguments).
var triggerEvents = function(events, args) {
  var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
  switch (args.length) {
  case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx);
  return;
  case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1);
  return;
  case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2);
  return;
  case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
  return;
  default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
  }
};


var Subscribable = {
	// Bind one or more space separated events, or an events map,
  // to a `callback` function. Passing `"all"` will bind the callback to
  // all events fired.
  on: function(name, callback, context) {
    if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
    this._events || (this._events = {});
    var events = this._events[name] || (this._events[name] = []);
    events.push({callback: callback, context: context, ctx: context || this});
    return this;
  },

  // Bind events to only be triggered a single time. After the first time
  // the callback is invoked, it will be removed.
  once: function(name, callback, context) {
    if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
    var self = this;
    var once = _.once(function() {
      self.off(name, once);
      callback.apply(this, arguments);
    });
    once._callback = callback;
    return this.on(name, once, context);
  },

  // Remove one or many callbacks. If `context` is null, removes all
  // callbacks with that function. If `callback` is null, removes all
  // callbacks for the event. If `name` is null, removes all bound
  // callbacks for all events.
  off: function(name, callback, context) {
    var retain, ev, events, names, i, l, j, k;
    if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
    if (!name && !callback && !context) {
      this._events = {};
      return this;
    }

    names = name ? [name] : _.keys(this._events);
    for (i = 0, l = names.length; i < l; i++) {
      name = names[i];
      if (events = this._events[name]) {
        this._events[name] = retain = [];
        if (callback || context) {
          for (j = 0, k = events.length; j < k; j++) {
            ev = events[j];
            if ((callback && callback !== ev.callback &&
                             callback !== ev.callback._callback) ||
                (context && context !== ev.context)) {
              retain.push(ev);
            }
          }
        }
        if (!retain.length) delete this._events[name];
      }
    }

    return this;
  },

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  fire: function(name) {
    if (!this._events) return this;
    var args = [].slice.call(arguments, 1);
    if (!eventsApi(this, 'trigger', name, args)) return this;
    var events = this._events[name];
    var allEvents = this._events.all;
    if (events) triggerEvents(events, args);
    if (allEvents) triggerEvents(allEvents, arguments);
    return this;
  },

  // Tell this object to stop listening to either specific events ... or
  // to every object it's currently listening to.
  stopListening: function(obj, name, callback) {
    var listeners = this._listeners;
    if (!listeners) return this;
    if (obj) {
      obj.off(name, typeof name === 'object' ? this : callback, this);
      if (!name && !callback) delete listeners[obj._listenerId];
    } else {
      if (typeof name === 'object') callback = this;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
      }
      this._listeners = {};
    }
    return this;
  }
};


return Subscribable;


});


// XHR Wrapper implementation

define('skm/net/XHRWrapper',['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, Subscribable)
{



var Logger = SKMLogger.create();


var DefaultLibraryWrapper = window.jQuery || null;


// The XHR wrapper that will be used.
// Usually, this wrapper will be for jQuery's $.ajax method
// Direct reference to the Library that will provide the ajax api
var LibraryConfig = {
	wrapper: null,
	ajax: null,
	get: null,
	post: null
}


var XHRMessageDelegates = {
	handleOnSuccess: function(msg) {
		Logger.info('XHRWrapper.handleOnSuccess', msg);
		this.fire('success', msg);
	},
	
	handleOnComplete: function(ajaxObject, status) {
		if ( ajaxObject.status == 405 ) {
			//should trigger next sequence
			this.fire('denied');
		} else if ( ajaxObject.status != 200 && ajaxObject.statusText != 'abort' ) {
			// interrupted by networkd/hardware stack
			this.fire('stopped');
		} else if ( ajaxObject.statusText == 'abort' ) {
			// manually aborted by user
			// shouldn't fire anything
			if ( this._expectedClose != true ) {
				this.fire('aborted');
			}
		}
		this._expectedClose = false;
	},

	/*
	 handleOnError: function(err) {
		if ( ! this._expectedClose ) {
			Logger.info('XHRWrapper.handleOnError');
			this._expectedClose = false;
			this.fire('error', err);
		} else {
			this.fire('closed');
		}
	 }
	 */
}


var XHRWrapper = SKMObject.extend(Subscribable, XHRMessageDelegates, {
	/**
	 * Server url
	 * @type {String}
	 */
	url: null,

	httpMethod: 'POST',

	dataType: 'JSON',
	
	async: true,

	_wrapper: null,

	_request: null,

	_expectedClose: false,

	initialize: function() {
		Logger.debug('%cnew XHRWrapper', 'color:#A2A2A2');
		// @todo use a getter for the wrapper
		this._wrapper = LibraryConfig.wrapper || DefaultLibraryWrapper;
		this._request = null;
	},

	/**
	 * Sends a message through the AJAX connection
	 * using default method type - 'GET'
	 * @param  {Object} messageObj the message to be sened
	 */
	sendMessage: function(message, options) {
		Logger.info('XHRWrapper.send');
		this._doRequest(message, options);
		return this;
	},

	/**
	 * Send a message using a GET request
	 * @param  {Object} messageObj the message to be sened
	 */
	sendGetRequest: function(message, options) {
		Logger.info('XHRWrapper.sendGetRequest');
		var opt = options || {};
		opt.httpMethod = 'GET';
		this._doRequest(message, opt);
		return this;
	},

	/**
	 * Sends a message using a POST request
	 * @param  {Object} messageObj the message to be sened
	 */
	sendPostRequest: function(message, options) {
		Logger.info('XHRWrapper.sendPostRequest');
		var opt = options || {};
		opt.httpMethod = 'POST';
		this._doRequest(message, opt);
		return this;
	},

	/**
	 * Aborts a in-progress request
	 * @param  {Boolean} triggersError Should trigger error
	 * callback or not - [this._expectedClose]
	 */
	abortRequest: function(abortedByUser) {
		Logger.info('XHRWrapper.abortRequest');
		// if triggers error is true, it will trigger the error event
		if ( abortedByUser === true )
			this._expectedClose = true;
		// Set expected close, only it aborts the connection
		if ( this._request != null ) {
			this._request.abort();
		}
		// nullifies the request object
		this._resetRequestObject();
	},

	/**
	 * Sends an Ajax request, using the provided adapter
	 * @param  {Object} options an object used for
	 * AJAX setting(method, url, type, etc)
	 */
	_doRequest: function(messageData, options) {
		var opt = options || {};
		var httpMethod = opt.httpMethod || this.httpMethod;
		var dataType = opt.dataType || this.dataType;
		var async = opt.async || this.async;

		// Abort the request if there is one in progress
		this.abortRequest();
		
		this._request = this._wrapper.ajax({
			url: this.url,

			context: this,

			// http method
			type: httpMethod,
			
			async: async,

			// The type of data that you're expecting back from the server
			dataType: dataType,

			// Data sent to the server
			data: messageData,

			/*error: function (err) {
				this.handleOnError(err);
			},*/
			
			complete: function(ctx, statusText) {
				this.handleOnComplete(ctx, statusText);
			},
			
			success: function(msg) {
				this.handleOnSuccess(msg);
			}
		});
	},

	_resetRequestObject: function() {
		if ( this._request !== null ) {
			this._request = null;
		}
	}
});


/*return {
	Config: LibraryConfig,
	Wrapper: XHRWrapper
};*/


/**
 * Temporarely hardcoded
 */
return XHRWrapper;


});

// Simple Timer object

define('skm/util/Timer',['skm/util/Logger',
  'skm/util/Subscribable',
  'skm/k/Object'], function(SKMLogger, Subscribable, SKMObject)
{


var Logger = SKMLogger.create();


/**
 * Timer object that provides an easy and a more manageable
 * way to use intervals/cycles
 * 
 * @description Because some critical modules will use Timers,
 * i had to borrow much of the logic from google closure's timer.
 * @link http://closure-library.googlecode.com/svn/docs/closure_goog_timer_timer.js.html
 */
Timer = SKMObject.extend(Subscribable, {
  // How many times the interval will
  // trigger a tick; (x < 1) == infinity
  ticks: 1,

  // The interval at which a tick is being triggered
  tickInterval: 1000,

  // If the timer is active or not
  enabled: false,

  _intervalScale: 0.8,

  // Timer object reference
  _timerObject: null,

  // How many time the timer has fired a "tick" event
  _tickCounter: 0,

  _lastTickTime: 0,

  initialize: function() {
    this._timerObject = null;
  },

  /**
   * Commands
   */

  start: function() {
    var that = this;
    this.enabled = true;
    // Start only if the timerObject is not assigned(or null)
    if ( !this._timerObject ) {
      this._tickCounter = 0;
      this._timerObject = setTimeout(function() {
        that._tickTack();
      }, this.tickInterval);
      this._lastTickTime = this.now();
    }
    return this;
  },

  stop: function() {
    this.enabled = false;
    var lastTickCounter = this.getTicksCounter();
    this._tickCounter = 0;
    if ( this._timerObject ) {
      clearTimeout(this._timerObject);
      this._timerObject = null;
    }
    return this;
  },

  /**
   * Handlers
   */

  handleTick: function(ticks) {
    this.fire('tick', ticks);
  },

  /**
   * Getters/Setters
   */

  getTicks: function() {
    if ( this.ticks < 0 ) {
      return 0;
    } else {
      return this.ticks;
    }
  },

  setTicks: function(val) {
    if ( typeof val !== 'number' ) {
      val = 1;
    }
    this.ticks = val;
    return this;
  },

  getTicksCounter: function() {
    return this._tickCounter;
  },

  now: function() {
    return (new Date()).getTime();
  },

  /**
   * Private
   */

  _tickTack: function() {
    if ( this.enabled ) {
      var that = this, elapsed, notSynced;
      // Stop if reached maximum ticks set
      if ( this._maxTicksReached() ) {
        this.stop();
        return;
      }
      // Synchronize the interval with the elapsed time
      // @see closure-library.googlecode.com/svn/docs/closure_goog_timer_timer.js.html
      elapsed = this.now() - this._lastTickTime;
      notSynced = elapsed > 0 && elapsed < (this.tickInterval * this._intervalScale);
      if ( notSynced ) {
        this._timerObject = setTimeout(function() {
          that._tickTack();
        }, this.tickInterval - elapsed);
        return;
      }
      // Handle the ticks and increment internal counter
      this.handleTick.call(this, this.getTicksCounter());
      this._tickCounter++;
      // In goog.timer, this re-check is required becase a timer may be
      // stopped between a tick so that [this.enabled] could be reset
      if ( this.enabled ) {
        this._timerObject = setTimeout(function() {
          that._tickTack();
        }, this.tickInterval);
        this._lastTickTime = this.now();
      }
    }
  },

  _maxTicksReached: function() {
    if ( this.getTicks() === 0 ) {
      return false;
    } else {
      return this._tickCounter >= this.getTicks();
    }
  }
});


return Timer;


});

// Base Connector implementation

define('skm/rtf/BaseConnector',['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Timer',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, SKMTimer, Subscribable)
{



var Logger = SKMLogger.create();


/**
 * Abstract connector
 */
var BaseConnector = SKMObject.extend(Subscribable, {
  name: 'BaseConnector',

  /**
   * Transport type object
   * @type {Transport} an instance of a Transport type
   */
  transport: null,

  /**
   * Transport's own configuration options
   * @type {Object}
   */
  transportOptions: null,

  /**
   * Maximum reconnect attempts
   * @type {Number}
   */
  maxReconnectAttempts: 3,

  /**
   * Delay after a reconnect attemp will begin
   * @type {Number}
   */
  reconnectDelay: undefined,

  /**
   * Delay after a reconnect attemp will begin
   * @type {Number}
   */
  defaultReconnectDelay: 3000,

  /**
   * Object that models the url and 
   * its parameters
   * @type {Object}
   */
  urlParamModel: null,

  _reconnectTimer: null,

  _currentAttempt: 1,

  _isReconnecting: false,

  /**
   * Removes transport listeners
   */
  removeTransportListeners: function() {
    this.transport.off();
    return this;
  },

  /**
   * Adds a transport type object
   * instance of Transport type and listens
   * to various events
   */
  addTransport: function(transportObject) {
    if ( this.transport == null ) {
      this.transport = transportObject;
      // add transport listeners
      this.addTransportListeners();
      // attach url param model events
      if ( this.urlParamModel )
        this.urlParamModel.on('added altered removed', this._buildTransportUrl, this);
    } else {
      throw new Error('BaseConnector.addTransport : ' + 
        'transport object already exists');
    }
    return this;
  },

  /**
   * Destroys the object
   * @description nullifies every field
   * and removes any events bound to that particular field
   */
  destroy: function() {
    this.removeTransportListeners();
    this.transport = null;
    this.urlParamModel = null;
  },

  /**
   * @todo move to baseconnector
   * 
   * Handled when the reconnect attemps has reached maximum attempts
   */
  handleReconnectingEnded: function() {
    Logger.info('Connector.handleReconnectingEnded');
    // has stopped reconnecting and reset current attempt
    this._resetReconnectAttempts();
    this.fire('transport:error');
  },

  handleReconnectingBegin: function() {
    Logger.info('Connector.handleReconnectingBegin');
    Logger.debug('-----------------------------------------------------------');
    Logger.debug('Connector : reconnect attempt #', this._currentAttempt);
    // kill current timer
    this._reconnectTimer = null;
    // is reconnecting and increment current attempt
    this._isReconnecting = true;
    this._currentAttempt += 1;
    // start connecting by calling beginUpdate
    this.beginUpdate();
    this.fire('transport:reconnecting');
  },

  /**
   * Ensures the presence of a transport type
   * @param  {Object} transportType Reference to the transport
   * used by this particular connecgtor(WSWrapper, XHRWrapper, etc)
   */
  _ensureTransportCreated: function(transportType) {
    if ( this.transport == null )
      this.addTransport(transportType.create(this.transportOptions));
    return this;
  },

  /**
   * Builds the transport utl, based on
   * urlParams and transportBaseUrl fields
   */
  _buildTransportUrl: function() {
    var qs = '';
    if ( this.transport && this.urlParamModel ) {
      qs = this.urlParamModel.toQueryString();
      this.transport.url = this.transportOptions.url + qs;
    }
  },

  /**
   * Handled while trying to establish a link
   *
   * @description this handler is called whenever the websocket wrapper
   * tries to establish a connection but fails to do that.
   * It cand fail if the wrapper auto-disconnects the attemp,
   * or if the native wrapper triggers the close event.
   */
  _makeReconnectAttempt: function() {
    var maxReconnectAttempts = this.transportOptions.maxReconnectAttempts;
    var reconnectDelay = this.reconnectDelay || this.defaultReconnectDelay;
    var that = this;

    if ( this._currentAttempt <= maxReconnectAttempts ) {
      Logger.debug('Connector : will make attempt in', reconnectDelay, 'ms');
      this._reconnectTimer = setTimeout(function() {
        that.handleReconnectingBegin();
      }, reconnectDelay);
    } else {
      Logger.debug('Connector : maxReconnectAttempts of ' 
        + maxReconnectAttempts + ' reached!');
      this.handleReconnectingEnded();
    }
  },

  _stopReconnectAttempts: function() {
    if ( this._reconnectTimer )
      clearTimeout(this._reconnectTimer);
    this._resetReconnectAttempts();
  },

  _resetReconnectAttempts: function() {
    this._isReconnecting = false;
    this._currentAttempt = 1;
  }
});


return BaseConnector;


});

// RTF XHR Connector implementation

define('skm/rtf/XHRConnector',['skm/k/Object',
  'skm/util/Logger',
  'skm/rtf/BaseConnector',
  'skm/net/XHRWrapper'],
  function(SKMObject, SKMLogger, BaseConnector, XHRWrapper)
{



var Logger = SKMLogger.create();


/*------------------------
  Delegates
------------------------*/


var EventsDelegates = {
  /**
   * Handles a message received from server api
   *
   * @description handles the server's update message
   * and passes it to the subscribers/clients of rtf api
   * 
   * @param  {Object} message JSON message send by rtf server api
   */
  handleReceivedMessage: function(message) {
    Logger.info('Connector.handleReceivedMessage');
    this.fire('api:message', message);
  },

  /**
   * @todo move to baseconnector
   * 
   * Handled when the reconnect attemps has reached maximum attempts
   */
  handleMaxReconnectAttemptsReached: function() {
    Logger.info('XHRConnector.handleMaxReconnectAttemptsReached');
    this.fire('transport:error');
  },
  
  /**
   * Handled when the xhr connection is refused by server api
   */
  handleConnectionDenied: function() {
    Logger.info('XHRConnector.handleConnectionDenied');
    this.fire('transport:error');
  },
  
  /**
   * Handled when the xhr connection is aborted by the user
   */
  handleConnectionAborted: function() {
    Logger.info('XHRConnector.handleConnectionAborted');
    this.fire('transport:closed');
  },
  
  /**
   * Handled when the connection has been stopped
   * 
   * @descroption usually, when the network fails or anything that,
   * can prematurely close a connection
   */
  handleConnectionStopped: function() {
    Logger.info('XHRConnector.handleConnectionStopped');
    this._makeReconnectAttempt();
  }
};


/*------------------------
  Connector
------------------------*/


var XHRConnector = BaseConnector.extend(EventsDelegates, {
  name: 'XHR',

  beginUpdate: function() {
    this._ensureTransportCreated(XHRWrapper)._buildTransportUrl();
    Logger.info('XHRConnector.beginUpdate');
    Logger.debug('XHRConnector : transport url :', this.transport.url);
    // because xhr is ready, right after being instantiated
    this.fire('transport:ready');
    return this;
  },

  endUpdate: function() {
    Logger.info('XHRConnector.endUpdate');
    // disconnect and remove events
    this.transport.abortRequest(true);
    // Stop the reconnecting attempts
    this._stopReconnectAttempts();
    return this;
  },

  sendMessage: function(message) {
    Logger.debug('%cXHRConnector : sending message : ', 'color:green', message);
    this.transport.sendMessage({ message: message });
  },

  addTransportListeners: function() {
    // this.transport.on('all', function() { cl('XHRConnector < ', arguments); });
    // return;

    this.transport
      .on('aborted', this.handleConnectionAborted, this)
      .on('stopped', this.handleConnectionStopped, this)
      .on('denied', this.handleConnectionDenied, this)
      .on('success', this.handleReceivedMessage, this);
    return this;
  }
});


return XHRConnector;


});

// WebSocket wrapper

define('skm/net/WSWrapper',['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/util/Timer'],
  function(SKMObject, SKMLogger, Subscribable,
    SKMTimer)
{



var Logger = SKMLogger.create();


var WebsocketStates = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};


var NoNativeImplementation = 'No native WebSocket implementation found;'
+ ' WebSocket not available!';


var iDevice = function() {
  return typeof navigator !== 'undefined'
    && /iPad|iPhone|iPod/i.test(navigator.userAgent);
};


var getNativeConstructor = function() {
  var c = null;
  if ('WebSocket' in window)
    c = WebSocket;
  else if ('MozWebSocket' in window)
    c = MozWebSocket;
  return c;
};


var createNativeSocket = function(url, protocols) {
  var ctor = null
  // if no url given, throw error
  if ( !arguments.length ) {
    throw new TypeError(ErrorMessages.MISSSING_URL);
  }
  // check the designated constructor
  ctor = getNativeConstructor();
  if ( ctor === null ) {
    Logger.debug('%ccreateNativeSocket :', NoNativeImplementation, 'red');
  }
  // If no native implementation found, return null
  if ( ctor == null )
    return ctor;
  // assign the native socket and return it
  return (protocols) ? new ctor(url, protocols) : new ctor(url);
};


/**
 * Native WebSocket connection delegates
 */
var NativeWebSocketHandler = SKMObject.extend(Subscribable, {
  connectionTimeout: 1500,

  _timerAutoDisconnect: null,

  _closeExpected: false,

  _linkWasOpened: false,

  initialize: function() {
    // Creates auto-disconnect and reconnect, timers
    this._timerAutoDisconnect = SKMTimer.create({
      tickInterval: this.connectionTimeout
    }).on('tick', this._handleAutoDisconnect, this);
  },

  /**
   * Attaches the socket events to a handler
   * @param  {WebSoclet} connection WebSocket connection reference
   */
  attachListenersTo: function(connection) {
    var that = this;
    connection.onopen = function() {
      that.handleOnOpen.apply(that, arguments);
    }
    connection.onclose = function() {
      that.handleOnClose.apply(that, arguments);
    }
    connection.onmessage = function() {
      that.handleOnMessage.apply(that, arguments);
    }
    return this;
  },

  
  /*
    Commands
   */
  
  
  startConnectingAttempt: function() {
    this._timerAutoDisconnect.start();
    this._closeExpected = false;
    return this;
  },

  stopConnectingAttempt: function(expected) {
    this._timerAutoDisconnect.stop();
    this._closeExpected = expected || false;
    return this;
  },

  /*
    Handlers
   */


  handleOnClose: function(event) {
    Logger.info('NativeWebSocketHandler.handleOnClose');
    Logger.debug('event state : ', 
      'wasClean:', event.wasClean, ' code:', event.code, ' reason:', event.reason);

    // stop all timers
    this._timerAutoDisconnect.stop();

    // If the socket connection is closed by the server
    // or it's aborted manually by the user
    if ( event.wasClean ) {
      Logger.debug('NativeWebSocketHandler : link closed');
      this.fire('link:closed', event.reason);
    }
    // if manually closed during the connecting attempt
    else if ( this._closeExpected ) {
      Logger.debug('NativeWebSocketHandler : connecting manually aborted during attempt');
      this.fire('connecting:aborted');
    }
    // default case, where no manual close or server close has been triggered
    else  {
      // if has been opened before
      if ( this._linkWasOpened ) {
        Logger.debug('NativeWebSocketHandler : connection interrupted');
        this.fire('link:interrupted');
      }
      // default case
      else {
        Logger.debug('NativeWebSocketHandler : connecting stopped/ended');
        this.fire('connecting:closed');
      }
    }

    this._linkWasOpened = false;
    this._closeExpected = false;
  },

  handleOnOpen: function() {
    Logger.info('NativeWebSocketHandler.handleOnOpen');
    this._timerAutoDisconnect.stop();
    this._reconnectionAttempt = 0;
    this._linkWasOpened = true;
    this.fire('link:opened');
  },
 
  handleOnMessage: function(message) {
    var data = message.data;
    switch( data ) {
      case 'server:pong':
        // @todo change trigger to "pong"
        this.fire('server:pong');
        break;
      default:
        this.fire('message', data);
    }
  },
  
  _handleAutoDisconnect: function() {
    Logger.debug('NativeWebSocketHandler : auto-disconnect triggered after:',
      this._timerAutoDisconnect.tickInterval + ' ms');
    this.fire('connecting:timeout');
  }
});


var WSWrapper = SKMObject.extend(Subscribable, {
  /**
   * URL of the WebSocket server
   * @type {String}
   */
  url: null,

  /**
   * TBD
   * @type {Array}
   */
  protocols: null,

  /**
   * How long before aborting the connection attempt
   */
  timeout: 1500,

  /**
   * If will try to ping the server or not
   */
  pingServer: true,

  /**
   * The interval at which will send pings to the server
   */
  pingInterval: 10 * 1000, // 10 seconds

  /**
   * Represents the native WebSocket instance 
   * @type {WebSocket}
   */
  _nativeSocket: null,

  /**
   * Event handler/delegate object
   * @type {WSHandler}
   */
  _connectionHandler: null,

  _timerPing: null,

  initialize: function() {
    Logger.debug('%cnew WSWrapper', 'color:#A2A2A2');
    this._timerPing = Timer.create({ tickInterval: this.pingInterval, ticks: 0 });
    this._timerPing.on('tick', this.ping, this);
    this._nativeSocket = null;
    this._initConnectionHandler();
  },

  /**
   * Public
   */

  connect: function() {
    if ( this.getConnectionState() == 1 ) {
      Logger.error('WSWrapper.connect : ws already open.');
      return false;
    }
    this._startConnecting();
    return this;
  },

  disconnect: function() {
    this._abortConnecting({ expected: true });
    return true;
  },

  send: function(message) {
    var socketObject = this._nativeSocket;
    // if is opened
    if ( this.getConnectionState() == 1 ) {
      if ( iDevice ) {// Wrap inside a timeout if iDevice browser detected
        setTimeout(function() {
          socketObject.send(message);
        }, 0);
      } else {
        socketObject.send(message);
      }
    }
    return this;
  },

  // @todo move/remove ping from WSWrapper
  ping: function() {
    if ( ! this.getConnectionState() == 1 ) {
      Logger.info('WSWrapper.ping : cannot ping server or'
        + ' connection is closed. Stopping ping timer.');
      this._timerPing.stop();
      return false;
    }
    Logger.debug('%cWSWrapper : ping', 'color:green');
    this.send('ping');
    return this;
  },

  /**
   * Queries
   */
  
  getConnectionState: function() {
    if ( this._nativeSocket )
      return this._nativeSocket.readyState;
    return null;
  },

  /**
   * Private
   */
  
  _startConnecting: function() {
    this._nativeSocket = createNativeSocket(this.url, this.protocols);
    if ( this._nativeSocket == null ) {
      this.fire('implementation:missing');
      this._abortConnecting({ expected: true });
    } else {
      this._connectionHandler.attachListenersTo(this._nativeSocket)
        .startConnectingAttempt();
      this.fire('connecting:started');
    }
  },

  _abortConnecting: function(options) {
    Logger.debug('WSWrapper : abort websocket connecting...');
    var opt = options || {};
    
    // only stop if the connection is not already closed
    if ( this.getConnectionState() != 3 ) {
      this._connectionHandler.stopConnectingAttempt(opt.expected);
    }
    // destroy the native socket instance
    this._destroyNativeSocket();
  },

  _initPingTimer: function() {
    if ( !this.pingServer )
      return false;
    // if timer is not enabled, only then try to (re)start it
    if ( !this._timerPing.enabled ) {
      Logger.info('Ping started.');
      this._timerPing.start();
    }
  },

  /**
   * Closes the socket and nullifies the variable reference
   *
   * @description
   */
  _destroyNativeSocket: function() {
    if ( this._nativeSocket ) {
      Logger.debug('WSWrapper : closing native websocket object');
      this._nativeSocket.close();
      this._nativeSocket = null;
    }
    return true;
  },

  _initConnectionHandler: function() {
    this._connectionHandler = NativeWebSocketHandler.create({
      connectionTimeout: this.timeout
    });
    this._attachConnectionEvents();
  },

  _attachConnectionEvents: function() {
    var connection = this._connectionHandler;

    // Connecting timeout triggered
    connection.on('connecting:timeout', function() {
      this._abortConnecting({ expected: false });
    }, this);

    // Don't attempt to call [_stopConnecting] because this is already
    // called when the close event of the native websocket has been triggered
    connection.on('connecting:closed', function() {
      this.fire('connecting:closed');
    }, this);

    // As well, link:closed/interrupted already will have been trigger
    // the close events on the native websocket object
    connection.on('link:opened', function() {
      this.fire('link:opened');
      this._initPingTimer();
    }, this);

    // An established link was closed manually or by the server api
    connection.on('link:closed', function(evt) {
      this.fire('link:closed', evt);
    }, this);

    // An established link was interrupted
    connection.on('link:interrupted', function(evt) {
      this.fire('link:interrupted', evt);
    }, this);

    // message received from the server
    connection.on('message', function(message) {
      if ( message == 'pong' )
        Logger.debug('%cWSWrapper : pong', 'color:blue');
      else
        this.fire('message', message);
    }, this);
  }
});


return WSWrapper;


});

// RTF WebSocket Connector implementation

define('skm/rtf/WSConnector',['skm/k/Object',
  'skm/util/Logger',
  'skm/rtf/BaseConnector',
  'skm/net/WSWrapper'],
  function(SKMObject, SKMLogger, BaseConnector, WSWrapper)
{



var Logger = SKMLogger.create();


/*------------------------
  Delegates
------------------------*/


var EventsDelegates = {
  /**
   * Triggered when the transport is ready
   *
   * @description when the transport is ready to send messages
   * this methods signals this by triggerring a 'api:ready'
   * @return {[type]} [description]
   */
  handleLinkOpened: function() {
    this._resetReconnectAttempts();
    this.fire('transport:ready');
  },

  /**
   * Handled when the native WebSocket is not present
   */
  handleImplementationMissing: function() {
    Logger.info('WSConnector.handleImplementationMissing');
    this.fire('transport:error');
  },
  
  /**
   * Handles link:closed
   *
   * @description if server api closes the link, it sends a message
   * describing the reason for the close.
   * Usually, the server api will close the link because of a problem
   * involving protocols or for network issues.
   * Anything else is not interpreted!
   * 
   * @param  {Object} message JSON message sent by rtf server api
   */
  hanleLinkClosed: function(message) {
    Logger.info('WSConnector.hanleLinkClosed');
    this._resetReconnectAttempts();
    // if the message is a string, you got an exception and that's baaad!!!
    if ( message ) {
      this.fire('api:error', message);
    } else {
      this.fire('transport:closed');
    }
  },

  /**
   * Handled when an opened link/connection has been interrupted
   *
   * @description besides fireing an event, it will try
   * to make another reconnect attempt
   */
  handleLinkInterrupted: function() {
    Logger.info('Connector.handleLinkInterrupted');
    // besides the reconnect attempt, tell the use what happened
    this.fire('transport:interrupted');
    this._makeReconnectAttempt();
  },

  /**
   * Handles a message received from server api
   *
   * @description handles the server's update message
   * and passes it to the subscribers/clients of rtf api
   * 
   * @param  {Object} message JSON message send by rtf server api
   */
  handleReceivedMessage: function(message) {
    message = JSON.parse(message);
    this.fire('api:message', message);
  },

  /**
   * Handled while trying to establish a link
   *
   * @see [this._makeReconnectAttempt]
   * @see reconnection mechanism
   * 
   * @description this handler is called whenever the websocket wrapper
   * tries to establish a connection but fails to do that.
   * It cand fail if the wrapper auto-disconnects the attemp,
   * or if the native wrapper triggers the close event.
   */
  handleConnectingClosed: function() {
    Logger.info('Connector.handleConnectingClosed');
    this._makeReconnectAttempt();
  }
};


/*------------------------
  Delegates
------------------------*/


var WSConnector = BaseConnector.extend(EventsDelegates, {
  name: 'WS',
  
  beginUpdate: function() {
    this._ensureTransportCreated(WSWrapper)._buildTransportUrl();
    Logger.info('WSConnector.beginUpdate');
    Logger.debug('WSConnector : transport url :', this.transport.url);
    // after connect, a ["connector:ready"] event will trigger
    this.transport.connect();
    return this;
  },

  endUpdate: function() {
    Logger.info('WSConnector.endUpdate');
    // disconnect and remove events
    this.transport.disconnect();
    // Stop the reconnecting attempts
    this._stopReconnectAttempts();
    return this;
  },

  /**
   * Sends a message through/using the transport
   * 
   * @param  {String} message   the message to be sent to endpoint
   */
  sendMessage: function(message) {
    Logger.debug('%cWSConnector : sending message : ', 'color:green', message);
    this.transport.send(message);
  },

  addTransportListeners: function() {
    // this.transport.on('all', function() {
    //   cl('%cWSConnector < ', 'color:gray;', arguments);
    // });

    
    /** Transport related */

    // connection established
    this.transport.on('link:opened', this.handleLinkOpened, this);

    // connection closed by server; wasClean == true
    this.transport.on('link:closed', this.hanleLinkClosed, this);

    // Connection has been interrupted, not by the user nor the server
    this.transport.on('link:interrupted', this.handleLinkInterrupted, this);

    // Transport has been stopped or closed
    this.transport.on('connecting:closed', this.handleConnectingClosed, this);


    /** Message and implementation */

    // handles connection message event - rtf server api update
    this.transport.on('message', this.handleReceivedMessage, this);

    // WebSocket native implementation not found
    this.transport.on('implementation:missing',
      this.handleImplementationMissing, this);

    return this;
  }
});


return WSConnector;


});
// Connector Manager implementation

define('skm/rtf/ConnectorManager',['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/rtf/XHRConnector',
  'skm/rtf/WSConnector'],
  function(SKMObject, SKMLogger, Subscribable, XHRConnector, WSConnector)
{



var Logger = SKMLogger.create();


var ConnectorsAvailable = {
  'WebSocket': { name: 'WebSocket', reference: WSConnector },
  'XHR': { name: 'XHR', reference: XHRConnector }
};


var ConnectorsFactory = {
  connectorsOptions: null,

  connectorsUrlParamModel: null,

  connectorsManager: null,

  buildConnectorsForSequence: function(sequence) {
    // var manager = this.connectorsManager;
    var item, name = null, type = null;
    var len = sequence.length;
    
    // iterate over the sequence
    for ( var i = 0; i < len; i++ ) {
      item = sequence[i];
      // sequence connector name
      name = ConnectorsAvailable[item]['name'];
      // sequence connector constructor function
      type = ConnectorsAvailable[item]['reference'];
      // if connector not already registered
      this.buildAndRegisterConnector(name, type);
    }
  },

  buildAndRegisterConnector: function(type_name, type_reference) {
    var manager = this.connectorsManager;
    var connectorOptions = null;

    if ( manager.getConnector(type_name) == null ) {
      connectorOptions = this.connectorsOptions[type_name];

      // create the connector and register to manage
      // @todo refactor creation method and object default properties
      manager.registerConnector(type_name, type_reference.create({
        urlParamModel: this.connectorsUrlParamModel,
        maxReconnectAttempts: connectorOptions['maxReconnectAttempts'],
        reconnectDelay: connectorOptions['reconnectDelay'],
        transportOptions: connectorOptions
      }));
    }
  }
};


var Manager = SKMObject.extend(Subscribable, {
  /**
   * List of connector object instances
   * @type {Object} a connector instance
   */
  _connectors: null,

  /**
   * Reference to the currently/primary used
   * connector instance
   * 
   * @type {Object Connector}
   */
  _activeConnector: null,

  /**
   * Reference to active sequence index
   * @type {Array}
   */
  _activeSequenceIdx: 0,

  /**
   * Connector url parameter model
   * @type {Object}
   */
  connectorsUrlParamModel: null,

  /**
   * Connectors and transports options
   * @type {Object}
   */
  connectorsOptions: null,

  /**
   * The default sequence of the connectors
   * 
   * @description usual configuration is ['WebSocket', 'XHR']
   * and those strings should map directly to connector
   * instances inside [this._connectors] list
   * @type {Array}
   */
  sequence: null,

  initialize: function() {
    Logger.debug('%cnew Manager', 'color:#a2a2a2');
    this._connectors = null;
    this._activeConnector = null;
    this._prepareConnectorsFactory();
  },

  /**
   * Starts the connectors [beginUpdate]
   * and creates the transports available
   */
  startConnectors: function() {
    Logger.info('ConnectorManager.startConnectors');
    if ( this.getActiveConnector() )
      Logger.error('Unable to start a sequence; connectors already started!');
    else
      this._startInitialSequence();
    return this;
  },

  /**
   * Stops all connectors
   * 
   * @todo stop all connectors and clear all transport
   * instances - destroy
   */
  stopConnectors: function() {
    Logger.info('ConnectorManager.stopConnectors');
    if ( this.getActiveConnector() )
      this._stopCurrentSequence();
    return this;
  },
  
  /**
   * Switches to the next connector in sequence
   * 
   * @description Currently, it doesn't go around the tail
   * of the list and stops at the last sequence
   */
  switchToNextConnector: function() {
    Logger.info('ConnectorManager.switchToNextConnector');
    // this._switchToNextSequence();
    // debugger;
    this._stopCurrentSequence();
    this._startNextSequence();
    return this;
  },

  /**
   * Returns the active connector
   * @return {Object} connector instance
   */
  getActiveConnector: function() {
    return this._activeConnector;
  },

  /**
   * Returns a connector from the connectors list
   * @param  {String} type name of the connector
   * @return {Object}      connector instance
   */
  getConnector: function(type) {
    var connector = null;
    if ( this._connectors && type in this._connectors ) {
      connector = this._connectors[type];
    }
    return connector;
  },

  /**
   * Registers a connector instance
   * @param  {String} name      connector's name
   * @param  {Object} connector an object representing the instance
   */
  registerConnector: function(type, connector) {
    this._connectors = this._connectors || {};
    if ( type in this._connectors ) {
      throw new Error('ConnectorManager.registerConnector :: '
        + ' connector already registered : ' + type);
    }
    this._attachConnectorHandlers(connector);
    return this._connectors[type] = connector;
  },


  /**
   * Private
   */
  

  /**
   * Prepares the connectors for this sequence
   */
  _prepareConnectorsFactory: function() {
    ConnectorsFactory.connectorsOptions = this.connectorsOptions;
    ConnectorsFactory.connectorsUrlParamModel = this.connectorsUrlParamModel;
    ConnectorsFactory.connectorsManager = this;
    ConnectorsFactory.buildConnectorsForSequence(this.sequence);
  },

  /**
   * Starts the initial update sequence
   * when the connectors is at 0(zero) index
   * 
   * @description assigning [_activeSequenceIdx = 0] will force the connector manager
   * to always pick the first connector defined by the sequence
   */
  _startInitialSequence: function() {
    var nextConnector, list = this._connectors;
    this._activeSequenceIdx = 0
    // check the list and if the next sequence is in that list
    if ( list === null || ( list && ! ( this.sequence[0] in list ) ) ) {
      Logger.info('%cConnectorManager : connector list is empty or null',
        'color:red');
      return;
    }
    // assign activeConnector and start
    this._activeConnector = list[this.sequence[0]];
    this._activeConnector.beginUpdate();
  },

  /**
   * Gets the next connector in sequence
   * and starts the update
   */
  _startNextSequence: function() {
    // debugger;
    // this._activeSequenceIdx = this._getNextSequence();
    var nextConnector = this.sequence[++this._activeSequenceIdx];
    this._activeConnector = this._connectors[nextConnector];

    if ( this._activeConnector != undefined ) {
      Logger.debug('ConnectorManager : starting next sequence');
      this._activeConnector.beginUpdate();
    } else {
      Logger.debug('ConnectorManager : sequence complete!');
      this._activeConnector = null;
      this.fire('sequence:complete');
    }
  },

  /**
   * Stops the current sequence and end update
   */
  _stopCurrentSequence: function() {
    // If connector, end update and nullify
    if ( this._activeConnector ) {
      this._activeConnector.endUpdate();
      // this._activeConnector.off() // should i remove them?
      this._activeConnector = null;
    }
  },

  /**
   * Return the next sequence of connector to use
   */
  _getNextSequence: function() {
    return this.sequence[this._activeSequenceIdx + 1];
  },


  _attachConnectorHandlers: function(connector) {
    // connector.on('all', function() {
    //   cl('%cConnectorManager > ', 'color:red; font-weight:bold;', arguments);
    // });


    /** transport events  */

    // Connector has established connection and is ready to receive updates
    connector.on('transport:ready', function() {
      this.fire('ready');
    }, this);

    // An opened connection/link has been interrupted
    // not aplicable to XHRConnector
    connector.on('transport:interrupted', function() {
      this.fire('interrupted');
    }, this);

     // Connector tries to make a reconnect attempt
    connector.on('transport:reconnecting', function() {
      this.fire('reconnecting');
    }, this);

    // Connector has been stopped, manually or by the server
    connector.on('transport:closed', function() {
      this.fire('closed');
    }, this);

    // Connector has encountered an error and/or cannot initialize its transport
    // Also, triggered when the reconnecting has reached the max attempts
    connector.on('transport:error', function() {
      // Not sure if this event is relevant to the api
      this.fire('sequence:switching');
      this._startNextSequence();
    }, this);

   


    /** api events */

    connector.on('api:message', function(message) {
      this.fire('message', message);
    }, this);

    // stop connectors
    // nothing more to do
    connector.on('api:error', function(message) {
      this.fire('error', message);
      // @todo not sure if this call is necessary and not buggy!!!
      // this._stopCurrentSequence();
    }, this);
  }
});


return Manager;


});


// RTF Connectors channelst list implementation

define('skm/rtf/models/ChannelsList',['skm/k/Object',
  'skm/util/Logger'],
  function(SKMObject, SKMLogger) {



var ChannelsListModel = function() {
  this._currentList = {};
  this._confirmedList = {};
}

ChannelsListModel.prototype = {
  _currentList: null,

  _confirmedList: null,

  addChannel: function(channel) {
    var list = this._currentList = this._currentList || {},
        channelItem, paramItem;
    var channelParams = channel['params'],
        channelName = channel['name'];

    if ( channelName in list ) {
      channelItem = list[channelName];
    } else {
      channelItem = list[channelName] = {};
    }
    // ...and add channel parameters, if any
    for ( paramItem in channelParams ) {
      channelItem[paramItem] = channelParams[paramItem];
    }
  }, 

  removeChannel: function(name) {
    var subscription = null;
    if ( this._currentList && name in this._currentList ) {
      delete this._currentList[name];
    }
    if ( this._confirmedList && name in this._confirmedList ) {
      delete this._confirmedList[name];
    }
  },

  // @todo move it to the api module
  confirmChannel: function(channelName) {
    var confirmed = this._confirmedList = this._confirmedList || {};
    var list = this._currentList;

    if ( channelName in list ) {
      confirmed[channelName] = true;
      delete list[channelName];
    }
  },

  hasSubscribedAndConfirmed: function(channelObj) {
    var list = this._confirmedList;
    var hasSubscribed = false;
    if ( list ) {
      hasSubscribed = (channelObj['name'] in list);
    }
    return hasSubscribed;
  },

  getCurrentList: function() {
    return this._currentList;
  },

  toStringifiedJson: function() {
    var item, first = true, parameterized = 'subscribe:{';
    var list = this._currentList;
    for ( item in list ) {
      if (!first) {
        parameterized+= ',';
      }
      parameterized += item;
      first = false;
    }
    parameterized += '}';
    parameterized += 'params:' + JSON.stringify(list)
      .replace(/\'|\"/g, '');
    return parameterized;
  }
};


return ChannelsListModel;


});

// RTF Connectors Url Model implementation

define('skm/rtf/models/UrlParam',['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, Subscribable) {



var UrlParamModel = SKMObject.extend(Subscribable, {
  _parameterizerList: null,

  getList: function() {
    this._parameterizerList = this._parameterizerList || {};
    return this._parameterizerList;
  },

  getByName: function(name) {
    return this._parameterizerList[name];
  },

  toUrl: function() {
    var list = this._parameterizerList;
    return encodeURIComponent(JSON.stringify(list).toString());
  },

  toQueryString: function(concatStr) {
    var i = 0, qs = '', part, segment, params = this.getList();
    var concatWith = concatStr || '&';
    for ( part in params ) {
      i = 0, segment = params[part];
      // If at first part
      if ( qs.length < 1 ) {
        qs += '?';
      } else {
        qs += concatWith;
      }
      // for each part, there will be a segment array
      for ( ; i < segment.length; i++ ) {
        if ( i > 0 )
          qs += concatWith;
        qs += (part + '=' + segment[i]);
      }
    }
    return qs;
  },

  reset: function(name, value) {
    if ( name in this.getList() )
      delete this._parameterizerList[name];
    return this;
  },

  add: function(name, value) {
    var list = this.getList();
    if ( list[name] ) {
      list[name].push(value);
    } else {
      list[name] = [value];
    }
    this.fire('added');
    return this;
  },

  remove: function(name) {
    var list = this.getList();
    if ( name in list )
      delete list[name];
    this.fire('removed');
    return this;
  },

  alter: function(name, newValue) {
    var param, list = this.getList();
    if ( param = list[name] ) {
      list[name] = [newValue];
    }
    this.fire('altered');
    return this;
  }
});


return UrlParamModel;


});

// RTF Messages handler

define('skm/rtf/RTFEventsDelegates',['skm/util/Logger'],
  function(SKMLogger)
{



var Logger = SKMLogger.create();


var EventsDelegates = {
  /**
   * Processes the upda message received from the server api
   * 
   * @param  {[type]} dataObj the actual json updates
   */
  handleMessageSections: function(dataObj) {
    var itemKey = null, i = 0, len = dataObj.length,
      messageUpdateItem, itemVal = null;

    // for every item in the update/reconfirmation array
    for ( i = 0; i < len; i++ ) {
      messageUpdateItem = dataObj[i];
      
      // each message update object key - subscription/MBEAN/error
      for ( itemKey in messageUpdateItem ) {
        
        // the value of the current itemKey
        itemVal = messageUpdateItem[itemKey];
        
        // If the subscription is incorrect, assume it will trigger an error
        if ( itemKey == 'subscription' )
          this.handleChannelSubscription(itemVal);
        else if ( itemKey == 'MBEAN' )
          this.handleMbeanMessage(itemVal);
        else if ( itemKey == 'error' )
          this.fire('error:' + itemKey, itemVal);
        else {
          try {
            this.fire('message:' + itemKey, itemVal);
          } catch(err) {
            Logger.error('Error when triggering event for message' + itemKey, err);
            this.fire('message:' + itemKey, { error: 'update handler error' });
          }
        }
      }
    }
  },

  /**
   * Processes the confirmation or infirmation of a channels' subscription
   *
   * @description If the subscription is incorrect, assume it will trigger an error
   * @param  {OBject} confirmedList the list of confirmed subscriptions
   */
  handleChannelSubscription: function(confirmedList) {
    var subscription = null;

    for ( subscription in confirmedList ) {
      // confirm subscription
      if ( confirmedList[subscription] === 'true' ) {
        this._getChannelsList().confirmChannel(subscription);
        Logger.debug('confirmed subscription : ', subscription);
        this.fire('confirmed:' + subscription);
      }
      // infirm subscription by removing it from the channelst list
      else {
        this._getChannelsList().removeChannel(subscription);
        Logger.debug('removed subscription : ', subscription);
        this.fire('infirmed:' + subscription);
      }
    }
  },


  /**
   * Received a message from the server api
   * 
   * @description there will be 3 keys inside the update json:
   * - [update] - the acualy updates to be sent to the interested
   * subscribers, the ones that added those channels subscriptions 
   * int the first place
   * - [reconfirmation] - when the api should confirm a channel's subscription
   * - [noupdate] - represents the response, usuallly received by the 
   * XHR connector that no updates are sent by the api server
   * @param  {String} data a string/json representation of the data
   */
  handleApiMessage: function(data) {
    if ( 'update' in data ) {
      Logger.debug('RTFApi : update, data =', data);
      this.handleMessageSections(data['update']);
      this.handleUpdateBatchId(data['batchId']);
    }
    else if ( 'reconfirmation' in data ) {
      Logger.debug('RTFApi : reconfirmation, data =', data);
      this.handleMessageSections(data['reconfirmation']);
      this.handleUpdateBatchId(data['batchId']);
    }
    else if ( 'noupdates' in data ) {
      Logger.debug('RTFApi : noupdates, batchId =', this._batchId);
      // Just send the same batchId, over and over again
      // If no param given, take the current batchId - this.batchId
      this.handleUpdateBatchId(this._batchId); 
    }
    // if it reaches here and it has an 'error' key, it means
    // an xhr connection has received an error message from server api
    else if ( 'error' in data ) {
      this.fire('error', data);
    }
    else {
      Logger.error('RTFApi.handleApiMessage, invalid data ', data);
    }
  },

  /**
   * Handled when the server api closes the connection
   * and sends a reason message for doing that
   * 
   * @param  {String} message the reason for the close
   */
  handleApiError: function(message) {
    Logger.info('%cRTFApi.handleApiError', 'color:red');
    this.fire('error', message);
  },

  /**
   * Handled when a connector has becom ready
   * 
   * @description usually, triggered whenever a connector
   * has become ready to send messages
   */
  handleTransportReady: function() {
    Logger.info('%cRTFApi.handleTransportReady', 'color:red');
    var channelsList = this._getChannelsList();
    // if connector is available, send the parameterized channels list
    if ( channelsList.getCurrentList() )
      this.sendMessage(channelsList.toStringifiedJson());
    // ready to exchange messages with the server
    this.fire('ready');
  },

  /**
   * Handled when an open connection has been interrupted
   * other than a manual close or specific server api close event
   */
  handleTransportInterrupted: function() {
    Logger.info('%cRTFApi.handleTransportInterrupted', 'color:red');
    this.fire('interrupted');
  },

  /**
   * Handled when the user closes the connection or the server
   * api invokes close but doesn't provide a reason message
   */
  handleTransportClosed: function() {
    Logger.info('%cRTFApi.handleTransportClosed', 'color:red');
    this.fire('closed');
  },

  handleTransportReconnecting: function() {
    Logger.info('%cRTFApi.handleTransportReconnecting', 'color:red');
    this.fire('reconnecting');
  },

  /**
   * Connector manager tries to change the connectors sequence
   */
  handleManagerSequenceSwitching: function() {
    Logger.info('%cRTFApi.handleManagerSequenceSwitching', 'color:red');
    this.fire('sequence:switching');
  },

  /**
   * Connector manager has ran out of sequences/connectors to use
   */
  handleManagerSequenceComplete: function() {
    Logger.info('%cRTFApi.handleManagerSequenceComplete', 'color:red');
    this.fire('sequence:complete');
  },

  // @todo return something useful
  handleMbeanMessage: function(message) {
    Logger.debug('%cRTFApi.handleMbeanMessage',
      'color:red', message);
  },

  /**
   * Handled whenever the server api sends a message
   *
   * @description taking the batchId from the server
   * will try to send it back as acknowledgement 
   */
  handleUpdateBatchId: function(batchId) {
    Logger.debug('RTFApi.handleUpdateBatchId', batchId);
    this.connectorsUrlParam.alter('batchId', batchId);
    // Dude, you must set the current object property too, so when you'll
    // try to reconnect you must have last batchId, not 0!! - Thanks, dude!
    this._batchId = batchId;
    // this.sendMessage('batchId:{' + batchId + '}');
    this.sendMessage('batchId:{' + batchId + '}');
  },
};


return EventsDelegates;


});

/**
 * BetBrain RTF.js v0.1.9
 * 
 * Dragos Tudorache, BetBrain Ltd.
 * http://betbrain.com
 * RTF may be freely distributed under the MIT license.
 */
define('skm/rtf/RTFApi',['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/net/XHRWrapper',
  'skm/rtf/ConnectorManager',
  'skm/rtf/models/ChannelsList',
  'skm/rtf/models/UrlParam',
  'skm/rtf/RTFEventsDelegates'],
  function(SKMObject, SKMLogger, Subscribable, XHRWrapper,
    ConnectorManager, ChannelstListModel, UrlParamModel, RTFEventsDelegates)
{



var Logger = SKMLogger.create();


var Config = {
  Sequence: ['WebSocket', 'XHR'],

  Connectors: {
    WebSocket: {
      url: 'ws://localhost:8080/testws',
      maxReconnectAttempts: 10,
      pingServer: false
    },

    XHR: {
      url: 'http://localhost:8080/testajax',
      maxReconnectAttempts: 10,
    }
  },

  Errors: {
    INVALID_CHANNEL_DECLARATION: 'Invalid or malformed channel declaration'
  },

  Warnings: {
    DUPLICATE_CHANNEL_SUBSCRIPTION: 'Channel already subscribed and confirmed'
  }
};


/**
 * Channels handling delegates
 */
var ChannelsDelegate = {
  addChannel: function(channel) {
    var activeConnector = null;
    var channelsList = this._getChannelsList();

    // check if it's an object and has ['name'] inside
    if ( ! channel || ! ('name' in channel) ) {
      throw new TypeError(Config.Errors.INVALID_CHANNEL_DECLARATION);
    }
    if ( channelsList.hasSubscribedAndConfirmed(channel) ) {
      Logger.warn(Config.Warnings.DUPLICATE_CHANNEL_SUBSCRIPTION, channel);
    } else {
      // Add subscription then send the 
      // message to connector, if any available
      channelsList.addChannel(channel);
      if ( activeConnector = this.connectorsManager.getActiveConnector() )
        activeConnector.sendMessage(channelsList.toStringifiedJson());
      else
        Logger.info('Channel added to list but no active connector found!'
          + ' Confirmation will be sent after activating a connector');
    }
  },

  removeChannel: function(name) {
    // remove from Channels list
    this._getChannelsList().removeChannel(name);
    // send message back to server
    this.sendMessage('closeSubscription:{' + name + '}');
    return this;
  }
};


/**
 * Url parameters handling delegates
 */
var ParamatersDelegates = {
  /**
   * Adds a parameter to the connectors url model
   * 
   * @description it will add the parameter, will trigger a "added" event
   * that will oblige the active connector to reset its url accordingly   
   * @param {String} name   the key name of the parameter
   * @param {String} value  actual value of the parameter, expressed as a string
   * @return {Object}      current object context
   */
  addUrlParameter: function(name, value) {
    this.connectorsUrlParam.add(name, value);
    return this;
  },

  /**
   * Remove the parameter from the connectors url
   * 
   * @param {String} name   the key name of the parameter
   * @return {Object}      current object context
   */
  removeUrlParameter: function(name) {
    this.connectorsUrlParam.remove(name);
    return this;
  }
};


// main constructor
var RTFApi = SKMObject.extend(Subscribable, RTFEventsDelegates, 
  ChannelsDelegate, ParamatersDelegates,
{
  _batchId: 0,

  /**
   * Holds the url parameters list of the connectors and their model
   * @type {UrlParam}
   */
  connectorsUrlParam: null,

  /**
   * Holds the list of subscribed channels and their model
   * @type {ChannelstList}
   */
  channelstList: null,

  /**
   * The connector manager instance
   * @type {ConnectorManager}
   */
  connectorsManager: null,

  /**
   * Yo dawg, i heard you like initializers...
   */
  initialize: function() {
    // Create the parameters list object
    this.connectorsUrlParam = UrlParamModel.create();
    // Prepare batchId and add it to the parameterizer
    this.connectorsUrlParam.add('batchId', this._batchId);
    // creates the connector manager
    this._buildConnectorManager();
    // prepare before unload auto disconnect
    var that = this; window.onbeforeunload = function() {
      that.shutdown({ async: false });
    };
  },

  /**
   * Stops the connectors updates, mainly for debugging purpose
   * 
   * @description currently, the correct method for closing a subscription
   * is to send a shutdown message to the API
   * @return {Object} current context
   */
  startUpdates: function() {
    this.connectorsManager.startConnectors();
    return this;
  },

  /**
   * Stops the connectors updates
   * 
   * @description stops the updates and disconnects/interrupts 
   * current transport, making it avaiable for a resume call.
   * @return {Object} current context
   */
  stopUpdates: function() {
    this.connectorsManager.stopConnectors();
    return this;
  },

  /**
   * Shuts down server updates communication
   * 
   * @description shuts down communication, stops every connector
   * and sends a proper message to the server.
   * @param  {Object} options optionsl shutdown parameters
   */
  shutdown: function(options) {
    var url, opt = options || {};
    // try to stop current updates, if any
    this.stopUpdates();
    // build xhr's url and send the message 
    url = this.connectorsUrlParam.toQueryString()
      + '&closeConnection=true';
    // gg xhr
    XHRWrapper.create({
      url: opt.url || Config.Connectors.XHR.url + url,
      async: opt.async
    }).sendMessage();
  },

  /**
   * It tries to switch to the next connector
   *
   * @description if it has reached the end of the sequence, as it is defined
   * in the Config.Sequence, it will stop every connector
   * and trigger a 'connector:sequence:complete' event
   */
  switchToNextConnector: function() {
    this.connectorsManager.switchToNextConnector();
  },

  /**
   * Sends a message using the current active transport
   * @param  {String} message the message to be sent by the active connector
   * If the active is a WSConnector instance, it should try to stringify
   * the content of the message, implementation done by each connector
   */
  sendMessage: function(message) {
    var connector;
    if ( connector = this.connectorsManager.getActiveConnector() )
      connector.sendMessage(message);
    else {
      Logger.warn('Unable to send message : invalid connector type' 
        + ' or connector is null');
    }
    return this;
  },


  /*
    Privates
   */

  
  _getChannelsList: function() {
    if ( this.channelstList == null ) {
      this.channelstList = new ChannelstListModel();
    }
    return this.channelstList;
  },

  _buildConnectorManager: function() {
    this.connectorsManager = ConnectorManager.create({
      sequence: Config.Sequence,
      connectorsUrlParamModel: this.connectorsUrlParam,
      connectorsOptions: Config.Connectors
    });

    // this.connectorsManager.on('all', function() { 
    //   cl('%call > ', 'color:red; font-weight:bold;', arguments); 
    // });


    /** transport events */

    this.connectorsManager
      .on('ready', this.handleTransportReady, this)
      .on('interrupted', this.handleTransportInterrupted, this)
      .on('closed', this.handleTransportClosed, this)
      .on('reconnecting', this.handleTransportReconnecting, this)

    
    /** sequence events */

    this.connectorsManager
      .on('sequence:switching', this.handleManagerSequenceSwitching, this)
      .on('sequence:complete', this.handleManagerSequenceComplete, this);

    /** api/server events */
    this.connectorsManager.on('message', this.handleApiMessage, this);
    this.connectorsManager.on('error', this.handleApiError, this);
  }
});


return {
  Config: Config,
  
  // singleton method
  Api: (function() {
    var apiSingletonInstance = null;
    return {
      getInstance: function() {
        if ( apiSingletonInstance == null )
          apiSingletonInstance = RTFApi.create();
        return apiSingletonInstance;
      }
    };
  }())
};


});
