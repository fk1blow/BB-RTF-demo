({
  baseUrl: "./js",

  // appDir: "./",

  // name: 'app',

  // modules: [
    // {
      // name: "lib/almond.js"
  //     name: 'main',
  //     // exclude: [ "main" ]
    // }
  // ],

  // dir: 'build',



  // START Single file build

  out: 'build/BB-RTF-demo.build.js',

  // By default, if no "optimize" value is declared it will uglify
  // and minimize the build filed
  // optimize: "uglify",
  // optimize: "none",

  include: ["main"],
  // include: ["skm/rtf/RTFApi", "app/application"],

  // If u want to build only the framework
  // use this exclude the actual application
  // excludeShallow: ["app/application"],

  // END Single file build


  preserveLicenseComments: false,

  paths: {
    "lib": "lib",
    "app": "app",
    "views": "app/views",
    "controllers": "app/controllers",
    "templates": "app/templates",
    "models": "app/models",

    // "console": "/Users/dragos/Sites/SKeeM/js/lib/console-wrapper",
    "skm": "/Users/dragos/Sites/SKeeM/js/lib/skm",
    // "rtf": "/Users/dragos/Sites/SKeeM/js/lib/skm/rtf",
    // "skm": "http://10.0.3.98:82/SKeeM/js/lib/skm",
    // "rtf": "/Users/dragos/Sites/SKeeM/js/lib/skm/rtf"
  }
})


