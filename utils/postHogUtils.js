const {PostHog} = require('posthog-node');
const {getPostHogEventWithParams} = require('../constants');
const config = require('config');

const apiKey = config.get('posthogAPIKey');
const hostUrl = config.get('posthogHost');
const env = config.get('env');

const postHogClient = new PostHog(apiKey, {
  host: hostUrl,
});

// Road trip created event
const tripCreationStartedEvent = ({bookingId, draftId, productTitle}) =>
  postHogClient.capture({
    distinctId: bookingId,
    event: getPostHogEventWithParams({eventCategory: 'info.start'}),
    properties: {
      booking_id: bookingId,
      draft_id: draftId,
      product_title: productTitle,
      env,
    },
  });

// Road trip successfully completed event
const tripCreationSuccessEvent = ({bookingId, draftId, productTitle}) =>
  postHogClient.capture({
    distinctId: bookingId,
    event: getPostHogEventWithParams({eventCategory: 'success.trip_creation'}),
    properties: {
      booking_id: bookingId,
      draft_id: draftId,
      product_title: productTitle,
      env,
    },
  });

// Road trip creation failed event
const tripCreationFailedEvent = ({
  bookingId,
  draftId,
  productTitle,
  city,
  checkInMonth,
  errorCode,
}) =>
  postHogClient.capture({
    distinctId: bookingId,
    event: getPostHogEventWithParams({
      eventCategory: 'error',
      subCategory: errorCode,
    }),
    properties: {
      booking_id: bookingId,
      draft_id: draftId,
      product_title: productTitle,
      city,
      check_in_month: checkInMonth,
      env,
    },
  });

// Time consumed for creating a road trip
const tripCreationDurationEvent = ({
  bookingId,
  draftId,
  productTitle,
  formattedDuration,
}) =>
  postHogClient.capture({
    distinctId: bookingId,
    event: getPostHogEventWithParams({eventCategory: 'info.duration'}),
    properties: {
      booking_id: bookingId,
      draft_id: draftId,
      product_title: productTitle,
      duration_seconds: formattedDuration,
      env,
    },
  });

module.exports = {
  tripCreationStartedEvent,
  tripCreationSuccessEvent,
  tripCreationFailedEvent,
  tripCreationDurationEvent,
};
