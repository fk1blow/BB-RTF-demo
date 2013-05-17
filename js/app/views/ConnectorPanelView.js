
// Global panel view implementation

define(['skm/util/Logger',
  'views/ConsoleView'],
  function(SKMLogger, ConsoleView)
{
'use strict';


var Logger = SKMLogger.create();


var ConnectorPanelView = Backbone.View.extend({
  events: {
    'click .addChannel': 'handleAddChanneld',
    'click .removeChannel': 'handleRemoveChannel'
  },

  consoleView: null,

  initialize: function() {
    this.consoleView = new ConsoleView({ el: this.$el.find('.Console') });
  },

  handleSubscriptionConfirmation: function() {
    var el = this.$el.find('h2 span.State');
    var toAdd = 'StateActive';
    var toRemove = 'StateInactive';
    el.removeClass(toRemove).addClass(toAdd).html('active');
    this.consoleView.printLine("channel subscription confirmed");
    this.consoleView.printLine("new channel added : ", this.model.get('name'));
  },

  handleSubscriptionInfirmation: function() {
    var el = this.$el.find('h2 span.State');
    var toAdd = 'StateInactive';
    var toRemove = 'StateActive';
    el.removeClass(toRemove).addClass(toAdd).html('inactive');
    this.consoleView.printLine(this.model.get('name'), ", channel removed");
  },

  handleAddChanneld: function(evt) {
    evt.preventDefault();
    this.trigger('activate:channel', this.model.attributes);
  },

  handleRemoveChannel: function(evt) {
    evt.preventDefault();
    this.trigger('deactivate:channel', this.model.get('name'));
  }
});


return ConnectorPanelView;


});