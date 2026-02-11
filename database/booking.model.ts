import { Schema, model, models, Document, Types } from 'mongoose';
import Event from './event.model';

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (email: string) {
          // RFC 5322 compliant email validation regex
          const emailRegex =
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
          return emailRegex.test(email);
        },
        message: 'Please provide a valid email address',
      },
    },
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
  }
);

// ------------------------
// Pre-save hook using async/await ✅
// ------------------------
BookingSchema.pre<IBooking>('save', async function () {
  // Only validate eventId if it's new or modified
  if (this.isModified('eventId') || this.isNew) {
    const eventExists = await Event.findById(this.eventId).select('_id');

    if (!eventExists) {
      const error = new Error(`Event with ID ${this.eventId} does not exist`);
      error.name = 'ValidationError';
      throw error; // throw instead of using next
    }
  }
});

// ------------------------
// Indexes
// ------------------------
BookingSchema.index({ eventId: 1 });
BookingSchema.index({ eventId: 1, createdAt: -1 });
BookingSchema.index({ email: 1 });
BookingSchema.index({ eventId: 1, email: 1 }, { unique: true, name: 'uniq_event_email' });

// ------------------------
// Model
// ------------------------
const Booking = models.Booking || model<IBooking>('Booking', BookingSchema);
export default Booking;
