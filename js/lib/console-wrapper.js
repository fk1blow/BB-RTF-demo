// usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
// better vertsion => console.log.apply. If not, the method will log everything and insert that result inside an array. eg: log("ceva") //!# ["ceva"]
/* window.log = function() {
  if(this.console) return console.log.apply(console, Array.prototype.slice.call(arguments) );
};  */

// make it safe to use console.log always
(function(b){
	if(window.console) return;
	for(var d="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),a;a=d.pop();)b[a]=b[a] || function() {};
})(window.console = window.console || {});


// a small shortcut for console.log
// only for development debugging!!!
if ( window.console )
	window.cl = console.log.debug;
else
	window.cl = function() {};