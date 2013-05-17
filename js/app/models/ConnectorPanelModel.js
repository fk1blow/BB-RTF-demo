
// Specific panel model implementation

define(['skm/k/Object',
  'skm/util/Logger'],
  function(SKMObject, SKMLogger)
{
'use strict';


var Logger = SKMLogger.create();


var ConnectorPanelModel = Backbone.Model.extend({
  defaults: {
    name: 'subscription',
    active: false,
    params: null
  }
});


return ConnectorPanelModel;


});