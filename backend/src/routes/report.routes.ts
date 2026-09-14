import { Router } from 'express';
import { Report, ReportStatus } from '../models/Report.js';
import { authenticateJWT, requireRoles, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/reports - Fetch reports based on role
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const {
      status,
      userId,
      projectId,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    const filter: any = {};

    // 1. Role-based Access Control (RBAC) & Team Member Filter
    if (req.user?.role === 'TEAM_MEMBER') {
      filter.userId = req.user.id;
    } else if (userId) {
      filter.userId = userId;
    }

    // Exclude DRAFT reports for non-team members
    if (req.user?.role !== 'TEAM_MEMBER') {
      filter.status = { $ne: 'DRAFT' };
    }

    // 2. Project / Category Filter
    if (projectId) {
      filter.projectId = projectId;
    }

    // 3. Status Filter (Submitted / Needs Correction / Approved)[cite: 2]
    if (status) {
      filter.status = status;
    }

    // 4. Date Range Filtering (Matches reports overlapping or within range)[cite: 2]
    if (startDate || endDate) {
      filter.weekStart = {};
      if (startDate) {
        filter.weekStart.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.weekStart.$lte = new Date(endDate as string);
      }
    }

    // 5. Pagination Setup
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query and total count concurrently for optimal performance
    const [reports, totalReports] = await Promise.all([
      Report.find(filter)
        .populate('userId', 'name email role')
        .populate('projectId', 'name description')
        .sort({ weekStart: -1 })
        .skip(skip)
        .limit(limitNum),
      Report.countDocuments(filter),
    ]);

    // Return structured payload containing metadata and records
    return res.json({
      data: reports,
      pagination: {
        totalReports,
        currentPage: pageNum,
        totalPages: Math.ceil(totalReports / limitNum),
        limit: limitNum,
        hasNextPage: pageNum * limitNum < totalReports,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch reports', error });
  }
});

// Helper to generate current ISO week identifier (e.g. "2026-W37")
const getCurrentWeekIdentifier = (): string => {
  const d = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

/**
 * GET /api/reports/cross-team-summary
 * Allows managers/admins to view sections (Blockers, Achievements, Tasks, Next Week Tasks)
 * across all team members side-by-side for a specific week.
 */
router.get(
  '/cross-team-summary',
  authenticateJWT,
  requireRoles('MANAGER'),
  async (req: AuthRequest, res) => {
    try {
      const { weekIdentifier, projectId } = req.query;

      // Default to current ISO week if weekIdentifier is not provided
      const targetWeek = (weekIdentifier as string) || getCurrentWeekIdentifier();

      const filter: any = {
        weekIdentifier: targetWeek,
        status: { $ne: ReportStatus.DRAFT }, // Exclude draft reports
      };

      if (projectId) {
        filter.projectId = projectId;
      }

      // Fetch reports with populated user and project details
      const reports = await Report.find(filter)
        .populate('userId', 'name email role department')
        .populate('projectId', 'name description')
        .sort({ createdAt: -1 });

      // Structure aggregated data for clean side-by-side frontend consumption
      const summary = reports.map((report: any) => ({
        reportId: report._id,
        status: report.status,
        weekIdentifier: report.weekIdentifier,
        user: {
          id: report.userId?._id,
          name: report.userId?.name || 'Unknown User',
          email: report.userId?.email || '',
        },
        project: {
          id: report.projectId?._id,
          name: report.projectId?.name || 'Unassigned Project',
        },
        blockers: report.blockers || [],
        achievements: report.achievements || [],
        tasks: report.tasks || [],
        nextWeekTasks: report.nextWeekTasks || '',
        updatedAt: report.updatedAt,
      }));

      return res.json({
        success: true,
        weekIdentifier: targetWeek,
        totalSubmittedMembers: summary.length,
        data: summary,
      });
    } catch (error) {
      console.error('Failed to fetch cross-team summary:', error);
      return res.status(500).json({
        message: 'Failed to retrieve cross-team weekly summary',
        error,
      });
    }
  }
);

// GET /api/reports/:id - Fetch single report details
router.get('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('userId', 'name email role')
      .populate('projectId', 'name description')
      .populate('reviews.reviewerId', 'name email');

    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Authorization check
    if (req.user?.role === 'TEAM_MEMBER' && report.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden access' });
    }

    return res.json(report);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch report details' });
  }
});

// POST /api/reports - Save Draft or Submit Report
router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: User missing from request' });
    }

    const { projectId, weekStart, weekEnd, weekIdentifier, tasks, hoursWorked, nextWeekTasks, blockers, achievements, notes, isSubmit } = req.body;

    if (!projectId || !weekStart || !weekEnd) {
      return res.status(400).json({ message: 'Project, Week Start, and Week End are required' });
    }

    // Quick validation before saving
    const existingReport = await Report.findOne({
      userId: req.user.id,
      projectId: req.body.projectId,
      weekIdentifier: req.body.weekIdentifier
    });

    if (existingReport) {
      return res.status(400).json({ message: "You have already created a report for this project for the selected week." });
    }

    const reportStatus = isSubmit ? ReportStatus.SUBMITTED : ReportStatus.DRAFT;

    const reportData = {
      userId: req.user?.id,
      projectId,
      weekStart: new Date(weekStart),
      weekEnd: new Date(weekEnd),
      weekIdentifier: weekIdentifier,
      status: reportStatus,
      tasks: tasks || [],
      hoursWorked: hoursWorked || { development: 0, testing: 0, meetings: 0, documentation: 0 },
      nextWeekTasks: nextWeekTasks || '',
      blockers: blockers || [],
      achievements: achievements || [],
      notes: notes || '',
      versions: []
    };

    if (isSubmit) {
      (reportData.versions as any[]) = [{
        versionNumber: 1,
        snapshot: { ...reportData },
        submittedAt: new Date()
      }];
    }

    const report = await Report.create(reportData);
    return res.status(201).json(report);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save report', error });
  }
});

