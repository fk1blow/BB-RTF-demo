
// Global panel model implementation

define(['skm/k/Object',
  'skm/util/Logger'],
  function(SKMObject, SKMLogger)
{
'use strict';


var Logger = SKMLogger.create();


var GlobalPanelModel = Backbone.Model.extend({
  defaults: {
    defaultSequence: [],
    activeConnectorName: null, // string
    isUpdating: false
  }
});


return GlobalPanelModel;


});