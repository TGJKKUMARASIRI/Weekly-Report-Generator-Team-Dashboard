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
  status: { type: String, enum: Object.values(ReportStatus), default: ReportStatus.DRAFT },
  tasks: [taskSchema],
  hoursWorked: {
    development: { type: Number, default: 0 },
    testing: { type: Number, default: 0 },
    meetings: { type: Number, default: 0 },
    documentation: { type: Number, default: 0 },
  },
  nextWeekTasks: { type: String },
  blockers: { type: String },
  keyBlocker: { type: Boolean, default: false },
  achievements: { type: String },
  keyAchievement: { type: Boolean, default: false },
  notes: { type: String },
  reviews: [{
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['REQUEST_CORRECTION', 'APPROVED'] },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  versions: [reportVersionSchema]
}, { timestamps: true });

export const Report = model('Report', reportSchema);