// PUT /api/reports/:id - Update Draft or Resubmit Needs Correction
router.put('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (report.userId.toString() !== req.user?.id) {
      return res.status(403).json({ message: 'You can only edit your own reports' });
    }

    if (report.status === ReportStatus.APPROVED) {
      return res.status(400).json({ message: 'Approved reports cannot be edited' });
    }

    const { projectId, tasks, hoursWorked, nextWeekTasks, blockers, keyBlocker, achievements, keyAchievement, notes, isSubmit } = req.body;

    if (projectId) report.projectId = projectId;
    if (tasks) report.tasks = tasks;
    if (hoursWorked) report.hoursWorked = hoursWorked;
    if (nextWeekTasks !== undefined) report.nextWeekTasks = nextWeekTasks;
    if (blockers !== undefined) {
      report.set('blockers', Array.isArray(blockers) ? blockers : []);
    }

    if (achievements !== undefined) {
      report.set('achievements', Array.isArray(achievements) ? achievements : []);
    }
    if (notes !== undefined) report.notes = notes;

    if (isSubmit) {
      report.status = ReportStatus.SUBMITTED;
      const newVersionNum = (report.versions?.length || 0) + 1;

      report.versions.push({
        versionNumber: newVersionNum,
        snapshot: report.toObject(),
        submittedAt: new Date()
      });
    }

    await report.save();
    return res.json(report);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update report', error });
  }
});

// POST /api/reports/:id/review - Manager Review (Approve or Request Correction)
router.post('/:id/review', authenticateJWT, requireRoles('MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { action, comment } = req.body; // action: 'APPROVED' | 'REQUEST_CORRECTION'

    if (!['APPROVED', 'REQUEST_CORRECTION'].includes(action)) {
      return res.status(400).json({ message: 'Invalid review action' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.status = action === 'APPROVED' ? ReportStatus.APPROVED : ReportStatus.NEEDS_CORRECTION;
    report.reviews.push({
      reviewerId: req.user?.id as any,
      action,
      comment: comment || '',
      versionNumber: report.versions?.length || 1,
      createdAt: new Date()
    });

    await report.save();
    return res.json(report);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process review', error });
  }
});

export default router;