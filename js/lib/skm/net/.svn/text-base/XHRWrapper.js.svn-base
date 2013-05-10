
// XHR Wrapper implementation

define(['skm/k/Object',
  'skm/util/Logger',
  'skm/util/Subscribable'],
  function(SKMObject, SKMLogger, Subscribable)
{
'use strict';


var Logger = SKMLogger.create();


var DefaultLibraryWrapper = window.jQuery || null;


// The XHR wrapper that will use
// Usually, this wrapper will be for jQuery's $.ajax method
// Direct reference to the Library that will provide the ajax api
var LibraryConfig = {
	wrapper: null,
	ajax: null,
	get: null,
	post: null
}


var XHRMessageDelegates = {
	handleOnComplete: function() {
		Logger.info('XHRWrapper.handleOnComplete');
		this._expectedClose = false;
		this.fire('complete');
	},

	handleOnSuccess: function(msg) {
		Logger.info('XHRWrapper.handleOnSuccess', msg);
		this._expectedClose = false;
		this.fire('success', msg);
	},

	handleOnError: function(err) {
		if ( ! this._expectedClose ) {
			Logger.info('XHRWrapper.handleOnError');
			this._expectedClose = false;
			this.fire('error', err);
		}
	}
}


var XHRWrapper = SKMObject.extend(Subscribable, XHRMessageDelegates, {
	/**
	 * Server url
	 * @type {String}
	 */
	url: null,

	httpMethod: 'POST',

	dataType: 'JSON',
	
	async: true,

	_wrapper: null,

	_request: null,

	_expectedClose: false,

	initialize: function() {
		Logger.debug('%cnew XHRWrapper', 'color:#A2A2A2');
		this._wrapper = LibraryConfig.wrapper || DefaultLibraryWrapper;
		this._request = null;
	},

	/**
	 * Sends a message through the AJAX connection
	 * using default method type - 'GET'
	 * @param  {Object} messageObj the message to be sened
	 */
	sendMessage: function(message, options) {
		Logger.info('XHRWrapper.send');
		this._doRequest(message, options);
		return this;
	},

	/**
	 * Send a message using a GET request
	 * @param  {Object} messageObj the message to be sened
	 */
	sendGetRequest: function(message, options) {
		Logger.info('XHRWrapper.sendGetRequest');
		var opt = options || {};
		opt.httpMethod = 'GET';
		this._doRequest(message, opt);
		return this;
	},

	/**
	 * Sends a message using a POST request
	 * @param  {Object} messageObj the message to be sened
	 */
	sendPostRequest: function(message, options) {
		Logger.info('XHRWrapper.sendPostRequest');
		var opt = options || {};
		opt.httpMethod = 'POST';
		this._doRequest(message, opt);
		return this;
	},

	/**
	 * Aborts a in-progress request
	 * @param  {Boolean} triggersError Should trigger error
	 * callback or not - [this._expectedClose]
	 */
	abortRequest: function(triggersError) {
		// if triggers error is true, it will trigger the error event
		if ( triggersError === true )
			this._expectedClose = false;
		// Set expected close, only it aborts the connection
		if ( this._request != null ) {
			this._expectedClose = true;
			this._request.abort();
		}
		// nullifies the request object
		this._resetRequestObject();
	},

	/**
	 * Sends an Ajax request, using the provided adapter
	 * @param  {Object} options an object used for
	 * AJAX setting(method, url, type, etc)
	 */
	_doRequest: function(messageData, options) {
		var opt = options || {};
		var httpMethod = opt.httpMethod || this.httpMethod;
		var dataType = opt.dataType || this.dataType;
		var async = opt.async || this.async;

		// Abort the request if there is one in progress
		this.abortRequest();

		this._request = this._wrapper.ajax({
			url: this.url,

			context: this,

			// http method
			type: httpMethod,
			
			async: async,

			// The type of data that you're expecting back from the server
			dataType: dataType,

			// Data sent to the server
			data: messageData,

			error: function (err) {
				this.handleOnError(err);
			},

			complete: function(msg) {
				this._resetRequestObject();
				this.handleOnComplete(msg);
			},

			success: function(msg) {
				this.handleOnSuccess(msg);
			}
		});
	},

	_resetRequestObject: function() {
		if ( this._request !== null )
			this._request = null;
	}
});


// return {
// 	Config: LibraryConfig,
// 	Wrapper: XHRWrapper
// };


/**
 * Temporarely hardcoded
 */
return XHRWrapper;


});