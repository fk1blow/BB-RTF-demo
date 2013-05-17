
// Global panel view implementation

define(['skm/util/Logger',
  'views/ConsoleView'],
  function(SKMLogger, ConsoleView)
{
'use strict';


var Logger = SKMLogger.create();


var GlobalPanelView = Backbone.View.extend({
  el: $('#centerContainer'),

  events: {
    'click #startUpdates': 'handleStartUpdates',
    'click #stopUpdates': 'handleStopUpdates',
    'click #shutdown': 'handleShutdown',
    'click #switchConnectors': 'handleSwitchConnectors'
  },

  consoleView: null,

  initialize: function() {
    this.model.on('change:defaultSequence', function(obj, val) {
      this.$el.find('.Sequence')
        .removeClass('StateNull').addClass('StateActive')
        .html(val.toString());
    }, this);

    this.model.on('change:activeConnectorName', function(model) {
      this._toggleActiveConnectorType(model.get('activeConnectorName'));
      this.consoleView.printLine("active connector changed to : ",
        model.get('activeConnectorName') || 'none');
    }, this);

    this.model.on('change:isUpdating', function() {
      this._toggleIsUpdating(this.$el.find('.IsUpdating'), arguments[1]);
      this.consoleView.printLine("rtf state : ", arguments[1] ? "started" : "closed");
    }, this);

    this.model.on('change:sequence', function() {
      this.consoleView.printLine("sequence : ", arguments[1]);
    }, this);

    this.model.on('change:reconnecting', function() {
      this.consoleView.printLine("reconnecting : ", arguments[1]);
    }, this);

    this.model.on('change:activeConnectorUrl', function() {
      this.consoleView.printLine("connected to : ", arguments[1]);
    }, this);

    this.consoleView = new ConsoleView({ el: this.$el.find('.Console') });
  },

  handleStartUpdates: function(evt) {
    evt.preventDefault();
    this.trigger('start:updates');
    this.consoleView.printLine("will start updates");
  },

  handleStopUpdates: function(evt) {
    evt.preventDefault();
    this.trigger('stop:updates');
    this.consoleView.printLine("will stop updates");
  },

  handleShutdown: function(evt) {
    evt.preventDefault();
    this.trigger('shutdown:updates');
    this.consoleView.printLine("shutting down...");
  },

  handleSwitchConnectors: function(evt) {
    evt.preventDefault();
    this.trigger('switch:connectors');
    this.consoleView.printLine("switching connectors...");
  },

  _toggleActiveConnectorType: function(connectorTypeName) {
    var toRemove = '', toAdd = '';
    var targetEl = this.$el.find('.ActiveConnector');
    var connectorName = connectorTypeName || 'null';

    if ( targetEl.is('.StateInactive') ) {
      toAdd = 'StateActive';
      toRemove = 'StateInactive';
    } else {
      toAdd = 'StateInactive';
      toRemove = 'StateActive';
    }

    targetEl.removeClass(toRemove).addClass(toAdd).html(connectorName);
  },

  _toggleIsUpdating: function(targetEl, val) {
    var toRemove = '', toAdd = '';

    if ( targetEl.is('.StateInactive') ) {
      toRemove = 'StateInactive';
      toAdd = 'StateActive';
    } else {
      toRemove = 'StateActive';
      toAdd = 'StateInactive';
    }

    targetEl.removeClass(toRemove).addClass(toAdd).html(val.toString());
  }
});


return GlobalPanelView;


});