requirejs.config({
  baseUrl: 'js',
  paths: {
    "lib": "lib",
    "app": "app",

    "views": "app/views",
    "controllers": "app/controllers",
    "models": "app/models",
    "templates": "app/templates",

    "skm": "http://10.0.3.98:82/SKeeM/js/lib/skm/"
  }
});


// require(['app/application', 'lib/console-wrapper']);
require(['app/application']);