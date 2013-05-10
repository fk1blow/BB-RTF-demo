
// RTF Connectors channelst list implementation

define(['skm/k/Object',
  'skm/util/Logger'],
  function(SKMObject, SKMLogger) {
'use strict';


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