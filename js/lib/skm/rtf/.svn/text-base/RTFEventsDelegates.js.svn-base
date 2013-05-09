
// RTF Messages handler

define(['skm/util/Logger',
  'skm/util/Subscribable'],
  function(SKMLogger, Subscribable)
{
'use strict';


var Logger = SKMLogger.create();


var EventsDelegates = {
  handleMessageSections: function(dataObj) {
    var itemKey = null, i = 0, len = dataObj.length,
      messageUpdateItem, itemVal = null;

    // for every item in the update/reconfirmation array
    for ( i = 0; i < len; i++ ) {
      messageUpdateItem = dataObj[i];
      // each message update object key - subscription/MBEAN/error
      for ( itemKey in messageUpdateItem ) {
        // the value of the current itemKey
        itemVal = messageUpdateItem[itemKey];
        // If the subscription is incorrect, assume it will trigger an error
        if ( itemKey == 'subscription' )
          this.handleSubscriptionConfirmation(itemVal);
        else if ( itemKey == 'MBEAN' )
          this.handleMbeanMessage(itemVal);
        else if ( itemKey == 'error' )
          this.fire('error:' + itemKey, itemVal);
        else {
          try {
            this.fire('message:' + itemKey, itemVal);
          } catch(err) {
            Logger.error('Error when sending message' + itemKey, err);
            this.fire('message:' + itemKey, { error: 'update handler error' });
          }
        }
      }
    }
  },

  handleMessage: function(data) {
    if ( 'update' in data ) {
      Logger.debug('RTFApi.handleMessage, update', data);
      this.handleMessageSections(data['update']);
      this.handleUpdateBatchId(data['batchId']);
    }
    else if ( 'reconfirmation' in data ) {
      Logger.debug('RTFApi.handleMessage, reconfirmation', data);
      this.handleMessageSections(data['reconfirmation']);
      this.handleUpdateBatchId(data['batchId']);
    }
    else if ( 'noupdates' in data ) {
      Logger.debug('RTFApi.handleNoUpdates, batchId ', this._batchId);
      // Just send the same batchId, over and over again
      // If no param given, take the current batchId - this.batchId
      this.handleUpdateBatchId(this._batchId); 
    }
    else {
      Logger.error('RTFApi.handleMessage, invalid data ', data);
    }
  },

  // If the subscription is incorrect, assume it will trigger an error
  handleSubscriptionConfirmation: function(confirmedList) {
    var subscription = null, state;
    Logger.debug('%cRTFApi.handleSubscriptionConfirmation',
      'color:red', confirmedList);

      for ( subscription in confirmedList ) {
        Logger.debug('confirmed subscription : ', subscription);
        state = confirmedList[subscription];
        this._getChannelsListModel().confirmChannel(subscription, state);
        this.fire('confirmed:' + subscription, state);
      }
  },

  /**
   * Handles when a connector has been deactivated
   * 
   * @description Usually, this means the transport could not be
   * initialized or has tried to reconnect unsuccesfully
   * For the time being, just log the event
   */
  handleConnectorDeactivated: function() {
    Logger.debug('%cRTFApi.handleConnectorDeactivated', 'color:red');
    this.fire('connector:deactivated');
  },

  /**
   * Handled when the connector was closed by the server
   * 
   * @description usually, the server will send a message,
   * alongside the close command
   */
  handleConnectorClosed: function() {
    Logger.debug('%cRTFApi.handleConnectorClosed', 'color:red');
    this.fire('connector:closed');
  },

  /**
   * Handler when a connector has becom ready
   * 
   * @description usually, triggered whenever a connector
   * has become ready to send messages
   */
  handleConnectorReady: function() {
    Logger.debug('%cRTFApi.handleConnectorReady', 'color:red');
    var channelsListModel = this._getChannelsListModel();
    // if connector is available
    if ( channelsListModel.getCurrentList() )
      this.sendMessage(channelsListModel.toStringifiedJson());
  },

  // @todo return something useful
  handleMbeanMessage: function(message) {
    Logger.debug('%cRTFApi.handleMbeanMessage',
      'color:red', message);
  },

  handleUpdateBatchId: function(batchId) {
    Logger.debug('RTFApi.handleUpdateBatchId', batchId);
    this.urlModel.alter('batchId', batchId);
    // Dude, you must set the current object property too, so when you'll
    // try to reconnect you must have last batchId, not 0!! - Thanks, dude!
    this._batchId = batchId;
    // this.sendMessage('batchId:{' + batchId + '}');
    this.sendMessage('batchId:{' + batchId + '}');
  },
};


return EventsDelegates;


});