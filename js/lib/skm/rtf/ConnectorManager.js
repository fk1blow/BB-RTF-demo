// Connector Manager implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable',
  'skm/rtf/XHRConnector',
  'skm/rtf/WSConnector'],
  function(SKMObject, SKMLogger, Subscribable, XHRConnector, WSConnector)
{
'use strict';


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
   * Sends a message through a connector
   * @param  {Mixed} message a string or plain json of
   * the message sent to the server
   * @param {JSON} optData an object containing additional
   * parameters sent to the connector - wrapper
   */
  sendMessage: function(message) {
    var connector;
    if ( connector = this.getActiveConnector() )
      connector.sendMessage(message);
    else {
      Logger.info('ConnectorManager.sendMessage : invalid connector type' 
        + ' or connector is null');
    }
    return this;
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
   */
  _startInitialSequence: function() {
    var nextConnector, list = this._connectors;
    this._activeSequenceIdx = 0;
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
    Logger.debug('ConnectorManager : starting next sequence');
    
    // No more events removal from a connector
    // clean previous active connector - end updates, nullify
    // this._activeConnector.off();
    
    // set new active connector and sequence index
    this._activeSequenceIdx = this._getNextSequence();
    this._activeConnector = this._connectors[this._activeSequenceIdx];

    if ( this._activeConnector != undefined ) {
      this._activeConnector.beginUpdate();
    } else {
      Logger.info('ConnectorManager : sequence complete!');
      this._activeConnector = null;
      this.fire('sequence:complete');
    }
  },

  /**
   * Stops the current sequence and end update
   */
  _stopCurrentSequence: function() {
    Logger.debug('ConnectorManager : stopping current sequence');
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
    /*connector.on('all', function() { cl('all > ', arguments) });
    return;*/
  
    /** transport events  */
    connector.on('transport:ready', function() {
      this.fire('ready');
    }, this);

    connector.on('transport:interrupted', function() {
      this.fire('interrupted');
    }, this);

    // stop connectors
    connector.on('transport:closed', function() {
      this.fire('closed');
      this._stopCurrentSequence();
    }, this);

    // switch connectors
    connector.on('transport:error', function() {
      this.fire('sequence:switching');
      this._stopCurrentSequence();
      this._startNextSequence();
    }, this);


    /** api events */
    connector.on('api:message', function(message) {
      this.fire('message', message);
    }, this);

    // stop connectors
    connector.on('api:error', function(message) {
      this.fire('error', message);
      this._stopCurrentSequence();
    }, this);
  }
});


return Manager;


});
