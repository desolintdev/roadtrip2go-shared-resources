const {PostHog} = require('posthog-node');
const {POSTHOG_EVENT} = require('../constants');
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
    event: POSTHOG_EVENT.road_trip_creation_started.value,
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
    event: POSTHOG_EVENT.road_trip_creation_success.value,
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
    event: POSTHOG_EVENT.road_trip_creation_failed.value,
    properties: {
      booking_id: bookingId,
      draft_id: draftId,
      product_title: productTitle,
      city,
      check_in_month: checkInMonth,
      error_code: errorCode,
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
    event: POSTHOG_EVENT.road_trip_creation_duration.value,
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
