const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const allowedPetsSchema = new Schema({
  _id: false,
  petType: {type: String},
  name: {type: String},
  maxAllowed: {type: Number},
});

const petsSchema = new Schema({
  allowed: {type: Boolean, required: true},
  conditions: {type: String},
  allowedTypes: {type: [allowedPetsSchema], default: []},
});

const operatorSchema = new Schema({
  _id: false,
  id: {type: Number, required: true},
  name: {type: String, required: true},
  image: {type: String},
});

const quoteSchema = new Schema({
  _id: false,
  price: {type: Number, required: true},
  isSpecialOffer: {type: Boolean, required: true},
});

const tripsSchema = new Schema({
  _id: false,
  operator: operatorSchema,
  quote: quoteSchema,
  isAlternativeRoute: {type: Boolean, default: false},
  hasTicketTypes: {type: Boolean, default: false},
  hasAccommodations: {type: Boolean, default: false},
  departureTime: {type: String, required: true},
  arrivalTime: {type: String, required: true},
  duration: {type: String, required: true},
  pets: {type: petsSchema},
  accommodationMessage: {type: String},
  petInstructions: {type: String},
  isPreferred: {type: Boolean, default: false},
});

// Schema for ports
const portSchema = new Schema({
  _id: false,
  name: {type: String, required: true},
  code: {type: String, required: true},
  address: {type: String},
  latitude: {type: Number, required: true},
  longitude: {type: Number, required: true},
});

// Main ferry schema
const ferrySchema = new Schema(
  {
    routeId: {type: Number, required: true, unique: true},
    routeName: {type: String, required: true},
    portFrom: {type: portSchema, required: true},
    portTo: {type: portSchema, required: true},
    type: {type: String, default: 'ferry'},
    trips: {type: [tripsSchema], required: true, default: []},
  },
  {timestamps: true, toObject: {virtuals: true}, toJSON: {virtuals: true}}
);

module.exports = mongoose.model('Ferries', ferrySchema);
