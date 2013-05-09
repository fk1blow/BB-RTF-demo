  
// Application

define(['skm/rtf/RTFApi',
  'controllers/MainController'],
  function(RTF, MainController)
{
'use strict';



var mc = window.mc = MainController;

var host = 'dragos.betonvalue.com';


/*
  Sequence
 */

RTF.Config.Sequence = ['WebSocket', 'XHR']//.reverse();
// RTF.Config.Sequence = ['WebSocket'];
// RTF.Config.Sequence = ['XHR'];


/*
  WebSocket URL's
 */

RTF.Config.Connectors.WebSocket.url = 'ws://' + (host || window.location.host) + '/rtfws';
// RTF.Config.Connectors.WebSocket.url = 'ws://stage.betonvalue.com/rtfws';
RTF.Config.Connectors.WebSocket.maxReconnectAttempts = 3;


/*
  XHR URL's
 */

RTF.Config.Connectors.XHR.url = 'http://' + window.location.host + '/rtfajax';
RTF.Config.Connectors.XHR.maxReconnectAttempts = 5;


/*
  Subscription
 */

window.rtfapi = RTF;
var rtf = window.rtf = RTF.Api.getInstance();
rtf.addUrlParameter('clientId', (new Date).getTime());
// rtf.addUrlParameter('jSessionId', jsID);
rtf.addUrlParameter('jSessionId', '0A4F2B41AC405DAF47DABBAA86F15469');


rtf.on('message:nextLiveMatches', function(updatesObj) {
  console.log('______________________________________________________')
  console.log('message:nextLiveMatches', updatesObj);
  
  // _.each(updatesObj, function(json, type) {
  //   matchesTableController.processMatchesListUpdates(type, json);
  // });
});


rtf.on('all', function() {
  cl('rtf > ', arguments);
});


/*rtf.on('error:nextLiveMatches', function(updatesObj) {
  console.log('%cmessage:error', 'color:red', updatesObj);
});
*/

// add [connector] param, an instance of Connector
// to read and set the model's connectorType string
/*rtf.on('connector:activated', function() {
  mc.connectorsAreActivated()
})*/
/*rtf.on('connector:deactivated', function() {
  cl('connector deactivated... for some reason')
});

rtf.on('connector:closed', function() {
  console.log('connector closed....');
});*/



// Adding a Channel
/*rtf.addChannel({
  name: 'nextLiveMatches',
  params: { matches: 10, live: true }
});*/



// rtf.startUpdates();


mc.init();


});