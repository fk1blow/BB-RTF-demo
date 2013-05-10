
// RTF Api implementation

define(['skm/k/Object',
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
'use strict';


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
        Logger.info('Unable to add channel - no active connector found');
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
    this.connectorsManager.sendMessage(message);
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

    /*this.connectorsManager.on('all', function() { cl('all > ', arguments); });
    return;*/

    /** transport events */
    this.connectorsManager.on('ready',
      this.handleTransportReady, this);

    this.connectorsManager.on('interrupted',
      this.handleTransportInterrupted, this);

    this.connectorsManager.on('closed',
      this.handleTransportClosed, this);

    /** sequence events */
    this.connectorsManager.on('sequence:switching',
      this.handleManagerSequenceSwitching, this);
      
    this.connectorsManager.on('sequence:complete',
      this.handleManagerSequenceComplete, this);

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
