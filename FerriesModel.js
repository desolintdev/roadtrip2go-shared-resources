const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const operatorSchema = new Schema({
  _id: false,
  id: {type: Number, required: true},
  name: {type: String, required: true},
  image: {type: String},
  allowPets: {type: Boolean, required: true},
  petConditions: {type: String},
  allowedPets: {type: [Map]},
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
  hasVehicles: {type: Boolean, default: false},
  isAlternativeRoute: {type: Boolean, default: false},
  hasTicketTypes: {type: Boolean, default: false},
  hasAccommodations: {type: Boolean, default: false},
  departureTime: {type: String, required: true},
  arrivalTime: {type: String, required: true},
  duration: {type: Number, required: true},
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

module.exports = mongoose.model('Ferry', ferrySchema);
