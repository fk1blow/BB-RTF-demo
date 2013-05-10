
// RTF Messages handler

define(['skm/util/Logger'],
  function(SKMLogger)
{
'use strict';


var Logger = SKMLogger.create();


var EventsDelegates = {
  /**
   * Processes the upda message received from the server api
   * 
   * @param  {[type]} dataObj the actual json updates
   */
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
          this.handleChannelSubscription(itemVal);
        else if ( itemKey == 'MBEAN' )
          this.handleMbeanMessage(itemVal);
        else if ( itemKey == 'error' )
          this.fire('error:' + itemKey, itemVal);
        else {
          try {
            this.fire('message:' + itemKey, itemVal);
          } catch(err) {
            Logger.error('Error when triggering event for message' + itemKey, err);
            this.fire('message:' + itemKey, { error: 'update handler error' });
          }
        }
      }
    }
  },

  /**
   * Processes the confirmation or infirmation of a channels' subscription
   *
   * @description If the subscription is incorrect, assume it will trigger an error
   * @param  {OBject} confirmedList the list of confirmed subscriptions
   */
  handleChannelSubscription: function(confirmedList) {
    var subscription = null;

    for ( subscription in confirmedList ) {
      // confirm subscription
      if ( confirmedList[subscription] === 'true' ) {
        this._getChannelsList().confirmChannel(subscription);
        Logger.debug('confirmed subscription : ', subscription);
        this.fire('confirmed:' + subscription);
      }
      // infirm subscription by removing it from the channelst list
      else {
        this._getChannelsList().removeChannel(subscription);
        Logger.debug('removed subscription : ', subscription);
        this.fire('infirmed:' + subscription);
      }
    }
  },


  /**
   * Received a message from the server api
   * 
   * @description there will be 3 keys inside the update json:
   * - [update] - the acualy updates to be sent to the interested
   * subscribers, the ones that added those channels subscriptions 
   * int the first place
   * - [reconfirmation] - when the api should confirm a channel's subscription
   * - [noupdate] - represents the response, usuallly received by the 
   * XHR connector that no updates are sent by the api server
   * @param  {String} data a string/json representation of the data
   */
  handleApiMessage: function(data) {
    if ( 'update' in data ) {
      Logger.debug('RTFApi : update, data =', data);
      this.handleMessageSections(data['update']);
      this.handleUpdateBatchId(data['batchId']);
    }
    else if ( 'reconfirmation' in data ) {
      Logger.debug('RTFApi : reconfirmation, data =', data);
      this.handleMessageSections(data['reconfirmation']);
      this.handleUpdateBatchId(data['batchId']);
    }
    else if ( 'noupdates' in data ) {
      Logger.debug('RTFApi : noupdates, batchId =', this._batchId);
      // Just send the same batchId, over and over again
      // If no param given, take the current batchId - this.batchId
      this.handleUpdateBatchId(this._batchId); 
    }
    // if it reaches here and it has an 'error' key, it means
    // an xhr connection has received an error message from server api
    else if ( 'error' in data ) {
      this.fire('error', data);
    }
    else {
      Logger.error('RTFApi.handleApiMessage, invalid data ', data);
    }
  },

  /**
   * Handled when the server api closes the connection
   * and sends a reason message for doing that
   * 
   * @param  {String} message the reason for the close
   */
  handleApiError: function(message) {
    Logger.info('%cRTFApi.handleApiError', 'color:red');
    this.fire('error', message);
  },

  /**
   * Handled when a connector has becom ready
   * 
   * @description usually, triggered whenever a connector
   * has become ready to send messages
   */
  handleTransportReady: function() {
    Logger.info('%cRTFApi.handleTransportReady', 'color:red');
    var channelsList = this._getChannelsList();
    // if connector is available, send the parameterized channels list
    if ( channelsList.getCurrentList() )
      this.sendMessage(channelsList.toStringifiedJson());
    // ready to exchange messages with the server
    this.fire('ready');
  },

  /**
   * Handled when an open connection has been interrupted
   * other than a manual close or specific server api close event
   */
  handleTransportInterrupted: function() {
    Logger.info('%cRTFApi.handleTransportInterrupted', 'color:red');
    this.fire('interrupted');
  },

  /**
   * Handled when the user closes the connection or the server
   * api invokes close but doesn't provide a reason message
   */
  handleTransportClosed: function() {
    Logger.info('%cRTFApi.handleTransportClosed', 'color:red');
    this.fire('closed');
  },

  /**
   * Connector manager tries to change the connectors sequence
   */
  handleManagerSequenceSwitching: function() {
    Logger.info('%cRTFApi.handleManagerSequenceSwitching', 'color:red');
    this.fire('sequence:switching');
  },

  /**
   * Connector manager has ran out of sequences/connectors to use
   */
  handleManagerSequenceComplete: function() {
    Logger.info('%cRTFApi.handleManagerSequenceComplete', 'color:red');
    this.fire('sequence:complete');
  },

  // @todo return something useful
  handleMbeanMessage: function(message) {
    Logger.debug('%cRTFApi.handleMbeanMessage',
      'color:red', message);
  },

  /**
   * Handled whenever the server api sends a message
   *
   * @description taking the batchId from the server
   * will try to send it back as acknowledgement 
   */
  handleUpdateBatchId: function(batchId) {
    Logger.debug('RTFApi.handleUpdateBatchId', batchId);
    this.connectorsUrlParam.alter('batchId', batchId);
    // Dude, you must set the current object property too, so when you'll
    // try to reconnect you must have last batchId, not 0!! - Thanks, dude!
    this._batchId = batchId;
    // this.sendMessage('batchId:{' + batchId + '}');
    this.sendMessage('batchId:{' + batchId + '}');
  },
};


return EventsDelegates;


});