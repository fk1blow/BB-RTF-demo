requirejs.config({
  baseUrl: 'js',
  paths: {
    "lib": "lib",
    "app": "app",

    "views": "app/views",
    "controllers": "app/controllers",
    // "templates": "app/templates",
    "models": "app/models",

    "skm": "lib/skm"
  }
});


require(['app/application', 'lib/console-wrapper']);