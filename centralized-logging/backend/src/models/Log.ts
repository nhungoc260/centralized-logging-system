import mongoose, { Document, Schema } from 'mongoose';

// Log levels supported by the system
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface ILog extends Document {
  service: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  traceId?: string;
  createdAt: Date;
}

const LogSchema = new Schema<ILog>(
  {
    service: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    level: {
      type: String,
      required: true,
      enum: ['info', 'warn', 'error', 'debug'],
      lowercase: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    traceId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
    versionKey: false,
  }
);

// ============ INDEXES ============
// Compound index for common query pattern: filter by service + level
LogSchema.index({ service: 1, level: 1 });

// Index for time-range queries (most common)
LogSchema.index({ timestamp: -1 });

// Index for text search on message
LogSchema.index({ message: 'text' });

// Compound index for dashboard queries
LogSchema.index({ level: 1, timestamp: -1 });

// TTL index - auto-delete logs after retention period (7 days default)
// The actual expiry is controlled by the createdAt + expireAfterSeconds
LogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: parseInt(process.env.LOG_RETENTION_DAYS || '7') * 24 * 60 * 60 }
);

// ============ METHODS ============
LogSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  return obj;
};

export const Log = mongoose.model<ILog>('Log', LogSchema);
