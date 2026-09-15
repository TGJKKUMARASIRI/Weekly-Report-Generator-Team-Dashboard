import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Role } from './models/User.js';
import { Project } from './models/Project.js';
import { Report, ReportStatus } from './models/Report.js';

dotenv.config();

async function seed() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/weekly_report_db';
  await mongoose.connect(mongoUri);

  await Report.deleteMany({});
  await User.deleteMany({});
  await Project.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const manager = await User.create({
    name: 'Manager Sarah',
    email: 'manager@example.com',
    passwordHash,
    role: Role.MANAGER,
  });

  const members = await User.create([
    { name: 'John Doe', email: 'john@example.com', passwordHash, role: Role.TEAM_MEMBER },
    { name: 'Alice Smith', email: 'alice@example.com', passwordHash, role: Role.TEAM_MEMBER },
    { name: 'Michael Chen', email: 'michael@example.com', passwordHash, role: Role.TEAM_MEMBER },
    { name: 'Priya Patel', email: 'priya@example.com', passwordHash, role: Role.TEAM_MEMBER },
    { name: 'Daniel Wilson', email: 'daniel@example.com', passwordHash, role: Role.TEAM_MEMBER },
  ]);

  const [clientPortal, internalTooling, mobileApp, analyticsPlatform] = await Project.create([
    {
      name: 'Client Portal Redesign',
      description: 'Main enterprise client project',
      members: [members[0]._id, members[1]._id, members[3]._id],
    },
    {
      name: 'Internal Tooling',
      description: 'Developer productivity tools',
      members: [members[0]._id, members[2]._id, members[4]._id],
    },
    {
      name: 'Mobile App R&D',
      description: 'Next-generation iOS and Android framework evaluation',
      members: [members[1]._id, members[2]._id],
    },
    {
      name: 'Analytics Platform',
      description: 'Reporting and operational analytics platform',
      members: [members[3]._id, members[4]._id],
    },
  ]);

  const getMonday = (date: Date): Date => {
    const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = monday.getUTCDay() || 7;
    monday.setUTCDate(monday.getUTCDate() - day + 1);
    return monday;
  };

  const getWeek = (weeksAgo: number) => {
    const weekStart = getMonday(new Date());
    weekStart.setUTCDate(weekStart.getUTCDate() - weeksAgo * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const thursday = new Date(weekStart);
    thursday.setUTCDate(thursday.getUTCDate() + 3);
    const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    return {
      weekStart,
      weekEnd,
      weekIdentifier: `${thursday.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`,
    };
  };

  const makeTask = (
    taskName: string,
    status: string,
    priority: 'Low' | 'Medium' | 'High',
    plannedHours: number,
    spentHours: number,
    actualPercent: number,
    deliverable: string,
  ) => ({
    taskName,
    status,
    priority,
    plannedPercent: 100,
    actualPercent,
    plannedHours,
    spentHours,
    deliverable,
  });

  const reportTemplates = [
    {
      member: members[0],
      project: clientPortal,
      status: ReportStatus.APPROVED,
      tasks: [
        makeTask('Implement responsive navigation', 'Completed', 'High', 12, 11, 100, 'Navigation merged to main branch'),
        makeTask('Add accessibility tests', 'Completed', 'Medium', 8, 7, 100, 'Automated keyboard and screen-reader checks'),
      ],
      achievement: 'Completed the navigation migration and accessibility baseline.',
      blocker: 'Waiting for final brand color tokens from design.',
    },
    {
      member: members[1],
      project: clientPortal,
      status: ReportStatus.NEEDS_CORRECTION,
      tasks: [
        makeTask('Build account settings screens', 'In Progress', 'High', 16, 14, 80, 'Settings screens ready for review'),
        makeTask('Connect profile API', 'In Progress', 'Medium', 10, 8, 70, 'Read and update endpoints connected'),
      ],
      achievement: 'Delivered the first usable account settings flow.',
      blocker: 'The profile API response is missing the preferred language field.',
      reviewComment: 'Please add clearer testing evidence and document the API gap before resubmitting.',
    },
    {
      member: members[2],
      project: mobileApp,
      status: ReportStatus.SUBMITTED,
      tasks: [
        makeTask('Evaluate offline storage libraries', 'Completed', 'Medium', 10, 9, 100, 'Comparison document with recommendation'),
        makeTask('Prototype sync queue', 'In Progress', 'High', 14, 12, 75, 'Proof of concept running on Android'),
      ],
      achievement: 'Selected a storage approach and demonstrated background synchronization.',
      blocker: 'iOS simulator builds are intermittently failing on the shared CI runner.',
    },
    {
      member: members[3],
      project: analyticsPlatform,
      status: ReportStatus.DRAFT,
      tasks: [
        makeTask('Define dashboard KPI queries', 'In Progress', 'High', 12, 5, 40, 'Initial query catalog'),
        makeTask('Create sample chart data', 'In Progress', 'Low', 6, 2, 30, 'Local fixtures only'),
      ],
      achievement: 'Created the first KPI query inventory.',
      blocker: 'Waiting for confirmation of the finance data retention policy.',
    },
    {
      member: members[4],
      project: internalTooling,
      status: ReportStatus.APPROVED,
      tasks: [
        makeTask('Improve CI build caching', 'Completed', 'Medium', 10, 8, 100, 'Build time reduced in the test pipeline'),
        makeTask('Document release checklist', 'Completed', 'Low', 6, 5, 100, 'Checklist published for the team'),
      ],
      achievement: 'Reduced average CI duration and documented the release process.',
      blocker: 'No active blockers.',
    },
  ];

  const reports = [];
  for (const weeksAgo of [2, 1, 0]) {
    const week = getWeek(weeksAgo);

    for (const template of reportTemplates) {
      // Older reports are approved to provide a completed historical baseline.
      const status = weeksAgo === 2 ? ReportStatus.APPROVED : template.status;
      const submitted = status !== ReportStatus.DRAFT;
      const baseReport = {
        userId: template.member._id,
        projectId: template.project._id,
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        weekIdentifier: week.weekIdentifier,
        status,
        tasks: template.tasks,
        hoursWorked: {
          development: 18 + weeksAgo * 2,
          testing: 6,
          meetings: 4,
          documentation: 3,
        },
        nextWeekTasks: 'Complete the remaining review items and prepare the next release increment.',
        blockers: [{ description: template.blocker, isKeyBlocker: template.blocker !== 'No active blockers.' }],
        achievements: [{ description: template.achievement, isKeyAchievement: true }],
        notes: `Seeded ${week.weekIdentifier} report for dashboard review.`,
      };

      const versions = submitted
        ? [{ versionNumber: 1, snapshot: baseReport, submittedAt: new Date(week.weekEnd) }]
        : [];
      const reviews = [];

      if (status === ReportStatus.APPROVED && submitted) {
        reviews.push({
          reviewerId: manager._id,
          action: 'APPROVED' as const,
          comment: 'Reviewed and approved for the weekly team record.',
          versionNumber: 1,
          createdAt: new Date(week.weekEnd.getTime() + 86400000),
        });
      } else if (status === ReportStatus.NEEDS_CORRECTION) {
        reviews.push({
          reviewerId: manager._id,
          action: 'REQUEST_CORRECTION' as const,
          comment: template.reviewComment || 'Please add more detail before resubmitting.',
          versionNumber: 1,
          createdAt: new Date(week.weekEnd.getTime() + 86400000),
        });
      }

      reports.push({ ...baseReport, versions, reviews });
    }
  }

  await Report.insertMany(reports);

  console.log(`Database seeded with 1 manager, ${members.length} team members, 4 projects, and ${reports.length} reports across 3 weeks.`);
  console.log('Development password for all seeded users: Password123!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});