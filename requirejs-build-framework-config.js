({
  baseUrl: "./js",

  out: 'build/RTFApi.build.js',

  // By default, if no "optimize" value is declared it will uglify
  // and minimize the build filed
  // optimize: "uglify",
  optimize: "none",

  include: ["skm/rtf/RTFApi"],

  // preserveLicenseComments: true,

  paths: {
    "skm": "/Users/dragos/Sites/SKeeM/js/lib/skm"
  }
})


