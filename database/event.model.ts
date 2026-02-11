import { Schema, model, models, Document } from 'mongoose';

// TypeScript interface for Event document
export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    overview: { type: String, required: true, trim: true, maxlength: 500 },
    image: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    mode: { type: String, required: true, enum: ['online', 'offline', 'hybrid'] },
    audience: { type: String, required: true, trim: true },
    agenda: { type: [String], required: true, validate: (v: string[]) => v.length > 0 },
    organizer: { type: String, required: true, trim: true },
    tags: { type: [String], required: true, validate: (v: string[]) => v.length > 0 },
  },
  { timestamps: true }
);

// ------------------------
// Pre-save hook using async/await ✅
// ------------------------
EventSchema.pre<IEvent>('save', async function () {
  // Generate slug
  if (this.isModified('title') || this.isNew) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Normalize date
  if (this.isModified('date')) {
    const dateObj = new Date(this.date);
    if (isNaN(dateObj.getTime())) throw new Error('Invalid date format');
    this.date = dateObj.toISOString().split('T')[0];
  }

  // Normalize time
  if (this.isModified('time')) {
    const timeRegex = /^(\d{1,2}):(\d{2})(\s*(AM|PM))?$/i;
    const match = this.time.trim().match(timeRegex);
    if (!match) throw new Error('Invalid time format');

    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[4]?.toUpperCase();

    if (period) {
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
    }

    if (hours < 0 || hours > 23 || parseInt(minutes) < 0 || parseInt(minutes) > 59)
      throw new Error('Invalid time values');

    this.time = `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
});

// ------------------------
// Indexes
// ------------------------
EventSchema.index({ slug: 1 }, { unique: true });
EventSchema.index({ date: 1, mode: 1 });

// ------------------------
// Model
// ------------------------
const Event = models.Event || model<IEvent>('Event', EventSchema);
export default Event;
