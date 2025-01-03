const mongoose = require('mongoose');
const {DraftsStatuses, BOOKING_STATUSES, EVENT_STATUS} = require('./constants');
const Schema = mongoose.Schema;
const axios = require('axios');
const config = require('config');
const {
  tripCreationStartedEvent,
  tripCreationFailedEvent,
} = require('./utils/postHogUtils');
const {
  getDraftParams,
  prepareStopHotelEvent,
  sendCreationSuccessEvents,
} = require('./utils/draftsUtils');

const draftQuerySchema = new Schema({
  _id: false,
  noOfRooms: {
    type: Number,
    default: 1,
  },
  cancellable: {
    type: Boolean,
    default: false,
  },
  cheapest: {
    type: Boolean,
    default: false,
  },
  noOfDays: {
    type: Map,
  },
});

const draftGuestsSchema = new Schema({
  _id: false,
  adults: {
    type: Number,
    default: 0,
  },
  children: {
    type: Array,
    default: [],
  },
});

const timersSchema = new Schema({
  _id: false,
  creationStartTime: {type: Date, default: null},
  creationEndTime: {type: Date, default: null},
  recheckRatesStartTime: {type: Date, default: null},
  recheckRatesEndTime: {type: Date, default: null},
  paymentInitializationTime: {type: Date, default: null},
  bookingStartTime: {type: Date, default: null},
  bookingEndTime: {type: Date, default: null},
});

const draftsSchema = new Schema(
  {
    internalBookingId: {
      type: Number,
      required: true,
      index: {unique: true},
    },
    productId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: 'Products',
    },
    checkIn: {
      type: String,
      required: true,
    },
    checkOut: {
      type: String,
      required: true,
    },
    guests: {
      type: [draftGuestsSchema],
      required: true,
    },
    stops: {
      type: Map,
      required: true,
    },
    query: {
      type: draftQuerySchema,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    profitPercentage: {
      type: Number,
      default: 0,
    },
    providerAmount: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    profitAmount: {
      type: Number,
      default: 0,
    },
    beforeDiscountAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: DraftsStatuses,
      default: 'pending',
    },
    bookingStatus: {
      type: String,
      enum: DraftsStatuses,
      default: 'pending',
    },
    travellers: {
      type: Map,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    transactionId: {
      type: String,
    },
    timers: {
      type: timersSchema, // Use the separate timers schema here
      default: () => ({}), // Ensure timers object exists even if not explicitly set
    },
    eventStatus: {
      type: String,
      default: EVENT_STATUS.initialize.value,
    },
  },
  {timestamps: true, toObject: {virtuals: true}, toJSON: {virtuals: true}}
);

async function updateBookingStatus({doc, newStatus}) {
  try {
    let path =
      newStatus == BOOKING_STATUSES.failed.value ? 'failed' : 'success';

    doc.bookingStatus = newStatus;

    await doc.save();

    await axios.get(
      `${config.get('processBackendURL')}/bookings/notify/${path}/${doc._id}`
    );
  } catch (error) {}
}

draftsSchema.post('findOneAndUpdate', async function (doc, next) {
  const update = this.getUpdate();

  const updatedFields = update.$set || {};

  let stopBookingStatusUpdatedTo = null;

  for (let key in updatedFields) {
    if (key.includes('.bookingStatus')) {
      stopBookingStatusUpdatedTo = updatedFields[key];
      break;
    }
  }

  if (
    stopBookingStatusUpdatedTo === BOOKING_STATUSES.failed.value &&
    doc.bookingStatus !== BOOKING_STATUSES.failed.value
  ) {
    await updateBookingStatus({
      doc,
      newStatus: BOOKING_STATUSES.failed.value,
    });
  }

  const {stops: stopsObj} = doc;

  const stops = stopsObj.toJSON();

  if (stopBookingStatusUpdatedTo === BOOKING_STATUSES.completed.value) {
    let completed = 0;

    for (let stop in stops) {
      if (
        stops[stop].hotel.bookingStatus === BOOKING_STATUSES.completed.value
      ) {
        completed += 1;
      }
    }

    if (completed === Object.keys(stops).length) {
      await updateBookingStatus({
        doc,
        newStatus: BOOKING_STATUSES.completed.value,
      });
    }
  }

  let noOfResponsesArrived = 0;

  let noOfErrors = 0;

  for (let stop in stops) {
    if (stops[stop]?.hotel?.providerAmount) noOfResponsesArrived += 1;
    if (stops[stop]?.error) noOfErrors += 1;
  }

  if (noOfResponsesArrived === Object.keys(stops).length) {
    const roundedDiscountAmount = Math.floor(doc.discountAmount);
    doc.discountAmount = roundedDiscountAmount;
    doc.finalAmount = doc.beforeDiscountAmount - roundedDiscountAmount;

    await doc.save();
  }

  doc.status = noOfErrors > 0 ? BOOKING_STATUSES.error.value : doc.status;
  await doc.save();

  next();
});

