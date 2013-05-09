
// Base Connector implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, Subscribable)
{
'use strict';


var Logger = SKMLogger.create();


var ConnectorState = {
  ACTIVE: 1,
  INACTIVE: 0,
  STOPPED: -1
}


/**
 * Abstract connector
 */
var BaseConnector = SKMObject.extend(Subscribable, {
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
  reconnectDelay: 3000,

  /**
   * Object that models the url and 
   * its parameters
   * @type {Object}
   */
  urlParamModel: null,

  _currentAttempt: 1,

  _isReconnecting: false,

  initialize: function() {
    Logger.debug('%cnew BaseConnector', 'color:#a2a2a2');
    
    // after transport created, add trnasport and urlparam listeners
    this.on('transport:added', function() {
      // add transport listeners
      this.addTransportListeners();
      // attach url param model events
      if ( this.urlParamModel )
        this.urlParamModel.on('added altered removed', this._buildTransportUrl, this);
    }, this);
  },

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
      this.fire('transport:added');
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
    var that = this;
    if ( this._currentAttempt <= this.maxReconnectAttempts ) {
      Logger.debug('Connector : will make attempt in', this.reconnectDelay, 'ms');
      // After delay, call being update and increment current attempt
      
      setTimeout(function() {
        Logger.debug('-------------------------------------------');
        Logger.debug('Connector : attempt #', that._currentAttempt);
        // is reconnecting and increment current attempt
        that._isReconnecting = true;
        that._currentAttempt += 1;

        // start connecting by calling beginUpdate
        that.beginUpdate();
      }, this.reconnectDelay);
    } else {
      Logger.debug('Connector : maxReconnectAttempts of ' 
        + this.maxReconnectAttempts + ' reached!');

      // has stopped reconnecting and reset current attempt
      this._isReconnecting = false;
      this._currentAttempt = 1;

      // tell the manager the transport has been deactivated
      this.fire('transport:deactivated');
    }
  }
});


return BaseConnector;


});