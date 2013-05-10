
// RTF Api Manager implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Timer',
  'skm/util/Subscribable',
  'skm/net/XHRWrapper',
  'skm/rtf/ConnectorManager',
  'skm/rtf/RTFEventsDelegates'],
  function(SKMObject, SKMLogger, SKMTimer, Subscribable, XHRWrapper,
    ConnectorManager, EventsDelegates)
{
'use strict';


var Logger = SKMLogger.create();


var Config = {
  Sequence: ['WebSocket', 'XHR'],

  Connectors : {
    WebSocket: {
      url: 'ws://localhost:8080/testws',
      reconnectAttempts: 10,
      pingServer: true
    },

    XHR: {
      url: 'http://localhost:8080/testajax',
      reconnectAttempts: 10,
    }
  },

  Errors: {
    INVALID_CHANNEL_DECLARATION: 'Invalid or malformed channel declaration'
  }
};


var ChannelsListModel = {
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
  confirmChannel: function(channelName, willConfirm) {
    var confirmed = this._confirmedList = this._confirmedList || {};
    var list = this._currentList;

    if ( channelName in list && willConfirm ) {
      confirmed[channelName] = list[channelName];
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


var ConnectorUrlModel = SKMObject.extend(Subscribable, {
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


// main API constructor
var RTFApi = SKMObject.extend(Subscribable, EventsDelegates, {
  _batchId: 0,

  urlModel: null,

  connectorsManager: null,

  initialize: function(options) {
    // Create the parameters list object
    this.urlModel = ConnectorUrlModel.create();
    // Prepare batchId and add it to the parameterizer
    this.urlModel.add('batchId', this._batchId);
    // creates the connector manager
    this._buildConnectorManager();
    // prepare before unload auto disconnect
    this._prepareSyncOnUnload();
  },


  /*
    Manager operations
   */
  

  /**
   * Stops the connectors updates
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
    var opt = options || {};
    var url, connector = this.connectorsManager.getActiveConnector();
    
    url = this.urlModel.toQueryString()
      + '&closeConnection=true';

    connector = XHRWrapper.create({
      url: opt.url || Config.Connectors.XHR.url + url,
      async: opt.async
    }).sendMessage();
  },

  switchToNextConnector: function() {
    this.connectorsManager.switchToNextConnector();
  },

  sendMessage: function(message) {
    this.connectorsManager.sendMessage(message);
  },


  /*
    Channel operations
   */


  addChannel: function(channel) {
    var activeConnector = null;
   
    // check if it's an object and has ['name'] inside
    if ( ! channel || ! ('name' in channel) ) {
      throw new TypeError(Config.Errors.INVALID_CHANNEL_DECLARATION);
    }
    // @todo trigger an event that tells the widget
    if ( ChannelsListModel.hasSubscribedAndConfirmed(channel) ) {
      // that the channel was already subscribed/confirmed
      Logger.error('Channel "' + channel + '" already subscribed.'
        + ' Unsubscribe then subscribe again.');
    } else {
      // Add subscription
      ChannelsListModel.addChannel(channel);
      // send message to connector, if a connector is available
      if ( activeConnector = this.connectorsManager.getActiveConnector() )
        activeConnector.sendMessage(ChannelsListModel.toStringifiedJson());
    }
  },

  removeChannel: function(name) {
    // remove from Channels list
    ChannelsListModel.removeChannel(name);
    // send message back to server
    this.sendMessage('closeSubscription:{' + name + '}');
    return this;
  },

  addUrlParameter: function(name, value) {
    this.urlModel.add(name, value);
    return this;
  },


  /*
    Privates
   */

  
  _getChannelsListModel: function() {
    return ChannelsListModel;
  },

  _buildConnectorManager: function() {
    this.connectorsManager = ConnectorManager.create({
      sequence: Config.Sequence,
      connectorsUrlParamModel: this.urlModel,
      connectorsOptions: Config.Connectors
    });

    // handle the raw incoming message
    this.connectorsManager.on('api:message', this.handleMessage, this);

    // now parse and send channels list
    this.connectorsManager.on('connector:ready',
      this.handleConnectorReady, this);

    // Handle when manager has been deactivated; next/sequence switch
    // or transport issues - issues handled by the manager
    this.connectorsManager.on('connector:deactivated',
      this.handleConnectorDeactivated, this);

    // when the server closes the link
    this.connectorsManager.on('connector:closed',
      this.handleConnectorClosed, this);
  },

  _prepareSyncOnUnload: function() {
    var that = this;
    window.onbeforeunload = function() {
      that.shutdown({ async: false });
    };
  }
});


return {
  Config: Config,
  
  // Api singleton method
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