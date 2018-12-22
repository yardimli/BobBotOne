'use strict';

/**
 * @module MotorHat/Servo
 */

var debug = require('debug')('motor-hat:servolib');
var parambulator = require('parambulator');

var errHdlr = function errHdlr(err) {
  if (err) {
    throw new Error(err);
  }
};

/**
 * Creates a servo motor controller.
 * Pass in an options object to generate an uninitialized ServoLib object.
 *
 * @example Basic Usage:
 *
 * const opts = {
 *  pwm: pwm,
 *  pin: 1,
 *  min: 0.7,
 *  max: 3.2,
 *  freq: 1600
 * };
 *
 * const servo = require('./servo.js')(opts);
 *
 * @param {Object} opts Servo controller initialization options.
 * @param {Object} opts.pwm PWM Interface Object
 * @param {Number} opts.pin Servo controller pin. Which pin (0 to 15) is the servo connected to?
 * @param {Number} opts.min Duration in ms of pulse at position 0.
 * @param {Number} opts.max Duration in ms of pulse at position 100.
 * @param {Number} opts.freq PWM Controller frequency for the servo.
 * @returns {module:MotorHat/Servo~servo}
 */
module.exports = function Servo(opts) {
  var posspec = parambulator({
    pos: {
      type$: 'number',
      min$: 0,
      max$: 100
    }
  });
  var optspec = parambulator({
    pin: {
      type$: 'number',
      required$: true,
      notempty: true,
      min$: 0,
      max$: 15
    },
    pwm: 'object$, required$, notempty$',
    min: {
      type$: 'number',
      default$: 0.7
    },
    max: {
      type$: 'number',
      default$: 3.2
    },
    freq: {
      type$: 'number',
      default$: 50
    }
  });

  var options = void 0;
  var minCount = void 0;
  var maxCount = void 0;

  var calculateMinMax = function calculateMinMax() {
    minCount = options.min * options.freq * 4096 / 1000;
    maxCount = options.max * options.freq * 4096 / 1000;
  };

  /**
   * Move Servo to desired position.
   *
   * @instance
   * @memberOf module:MotorHat/Servo~servo
   * @param {Number} pos Relative position (0% to 100%).
   */
  var moveTo = function moveTo(pos) {
    posspec.validate({ pos: pos }, errHdlr);
    var count = minCount + pos / 100 * (maxCount - minCount);

    options.pwm.setPWMFreqSync(options.freq);
    options.pwm.setPWMSync(options.pin, 0, count);
    debug('moveTo(): Moved servolib to position ' + pos + '% = ' + count + ' counts.');
  };

  // @name {module:MotorHat/Servo~servo#calibrate}
  /**
   * Calibrate the limits for the servolib
   *
   * @instance
   * @memberOf module:MotorHat/Servo~servo
   * @param {Number} freq The update freq in Hz
   * @param {Number} min  The min. pulse in ms
   * @param {Number} max  The max. pulse in ms
   */
  var calibrate = function calibrate(freq, min, max) {
    options.freq = freq;
    options.min = min;
    options.max = max;
    calculateMinMax();
    debug('calibrate(): Set new Servo Update Freq: %d', options.freq);
    debug('calibrate(): Set new minimum pulse ' + options.min + ' ms = ' + minCount + ' counts.');
    debug('calibrate(): Set new maximum pulse ' + options.max + ' ms = ' + maxCount + ' counts.');
  };

  /**
   * Servo Controller Object
   *
   * @namespace servo
   * @see Use {@link module:MotorHat/Servo|Servo()} for object creation.
   * @see Use {@link module:MotorHat/Servo~servo#init} for object initialization.
   * @type {Object}
   */
  var servo = {
    moveTo: moveTo,
    calibrate: calibrate
  };

  optspec.validate(opts, errHdlr);
  options = opts;
  calculateMinMax();
  return Object.create(servo);
};
