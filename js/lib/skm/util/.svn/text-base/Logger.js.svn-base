


define(['skm/k/Object'], function(SKMObject) {


/**
 * Logger singleton object
 * 
 * @description  Adds a convenient and safe method to use the console 
 * even in browser that don't support it
 * @author Paul Irish, linked from http://www.jquery4u.com/snippets/lightweight-wrapper-firebug-console-log/#.T-2xA-HWRhE
 */
Logger = SKMObject.extend({
	TYPE: 'Logger',

	_instance: null,

	_console: null,

	_enabled: true,

	initialize: function(options) {
	  this._prepareConsole();
	},

	_prepareConsole: function() {
	  this._console = window.console;
	  // if the browser does not support console(IE, mobiles, etc)
	  if(this.consoleUnavailable())
	    this._clearUndefinedConsole();
	},

	_clearUndefinedConsole: function() {
	  var c = this._console || {};
	  for(var d="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),a;a=d.pop();)c[a]=c[a] || function() {};
	  // is it safe?!
	  this._console = c;
	},

	disablePrinter: function() {
	  window.console = window.console || {};
	  var c = function(){};
	  for(var d="info,debug,error,log".split(","), a; a=d.pop();)
	    window.console[a]=c;
	  return true;
	},

	consoleUnavailable: function() {
	  return typeof (window.console !== 'undefined');
	},

	/* Now, for every console method, check if it's a function(Because IE that's why) */

	debug: function() {
	  if(typeof this._console.debug === 'function')
	    this._console.debug.apply(console, [].slice.call(arguments));
	},

	info: function() {
	  if(typeof this._console.info === 'function')
	    this._console.info.apply(console, [].slice.call(arguments));
	},

	warn: function() {
	  if(typeof this._console.warn === 'function')
	    this._console.warn.apply(console, [].slice.call(arguments));
	},

	error: function() {
	  if(typeof this._console.error === 'function')
	    this._console.error.apply(console, [].slice.call(arguments));
	}
});


return Logger;


});