
// RTF XHR Connector implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/rtf/BaseConnector',
  'skm/net/XHRWrapper'],
  function(SKMObject, SKMLogger, BaseConnector, XHRWrapper)
{
'use strict';


var Logger = SKMLogger.create();


var ConnectorErrors = {
  INACTIVE: 'Innactive connection',
  LIST_TO_BIG: 'Confirmation Message Sent list is too big',
  READY_LIST_TO_BIG: 'Ready To send Message list is too big'
};


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
   * Handles xhr connection error
   *
   * @description triggered when the transport cannot
   * connect to the host url or when the server
   * closes a connection giving a reason as the "405" status code
   * 
   * @param  {[type]} err JSON message representing the reason
   */
  handleError: function(err) {
    Logger.info('Connector.handleError');
    // If server triggers errors
    if ( err.status == 405 ) {
      this.fire('api:error', err.responseText);
    } else {
      this.handleConnectingStopped();
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
  handleConnectingStopped: function() {
    Logger.info('Connector.handleConnectingStopped');
    this._makeReconnectAttempt();
  }
};


var XHRConnector = BaseConnector.extend(EventsDelegates, {
  beginUpdate: function() {
    this._ensureTransportCreated(XHRWrapper)._buildTransportUrl();
    Logger.info('Connector.beginUpdate');
    Logger.debug('Connector : transport url :', this.transport.url);
    // because xhr is ready after being instantiated
    this.fire('connector:ready');
    return this;
  },

  endUpdate: function() {
    Logger.info('Connector.endUpdate');
    // disconnect and remove events
    this.transport.abortRequest();
    return this;
  },

  sendMessage: function(message) {
    Logger.debug('%cConnector.sendMessage : ', 'color:green', message);
    this.transport.sendMessage({ message: message });
  },

  addTransportListeners: function() {
    this.transport
      .on('error', this.handleError, this)
      .on('success', this.handleReceivedMessage, this);
    return this;
  }
});


return XHRConnector;


});