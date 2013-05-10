
// skm.js
// @description acts as a framework initializer

/**
 * SkeemM - 0.0.02
 * 
 * === Updates
 *    - nil
 * 
 * === Description
 *   - Seek Mobile - it has touch gestures and sheet
 */
(function(alias) {
"use strict";

var SKM, SK, ALIAS, VERSION;

ALIAS = ((typeof alias === 'string') && alias.length > 1);
SKM = SK = ALIAS ? (window[alias] = {}) : (window['SKM'] = {});

SK.config = {
  TOUCH_ENABLED: ('ontouchstart' in window),
  DEBUG: 'false',
  LOCALE: 'en_US',
  VERSION: '0.0.19',
  generators: {
    app: true
  },
  development: true
};

SK.app = {};

// various data structures(not just local storage - gen)
SK.datastore = {
  localStorage: null,

  collection: null
};

SK.location = {};

SK.net = {
  socket: null,

  /*
    === 1
    Could add much more powerful ajax manager here.

    === 2
    Say, for example, someone doesn't want to use the jquery ajax function. For this,
    it should receive a way to extend/add xhr adapters.

    === 3
    Should add a manager object that deals with the ajax request.
    If an object is created, you can use that instance to easly manage the request,
    its responses and callbacks.
  */
  ajax: null
};

SK.ui = {
  ViewController: null,

  View: null,

  events: {
    touch: null
  },

  components: null
};

// cl('ADAPT: in a ui env, the delegates of an object can also be his parent.')
// cl('REMOVE: SK.manager!');

// SK.manager = null;

SK.util = null;

SK.model = null;

// cl('CHANGE: change ns from gstures to SK.ui.events.touch')
var Gsture = SK.ui.events.touch = {};

}('SKM'));