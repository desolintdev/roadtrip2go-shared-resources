const mongoose = require('mongoose');
const {ProductsStatuses} = require('./constants');
const Schema = mongoose.Schema;

const packagesSchema = new Schema(
  {
    _id: false,
    stops: {
      type: Map,
      of: Number,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {toObject: {virtuals: true}, toJSON: {virtuals: true}}
);

packagesSchema.virtual('noOfNights').get(function () {
  return Array.from(this.stops?.values()).reduce(
    (total, nights) => total + nights,
    0
  );
});

const topicsSchema = new Schema({
  _id: false,
  en: {
    type: String,
    required: true,
  },
  nl: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
});

const featuresSchema = new Schema({
  _id: false,
  en: {
    type: String,
    required: true,
  },
  nl: {
    type: String,
    required: true,
  },
});

const distancesAndDurationsSchema = new Schema({
  _id: false,
  origin: {
    type: Map,
    required: true,
  },
  destination: {
    type: Map,
    required: true,
  },
  distance: {
    type: Map,
    required: true,
  },
  duration: {
    type: Map,
    required: true,
  },
});

const productsSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    cities: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Cities',
      default: [],
    },
    regions: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Regions',
      default: [],
    },
    ferries: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Ferries',
      default: [],
    },
    stops: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    packages: {
      type: Map,
      of: packagesSchema,
    },
    topics: {
      type: [topicsSchema],
    },
    features: {
      type: [featuresSchema],
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    profitPercentage: {
      type: Number,
      default: 0,
    },
    images: {
      type: [String],
    },
    distancesAndDurations: {
      type: [distancesAndDurationsSchema],
    },
    status: {
      type: String,
      enum: ProductsStatuses,
      default: 'draft',
    },
    geoGraphicRegions: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Flags',
    },
    themes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Flags',
    },
    tags: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Flags',
    },
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guides',
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agents',
    },
  },
  {timestamps: true, toObject: {virtuals: true}, toJSON: {virtuals: true}}
);

module.exports = mongoose.model('Products', productsSchema);
