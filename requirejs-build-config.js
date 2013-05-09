({
  baseUrl: "./js",

  // appDir: "./",

  // name: 'app',

  // modules: [
  //   {
  //     name: 'main',
  //     // exclude: [ "main" ]
  //   }
  // ],

  // dir: 'build',



  // START Single file build

  out: 'nextLiveMatchesBuild.js',

  include: ['main'],

  optimize: 'none',

  // END Single file build


  paths: {
    "lib": "lib",
    "app": "app",
    "views": "app/views",
    "controllers": "app/controllers",
    "templates": "app/templates",
    "models": "app/models",

    "console": "/Users/dragos/Sites/SKeeM/js/lib/console-wrapper",
    "skm": "/Users/dragos/Sites/SKeeM/js/lib/skm",
    // "rtf": "/Users/dragos/Sites/SKeeM/js/lib/skm/rtf",
    // "skm": "http://10.0.3.98:82/SKeeM/js/lib/skm",
    // "rtf": "/Users/dragos/Sites/SKeeM/js/lib/skm/rtf"
  }
})


