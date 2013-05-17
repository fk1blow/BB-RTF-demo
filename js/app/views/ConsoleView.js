
// Console panel view implementation

define(['skm/util/Logger'],
  function(SKMLogger)
{
'use strict';


var Logger = SKMLogger.create();


var ConsoleView = Backbone.View.extend({
  initialize: function() {
    this._initializeConsoleMarkup();
  },

  _listContainerEl: null,

  printLine: function() {
    var $line = null;
    var message = [].slice.call(arguments).join("");

    if ( message ) {
      $line = this._getLine();
      $line.html(message);
      this._insertNewLine($line);
    }
  },

  _insertNewLine: function(line) {
    var el = this._listContainerEl;
    el.append(line);
    this.$el.scrollTop(el.height());
  },

  _getLine: function() {
    return $('<li/>');
  },

  _initializeConsoleMarkup: function() {
    var $list = this._listContainerEl = $('<ul/>');
    this.$el.html($list);
  }
});


return ConsoleView;


});