const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

const draftsSchema = new Schema(
  {
    productId: {
      type: mongoose.Types.ObjectId,
      required: true,
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
    profitRate: {
      type: Number,
      default: 0,
    },
    providerRate: {
      type: Number,
      default: 0,
    },
    finalRate: {
      type: Number,
      default: 0,
    },
    amountBeforeDiscount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
  },
  {timestamps: true, toObject: {virtuals: true}, toJSON: {virtuals: true}}
);

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

module.exports = mongoose.model('Drafts', draftsSchema);
