
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
var globalPanel;
var leftConnectorPanel;
var rightConnectorPanel;


// views
var mainPanelContainer;
var leftPanelConnector;
var rightPanelConnector;


var MainController = {
  init: function() {
    globalPanel = new GlobalPanelModel();
    
    leftConnectorPanel = new ConnectorPanelModel({
      name: 'nextLiveMatches'
    });

    rightConnectorPanel = new ConnectorPanelModel({
      name: 'testChannel'
    });

    // start building things
    this._buildViews();
    this._showDefaultSequence();

    /** global transport events */
    rtf.on('sequence:complete closed interrupted', function() {
      globalPanel.set('isUpdating', false);
      globalPanel.set('activeConnectorName', null);
    });

    rtf.on('ready', function() {
      globalPanel.set('isUpdating', true);
      globalPanel.set('activeConnectorName',
        rtf.connectorsManager.getActiveConnector().name);
    });
  },

  _showDefaultSequence: function() {
    globalPanel.set('defaultSequence', window.rtfapi.Config.Sequence);
  },


  /*
    Views
   */


  _buildViews: function() {
    mainPanelContainer = new GlobalPanelView({ model: globalPanel });

    /** main panel container handlers */
    mainPanelContainer.on('start:updates', function() {
      rtf.startUpdates();
    });
    mainPanelContainer.on('stop:updates', function() {
      rtf.stopUpdates();
    });
    mainPanelContainer.on('shutdown:updates', function() {
      rtf.shutdown();
    });
    mainPanelContainer.on('switch:connectors', function() {
      rtf.switchToNextConnector();
    });
    
    /** left and right panels views */
    leftPanelConnector = new ConnectorPanelView({
      el: $('#leftConnector'),
      model: leftConnectorPanel
    });
    rightPanelConnector = new ConnectorPanelView({
      el: $('#rightConnector'),
      model: rightConnectorPanel
    });

    this._addConnectorPanelsHandlers();
  },

  _addMainPanelHandlers: function() {
   
  },

   // sa se faca active, cand primeste subscription confirmation
  _addConnectorPanelsHandlers: function() {
    var panelModel = null;

    _.each([leftPanelConnector, rightPanelConnector], function(panelView) {
      panelModel = panelView.model.get('name');

      /** confirm, infirm */
      rtf.on('confirmed:' + panelModel, function(state) {
        panelView.handleSubscriptionConfirmation();
      });
      rtf.on('infirmed:' + panelModel, function(state) {
        panelView.handleSubscriptionInfirmation();
      });

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