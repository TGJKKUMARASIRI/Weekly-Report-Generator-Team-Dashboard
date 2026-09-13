import { Schema, model } from 'mongoose';

export enum ReportStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  NEEDS_CORRECTION = 'NEEDS_CORRECTION',
  APPROVED = 'APPROVED'
}

const taskSchema = new Schema({
  taskName: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  plannedPercent: { type: Number, default: 0 },
  actualPercent: { type: Number, default: 0 },
  status: { type: String, default: 'In Progress' },
  plannedHours: { type: Number, default: 0 },
  spentHours: { type: Number, default: 0 },
  deliverable: { type: String },
});

const blockerSchema = new Schema({
  description: { type: String, required: true },
  isKeyBlocker: { type: Boolean, default: false },
});

const achievementSchema = new Schema({
  description: { type: String, required: true },
  isKeyAchievement: { type: Boolean, default: false },
});

const reportVersionSchema = new Schema({
  versionNumber: { type: Number, required: true },
  snapshot: { type: Schema.Types.Mixed, required: true },
  submittedAt: { type: Date, default: Date.now }
});

const reportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },
  weekIdentifier: { type: String, required: true },
  status: { type: String, enum: Object.values(ReportStatus), default: ReportStatus.DRAFT },
  tasks: [taskSchema],
  hoursWorked: {
    development: { type: Number, default: 0 },
    testing: { type: Number, default: 0 },
    meetings: { type: Number, default: 0 },
    documentation: { type: Number, default: 0 },
  },
  nextWeekTasks: { type: String },
  blockers: [blockerSchema],
  achievements: [achievementSchema],
  notes: { type: String },
  reviews: [{
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['REQUEST_CORRECTION', 'APPROVED'] },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  versions: [reportVersionSchema]
}, { timestamps: true });

// Enforce only 1 report per user per week
reportSchema.index({ userId: 1, weekIdentifier: 1 }, { unique: true });

export const Report = model('Report', reportSchema);