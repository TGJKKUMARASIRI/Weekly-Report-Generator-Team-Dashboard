import { Schema, model } from 'mongoose';

export enum Role {
  TEAM_MEMBER = 'TEAM_MEMBER',
  MANAGER = 'MANAGER',
}

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: Object.values(Role), default: Role.TEAM_MEMBER },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const User = model('User', userSchema);