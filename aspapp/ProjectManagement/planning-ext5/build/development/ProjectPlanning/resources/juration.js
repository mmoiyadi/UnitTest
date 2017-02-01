/*
 * juration - a natural language duration parser
 * https://github.com/domchristie/juration
 *
 * Copyright 2011, Dom Christie
 * Licenced under the MIT licence
 *
 */

// MODIFIED BY EDS - change days/weeks/months/years to use 8-hour days; allow only minutes/hours/days
(function() {

  var HOURS_PER_DAY = 8,
      SECONDS_PER_DAY = HOURS_PER_DAY * 3600,
      DAYS_PER_WEEK = 5;

  var UNITS = {
    // seconds: {
    //   patterns: ['second', 'sec', 's'],
    //   value: 1,
    //   formats: {
    //     'chrono': '',
    //     'micro':  's',
    //     'short':  'sec',
    //     'long':   'second'
    //   }
    // },
    minutes: {
      patterns: ['minute', 'min', 'm(?!s)'],
      value: 60,
      formats: {
        'chrono': ':',
        'micro':  'm',
        'short':  'min',
        'long':   'minute'
      }
    },
    hours: {
      patterns: ['hour', 'hr', 'h'],
      value: 3600,
      valueToCompare: 60,
      formats: {
        'chrono': ':',
        'micro':  'h',
        'short':  'hr',
        'long':   'hour'
      }
    },
    days: {
      patterns: ['day', 'dy', 'd'],
      value: SECONDS_PER_DAY,
      valueToCompare:HOURS_PER_DAY,
      formats: {
        'chrono': ':',
        'micro':  'd',
        'short':  'day',
        'long':   'day'
      }
    }
    // ,weeks: {
    //   patterns: ['week', 'wk', 'w'],
    //   value: SECONDS_PER_DAY * DAYS_PER_WEEK,
    //   formats: {
    //     'chrono': ':',
    //     'micro':  'w',
    //     'short':  'wk',
    //     'long':   'week'
    //   }
    // },
    // months: {
    //   patterns: ['month', 'mon', 'mo', 'mth'],
    //   value: SECONDS_PER_DAY * DAYS_PER_WEEK * 4,
    //   formats: {
    //     'chrono': ':',
    //     'micro':  'm',
    //     'short':  'mth',
    //     'long':   'month'
    //   }
    // },
    // years: {
    //   patterns: ['year', 'yr', 'y'],
    //   value: SECONDS_PER_DAY * DAYS_PER_WEEK * 365,
    //   formats: {
    //     'chrono': ':',
    //     'micro':  'y',
    //     'short':  'yr',
    //     'long':   'year'
    //   }
    // }
  };
   var setHoursPerDay = function(hoursPerDay){
       UNITS["days"].value = hoursPerDay * 3600;
       UNITS["days"].valueToCompare = hoursPerDay;
    }   
  var stringify = function(seconds, options) {
    
    if(!_isNumeric(seconds)) {
      throw "juration.stringify(): Unable to stringify a non-numeric value";
    }
    
    if((typeof options === 'object' && options.format !== undefined) && (options.format !== 'micro' && options.format !== 'short' && options.format !== 'long' && options.format !== 'chrono')) {
      throw "juration.stringify(): format cannot be '" + options.format + "', and must be either 'micro', 'short', or 'long'";
    }
    
    var defaults = {
      format: 'long'
    };
    
    var opts = _extend(defaults, options);
    
    var units = ['days', 'hours', 'minutes'],
      values = [];
    for(var i = 0, len = units.length; i < len; i++) {
      if(i === 0) {
        values[i] = Math.floor(seconds / UNITS[units[i]].value);
      }
      else {
        values[i] = Math.floor((seconds % UNITS[units[i-1]].value) / UNITS[units[i]].value);
      }
      if(opts.format === 'micro' || opts.format === 'chrono') {
        values[i] += UNITS[units[i]].formats[opts.format];
      }
      else {
        values[i] += ' ' + _pluralize(values[i], UNITS[units[i]].formats[opts.format]);
      }
    }
    var output = '';
    for(i = 0, len = values.length; i < len; i++) {
      if(values[i].charAt(0) !== "0" && opts.format != 'chrono') {
        output += values[i] + ' ';
      }
      else if (opts.format == 'chrono') {
        output += _padLeft(values[i]+'', '0', i==values.length-1 ? 2 : 3);
      }
    }
    return output.replace(/\s+$/, '').replace(/^(00:)+/g, '').replace(/^0/, '');
  };
  
  var parse = function(string) {
    
    // Make "days" the default unit
    if (_isNumeric(string)) {
      string += " days";
    }

    // returns calculated values separated by spaces
    for(var unit in UNITS) {
      for(var i = 0, mLen = UNITS[unit].patterns.length; i < mLen; i++) {
        var regex = new RegExp("((?:\\d+\\.\\d+)|\\d+)\\s?(" + UNITS[unit].patterns[i] + "s?(?=\\s|\\d|\\b))", 'gi');
        string = string.replace(regex, function(str, p1, p2) {
          return " " + (p1 * UNITS[unit].value).toString() + " ";
        });
      }
    }
    
    var sum = 0,
        numbers = string
                    .replace(/(?!\.)\W+/g, ' ')                       // replaces non-word chars (excluding '.') with whitespace
                    .replace(/^\s+|\s+$|(?:and|plus|with)\s?/g, '')   // trim L/R whitespace, replace known join words with ''
                    .split(' ');
    
    for(var j = 0, nLen = numbers.length; j < nLen; j++) {
      if(numbers[j] && isFinite(numbers[j])) {
         sum += parseInt(numbers[j]);
      } else if(!numbers[j]) {
        throw "juration.parse(): Unable to parse: a falsey value";
      } else {
        // throw an exception if it's not a valid word/unit
        throw "juration.parse(): Unable to parse: " + numbers[j].replace(/^\d+/g, '');
      }
    }
    return sum;
  };
  
  // _padLeft('5', '0', 2); // 05
  var _padLeft = function(s, c, n) {
      if (! s || ! c || s.length >= n) {
        return s;
      }
      
      var max = (n - s.length)/c.length;
      for (var i = 0; i < max; i++) {
        s = c + s;
      }
      
      return s;
  };
  
  var _pluralize = function(count, singular) {
    return count == 1 ? singular : singular + "s";
  };
  
  var _isNumeric = function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  };
  
  var _extend = function(obj, extObj) {
    for (var i in extObj) {
      if(extObj[i] !== undefined) {
        obj[i] = extObj[i];
      }
    }
    return obj;
  };
  var stringifyToDays = function(seconds,options){
    if(!_isNumeric(seconds)) {
      throw "juration.stringify(): Unable to stringify a non-numeric value";
    }
    
    if((typeof options === 'object' && options.format !== undefined) && (options.format !== 'micro' && options.format !== 'short' && options.format !== 'long' && options.format !== 'chrono')) {
      throw "juration.stringify(): format cannot be '" + options.format + "', and must be either 'micro', 'short', or 'long'";
    }
    
    var defaults = {
      format: 'long'
    };
    
    var opts = _extend(defaults, options);
    /******
    Algorithm: 
    1)First check if seconds value is greater than number of seocnds in a minute (i.e 60), 
    ---------if yes divide the seconds value with number of seconds in minute which will convert seconds to minute.
    ---------if no, display the seconds values in seconds format ( this is not a valid case)
    2)Second check if minutes value greater than number of minutes in a hour(i.e 60),
    ---------if yes, divide the minutes value with number of minutes in hour which will convert minutes to hour.
    ---------if no, display the minutes value in minutes format
    3)Third check if hours value greater than number of hours in day(i.e 8),
    ---------if yes, divide the hours with number of hours in day which will convert hours to days.
    ---------if no, display the hours value in hours format
    ******/
    var units = ['minutes', 'hours', 'days'],
      value=0,//default value
      minHrDy_appendStrIdx=2; //default to days
    for(var i = 0, len = units.length; i < len; i++) {
      if(i==0){
        if(seconds >= UNITS[units[i]].value){
          value = Math.abs(seconds/UNITS[units[i]].value);
          minHrDy_appendStrIdx = i;
        }
      }
      else{
        if(value >= UNITS[units[i]].valueToCompare){
          value = Math.abs(value/UNITS[units[i]].valueToCompare);
          minHrDy_appendStrIdx = i;
        }
        else
          break;
      }      
    }
    if(value % 1 != 0)
        value = value.toFixed(1);
      if(value %1 == 0){
      value = parseInt(value);
    }
    if(opts.format === 'micro' || opts.format === 'chrono') {
      value += UNITS[units[minHrDy_appendStrIdx]].formats[opts.format];
    }
    else {
      value += ' ' + _pluralize(value, UNITS[units[minHrDy_appendStrIdx]].formats[opts.format]);
    }    
    var output = '';
    if(value.charAt(0) !== "0" && opts.format != 'chrono') {
      output += value + ' ';
    }
    else if (opts.format == 'chrono') {
      output += _padLeft(value+'', '0', i==values.length-1 ? 2 : 3);
    }
    return output.replace(/\s+$/, '').replace(/^(00:)+/g, '').replace(/^0/, '');
  };
  
  var juration = {
    parse: parse,
    stringify: stringify,
    humanize: stringify,
    stringifyToDays:stringifyToDays,
    setHoursPerDay:setHoursPerDay
  };

  if ( typeof module === "object" && module && typeof module.exports === "object" ) {
    //loaders that implement the Node module pattern (including browserify)
    module.exports = juration;
  } else {
    // Otherwise expose juration
    window.juration = juration;

    // Register as a named AMD module
    if ( typeof define === "function" && define.amd ) {
      define("juration", [], function () { return juration; } );
    }
  }
})();