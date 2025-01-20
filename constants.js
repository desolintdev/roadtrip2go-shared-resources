const DraftsStatuses = ['pending', 'error', 'failed', 'completed', 'resolved'];

const ProductsStatuses = ['published', 'draft'];

const BOOKING_STATUSES = {
  pending: {value: 'pending'},
  failed: {value: 'failed'},
  completed: {value: 'completed'},
  error: {value: 'error'},
  resolved: {value: 'resolved'},
};

const POSTHOG_EVENT = {
  success: {
    value: 'success',
    subValues: {
      trip_creation: 'trip_creation',
      booking_completed: 'booking_completed',
    },
  },
  error: {value: 'error'}, // No subValues needed
  info: {
    value: 'info',
    subValues: {
      start: 'trip_creation_start',
      duration: 'trip_creation_duration',
    },
  },
};

/**
 * Gets the formatted event name for PostHog.
 *
 * Examples:
 * getPostHogEvent('success.trip_creation') => 'success_trip_creation'
 * getPostHogEvent('error') => 'error'
 * getPostHogEvent('invalid.path') => undefined
 */
const getPostHogEvent = ({path}) => {
  const [categoryKey, subKey] = path.split('.');
  const category = POSTHOG_EVENT[categoryKey];

  if (!category) return undefined;
  if (!subKey) return category.value; // If no subKey, return category value

  return category.subValues?.[subKey]
    ? `${category.value}_${category.subValues[subKey]}`
    : undefined;
};

const getPostHogEventWithParams = ({eventCategory, subCategory = ''}) => {
  const eventKey = getPostHogEvent({path: eventCategory});
  return subCategory ? `${eventKey}_${subCategory.toLowerCase()}` : eventKey;
};

const EVENT_STATUS = {
  initialize: {value: 'initialize'},
  success: {value: 'success'},
  error: {value: 'error'},
};

const FLAG_TYPES = {
  tag: {value: 'tag', name: 'Tag'},
  geoGraphicRegion: {value: 'geoGraphicRegion', name: 'Geo-Graphic Region'},
  theme: {value: 'theme', name: 'Theme'},
};

const FLAG_TYPES_ARR = Object.keys(FLAG_TYPES).map((type) => ({
  name: FLAG_TYPES[type].name,
  value: FLAG_TYPES[type].value,
}));

const FLAG_TYPES_KEYS_ARR = Object.keys(FLAG_TYPES);

module.exports = {
  DraftsStatuses,
  ProductsStatuses,
  BOOKING_STATUSES,
  POSTHOG_EVENT,
  EVENT_STATUS,
  FLAG_TYPES,
  FLAG_TYPES_ARR,
  FLAG_TYPES_KEYS_ARR,
  getPostHogEvent,
  getPostHogEventWithParams,
};
