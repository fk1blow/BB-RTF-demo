
// Global panel view implementation

define(['skm/k/Object',
  'skm/util/Logger'],
  function(SKMObject, SKMLogger)
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

  initialize: function() {
    this.model.on('change:defaultSequence', function(obj, val) {
      this.$el.find('.Sequence')
        .removeClass('StateNull').addClass('StateActive')
        .html(val.toString());
    }, this);

    this.model.on('change:activeConnectorName', function(model) {
      this._toggleActiveConnectorType(model.get('activeConnectorName'));
    }, this);

    this.model.on('change:isUpdating', function() {
      this._toggleIsUpdating(this.$el.find('.IsUpdating'), arguments[1]);
    }, this);
  },

  handleStartUpdates: function(evt) {
    evt.preventDefault();
    this.trigger('start:updates');
  },

  handleStopUpdates: function(evt) {
    evt.preventDefault();
    this.trigger('stop:updates');
  },

  handleShutdown: function(evt) {
    evt.preventDefault();
    this.trigger('shutdown:updates');
  },

  handleSwitchConnectors: function(evt) {
    evt.preventDefault();
    this.trigger('switch:connectors');
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