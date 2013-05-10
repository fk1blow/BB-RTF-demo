/**
 * Break apart the Publish-Subcribe part of the Observable
 * and build two distinct modules:
 * 	1 - subscribable
 * 	2 - observable
 *
 * #1 Subscribable
 * - basic pub/sub mechanism
 *
 * #2 Observable
 * - ability to observe object properties
 */

define([], function()
{
'use strict';


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
