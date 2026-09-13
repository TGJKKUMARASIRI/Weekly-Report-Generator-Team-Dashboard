import { Schema, model } from 'mongoose';

const projectSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Project = model('Project', projectSchema);