draftsSchema.virtual('cancellationDate').get(function () {
  let cancellationDate = '';
  const stops = this.stops.toJSON();
  for (let stop in stops) {
    if (cancellationDate == '')
      cancellationDate = stops[stop]?.hotel?.cancellationDate;
    else if (
      stops[stop]?.hotel?.cancellationDate === null ||
      stops[stop]?.hotel?.cancellationDate < cancellationDate
    )
      cancellationDate = stops[stop]?.hotel?.cancellationDate;
  }
  return cancellationDate;
});

function populateMiddlewareFn(next) {
  this.populate(['productId']);
  next();
}

draftsSchema.pre('save', populateMiddlewareFn);
draftsSchema.pre('findOneAndUpdate', populateMiddlewareFn);

// Handles events after a new draft document is created and saved
async function handleEventAfterCreate(doc, next) {
  // If trip creation start time is not already set, initialize it
  if (!doc?.timers?.creationStartTime) {
    const internalBookingId = doc?.internalBookingId || null;
    const productTitle = doc?.productId?.title || null;
    const draftId = doc?._id;

    // Set trip creation start time to document creation time
    doc.timers.creationStartTime = doc?.createdAt;

    // Trigger the event indicating trip creation has started
    tripCreationStartedEvent({
      bookingId: internalBookingId,
      draftId,
      productTitle,
    });

    await doc.save();
  }

  next();
}

// Attach the event handler to the 'save' hook of the Draft schema
draftsSchema.post('save', handleEventAfterCreate);

// Processes updates to draft documents and triggers appropriate events
async function processEventAfterUpdate(draftDocument, next) {
  const updateDetails = this.getUpdate();

  // Check if the draft is in the "initialize" status
  const draftIsBeingGenerated =
    draftDocument?.eventStatus === EVENT_STATUS.initialize.value;

  if (draftIsBeingGenerated) {
    const updatedFields = updateDetails.$set || {};

    // Extract key draft-related parameters
    const {
      bookingId,
      productTitle,
      tripCreationStartTime,
      draftId,
      allResponsesReceived,
    } = getDraftParams({draftDocument});

    // Analyze updated fields for city, error codes, and check-in details
    const {cityName, errorCode, hasError, checkInMonth} = prepareStopHotelEvent(
      {
        updatedFields,
      }
    );

    // If an error is detected in the updated fields, trigger a failure event
    if (hasError) {
      tripCreationFailedEvent({
        bookingId,
        draftId,
        productTitle,
        city: cityName,
        checkInMonth,
        errorCode,
      });
      draftDocument.eventStatus = EVENT_STATUS.error.value; // Mark the draft with an error status
    }

    // If all required responses have been received, trigger success events
    if (allResponsesReceived) {
      sendCreationSuccessEvents({
        draftDocument,
        tripCreationStartTime,
        bookingId,
        draftId,
        productTitle,
      });
    }

    await draftDocument.save();
  }

  next();
}

// Attach the event handler to the 'findOneAndUpdate' hook of the Draft schema
draftsSchema.post('findOneAndUpdate', processEventAfterUpdate);

module.exports = mongoose.model('Drafts', draftsSchema);
