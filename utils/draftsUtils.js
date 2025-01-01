const {EVENT_STATUS} = require('../constants');
const {
  tripCreationSuccessEvent,
  tripCreationDurationEvent,
} = require('./postHogUtils');

// Extracts key parameters from the draft document for event processing
function getDraftParams({draftDocument}) {
  let totalResponses = 0;

  // Extract essential details from the draft document
  const bookingId = draftDocument?.internalBookingId || null;
  const productTitle = draftDocument?.productId?.title || null;
  const tripCreationStartTime = draftDocument?.tripCreationStartTime || null;
  const draftId = draftDocument?._id || null;

  // Parse stops from the draft document and calculate the total count
  const {stops: stopsObject} = draftDocument;
  const stops = stopsObject.toJSON();
  const totalStopsCount = Object.keys(stops).length;

  // Count stops that have received provider amount details
  for (const stopKey in stops) {
    if (stops[stopKey]?.hotel?.providerAmount) totalResponses += 1;
  }

  // Determine if all responses for stops have been received
  let allResponsesReceived = totalResponses === totalStopsCount;

  return {
    bookingId,
    productTitle,
    tripCreationStartTime,
    draftId,
    allResponsesReceived,
  };
}

// Prepares details about stop-level events, including errors and check-in information
function prepareStopHotelEvent({updatedFields}) {
  let cityName = null;
  let errorCode = null;
  let checkInMonth = null;
  let hasError = false;

  // Analyze updated fields to gather relevant event data
  for (const fieldKey in updatedFields) {
    if (updatedFields[fieldKey]?.stopName) {
      cityName = updatedFields[fieldKey]?.stopName;
    }
    if (updatedFields[fieldKey]?.error) {
      errorCode = updatedFields[fieldKey]?.error?.code;
      hasError = true; // Indicates if there are errors in the stop
    }
    if (updatedFields[fieldKey]?.checkIn) {
      const date = new Date(updatedFields[fieldKey]?.checkIn);
      checkInMonth = date.toLocaleString('en-US', {month: 'long'}); // Extract month from the check-in date
    }
  }

  return {
    cityName,
    errorCode,
    hasError,
    checkInMonth,
  };
}

// Sends success-related events for a trip creation process
function sendCreationSuccessEvents({
  draftDocument,
  tripCreationStartTime,
  bookingId,
  draftId,
  productTitle,
}) {
  // Update the event status to success
  draftDocument.eventStatus = EVENT_STATUS.success.value;

  // Calculate the duration of trip creation
  const tripCreationEndTime = new Date(); // End time
  const durationInSeconds =
    (tripCreationEndTime - tripCreationStartTime) / 1000; // Difference in milliseconds to seconds

  // Format the duration for logging
  const formattedDuration =
    durationInSeconds >= 60
      ? `${(durationInSeconds / 60).toFixed(2)} minutes`
      : `${durationInSeconds.toFixed(2)} seconds`;

  // Trigger event for trip creation duration
  tripCreationDurationEvent({
    bookingId,
    draftId,
    productTitle,
    formattedDuration,
  });

  // Trigger success event for trip creation
  tripCreationSuccessEvent({
    bookingId,
    draftId,
    productTitle,
  });
}

module.exports = {
  getDraftParams,
  prepareStopHotelEvent,
  sendCreationSuccessEvents,
};