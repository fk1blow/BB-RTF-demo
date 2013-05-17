
// Main controller implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'models/GlobalPanelModel',
  'models/ConnectorPanelModel',
  'views/GlobalPanelView',
  'views/ConnectorPanelView'],
  function(SKMObject, SKMLogger, GlobalPanelModel, ConnectorPanelModel,
    GlobalPanelView, ConnectorPanelView)
{
'use strict';


var Logger = SKMLogger.create();


// models
var globalPanelModel;
var leftConnectorModel;
var rightConnectorModel;


// views
var mainPanelView;
var leftPanelView; // @todo change to [leftConnectorView]
var rightPanelView;


var MainController = {
  init: function() {
    globalPanelModel = new GlobalPanelModel();
    
    leftConnectorModel = new ConnectorPanelModel({
      name: 'nextLiveMatches'
    });

    rightConnectorModel = new ConnectorPanelModel({
      name: 'testChannel'
    });

    // start building things
    this._buildViews();
    this._showDefaultSequence();

    /** global transport events */
    rtf.on('sequence:complete closed interrupted', function() {
      globalPanelModel.set('isUpdating', false);
      globalPanelModel.set('activeConnectorName', null);
    });

    rtf.on('sequence:complete', function() {
      globalPanelModel.set('sequence', 'complete');
    });
    rtf.on('sequence:switching', function() {
      globalPanelModel.set('sequence', 'switching');
    });

    rtf.on('ready', function() {
      globalPanelModel.set('isUpdating', true);
      globalPanelModel.set('activeConnectorName',
        rtf.connectorsManager.getActiveConnector().name);
    });
  },

  _showDefaultSequence: function() {
    globalPanelModel.set('defaultSequence', window.rtfapi.Config.Sequence);
  },


  /*
    Views
   */


  _buildViews: function() {
    mainPanelView = new GlobalPanelView({ model: globalPanelModel });

    // main panel view event handlers
    this._addMainPanelHandlers();
    
    /** left and right panels views */
    leftPanelView = new ConnectorPanelView({
      el: $('#leftConnector'),
      model: leftConnectorModel
    });
    rightPanelView = new ConnectorPanelView({
      el: $('#rightConnector'),
      model: rightConnectorModel
    });

    this._addConnectorPanelsHandlers();
  },

  _addMainPanelHandlers: function() {
    /** main panel container handlers */
    mainPanelView
      .on('start:updates', function() {
        rtf.startUpdates();
      })
      .on('stop:updates', function() {
        rtf.stopUpdates();
      })
      .on('shutdown:updates', function() {
        rtf.shutdown();
      })
      .on('switch:connectors', function() {
        rtf.switchToNextConnector();
      });
  },

   // sa se faca active, cand primeste subscription confirmation
  _addConnectorPanelsHandlers: function() {
    var panelModel = null;

    _.each([leftPanelView, rightPanelView], function(panelView) {
      panelModel = panelView.model.get('name');


      /** confirm, infirm */

      rtf.on('confirmed:' + panelModel, function(state) {
        panelView.handleSubscriptionConfirmation();
      });
      rtf.on('infirmed:' + panelModel, function(state) {
        panelView.handleSubscriptionInfirmation();
      });


      /** messages */

      rtf.on('message:' + panelModel, panelView.handleMessage);


      /** channel activation */
      panelView.on('activate:channel', function(channel) {
        rtf.addChannel(channel);
      });
      panelView.on('deactivate:channel', function(channelName) {
        rtf.removeChannel(channelName);
      });
    });
  }
};


return MainController;


});