// Karma configuration
// Generated on Thu Apr 14 2016 16:31:01 GMT+0530 (India Standard Time)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      //'app/*.js',
      //'../app/*.js',
      //'../app/model/*.js',
      //'../app/store/*.js',
      //'../app/view/*.js'
	  "../lib/ext-5.1.1/build/ext-all-debug.js",
	  "../lib/alertify.min.js",
	  "../lib/jquery-1.11.1.min.js",
      "../lib/jquery-ui-1.10.4.min.js",
      "../lib/toastr.js",
	  "../resources/stl.js",
	  "../app/*.js",
	  "../resources/*.js",
	  "../app/view/*.js",
      "../testSuites/mockdata/*.js",
      '../testSuites/app/*spec.js',
	  '../testSuites/app/view/*spec.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress','html'],

    // the default configuration 
    htmlReporter: {
      outputFile: 'testPlanning.html', // where to put the reports  
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome', 'Firefox', 'IE'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
