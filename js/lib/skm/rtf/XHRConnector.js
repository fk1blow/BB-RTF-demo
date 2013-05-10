
// RTF XHR Connector implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/rtf/BaseConnector',
  'skm/net/XHRWrapper'],
  function(SKMObject, SKMLogger, BaseConnector, XHRWrapper)
{
'use strict';


var Logger = SKMLogger.create();


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

  /*
  handleError: function(err) {
    Logger.info('Connector.handleError');
    // If server triggers errors
    if ( err.status == 405 ) {
      this.fire('api:error', err.responseText);
    } else {
      this.handleConnectionStopped();
    }
  },*/
  
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
    this.transport.abortRequest();
    return this;
  },

  sendMessage: function(message) {
    Logger.debug('%cXHRConnector : sending message : ', 'color:green', message);
    this.transport.sendMessage({ message: message });
  },

  addTransportListeners: function() {
    this.transport
      .on('aborted', this.handleConnectionAborted, this)
      .on('stopped', this.handleConnectionStopped, this)
      .on('denied', this.handleConnectionDenied, this)
      .on('success', this.handleReceivedMessage, this);

      /** everything handled on complete */
      //.on('error', this.handleError, this)
    return this;
  }
});


return XHRConnector;


});