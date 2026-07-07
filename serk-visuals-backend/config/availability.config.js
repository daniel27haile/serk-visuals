// config/availability.config.js
/**
 * Default availability configuration.
 * Adjust these values to control when clients can book sessions.
 */
module.exports = {
  /** Days of the week that are open. 0=Sunday, 1=Monday … 6=Saturday */
  businessDays: [1, 2, 3, 4, 5, 6], // Mon–Sat; Sunday closed

  /** First bookable hour of the day (24h, server local time) */
  startHour: 10, // 10:00 AM

  /** Sessions must END by this hour */
  endHour: 18, // 6:00 PM

  /** Minutes between each displayed slot */
  slotIntervalMinutes: 30,

  /** Buffer added after each booking before the next can start */
  bufferMinutes: 30,

  /** How many days ahead clients are allowed to book */
  maxBookingDaysAhead: 90,
};
