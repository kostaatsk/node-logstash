var base_filter_buffer = require('../lib/base_filter_buffer'),
  util = require('util'),
  logger = require('log4node');

function FilterMultilineQueue() {
  base_filter_buffer.BaseFilterBuffer.call(this);
  this.mergeConfig({
    name: 'MultilineQueue',
    required_params: ['max_lines'],
    optional_params: ['max_delay'],
    default_values: {
      max_delay: 5000,
      counter: 0,
    },
    start_hook: this.start,
  });
}

util.inherits(FilterMultilineQueue, base_filter_buffer.BaseFilterBuffer);

FilterMultilineQueue.prototype.setInterval = function(delay) {
  var func = function() {
    var now = (new Date()).getTime();
    var to_be_deleted = [];
    for (var key in this.storage) {
      if (now - this.storage[key].last > delay) {
        logger.info('reset counter and send data by interval');
        this.counter = 0;
        this.sendMessage(key, this.storage[key].current);
        to_be_deleted.push(key);
      }
    }
    to_be_deleted.forEach(function(key) {
      delete this.storage[key];
    }.bind(this));
  }.bind(this);
  this.interval_id = setInterval(func, delay);
};

FilterMultilineQueue.prototype.start = function(callback) {
  logger.info('Initialized kokolala filter with counter: ' + this.counter + ', delay: ' + (this.max_delay));
  this.setInterval(this.max_delay);
  callback();
};

FilterMultilineQueue.prototype.process = function(data) {
  this.counter++;
  var key = this.computeKey(data);
  logger.info('counter is ' + this.counter + ' and max_lines is ' + this.max_lines);
  if (this.counter == this.max_lines) {
    logger.info('reset counter and send data by max_lines');
    this.sendIfNeeded(key);
    this.counter = 0;
  }
  this.store(key, data);
};

exports.create = function() {
  return new FilterMultilineQueue();
};
