
// Global panel view implementation

define(['skm/util/Logger'],
  function(SKMLogger)
{
'use strict';


var Logger = SKMLogger.create();


var ConnectorPanelView = Backbone.View.extend({
  events: {
    'click .addChannel': 'handleAddChanneld',
    'click .removeChannel': 'handleRemoveChannel'
  },

  handleSubscriptionConfirmation: function() {
    var el = this.$el.find('h2 span.State');
    var toAdd = 'StateActive';
    var toRemove = 'StateInactive';
    el.removeClass(toRemove).addClass(toAdd).html('active');
  },

  handleSubscriptionInfirmation: function() {
    var el = this.$el.find('h2 span.State');
    var toAdd = 'StateInactive';
    var toRemove = 'StateActive';
    el.removeClass(toRemove).addClass(toAdd).html('inactive');
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