"use strict";


export function generateInteval (k) {
  let maxInterval = (Math.pow(2, k) - 1) * 1000;
  if (maxInterval > 30 * 1000) {
    maxInterval = 30 * 1000; // If the generated interval is more than 30 seconds, truncate it down to 30 seconds.
  }
  // generate the interval to a random number between 0 and the maxInterval determined from above
  return Math.random() * maxInterval;
}
