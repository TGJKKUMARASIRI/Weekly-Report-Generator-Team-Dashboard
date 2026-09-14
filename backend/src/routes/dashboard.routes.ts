import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Report, ReportStatus } from '../models/Report.js';
import { Project } from '../models/Project.js';
import { User, Role } from '../models/User.js';
import { authenticateJWT, requireRoles } from '../middleware/auth.js';

const router = Router();

// Interface matching frontend ActivityFeed definition
interface ActivityFeedItem {
    id: string;
    reportId: string;
    memberName: string;
    projectName: string;
    action: 'APPROVED' | 'NEEDS_CORRECTION' | 'SUBMITTED';
    comment?: string;
    timestamp: string;
}

// Interfaces for populated fields
interface PopulatedUser {
    _id: Types.ObjectId;
    name: string;
}

interface PopulatedProject {
    _id: Types.ObjectId;
    name: string;
}

/**
 * GET /api/dashboard/manager-stats
 * Aggregates dashboard summary metrics, chart visual insights, and review activity logs.
 * Access: MANAGER
 */
router.get(
    '/manager-stats',
    authenticateJWT,
    requireRoles(Role.MANAGER),
    async (req: Request, res: Response) => {
        try {
            // 1. Calculate Current Week Constraints (Monday to Sunday boundary)
            const now = new Date();
            const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
            const distanceToMonday = (dayOfWeek + 6) % 7;

            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - distanceToMonday);
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            // Explicitly type parameter 'd' as Date
            const getWeekIdentifier = (d: Date): string => {
                const date = new Date(d.getTime());
                date.setHours(0, 0, 0, 0);
                date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
                const week1 = new Date(date.getFullYear(), 0, 4);
                const weekNum =
                    1 +
                    Math.round(
                        ((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
                    );
                return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
            };

            const currentWeekIdentifier = getWeekIdentifier(now);

            // ------------------------------------------------------------------
            // A. SUMMARY METRICS COMPUTATION
            // ------------------------------------------------------------------

            // 1. Total Submitted This Week (Includes SUBMITTED, NEEDS_CORRECTION, APPROVED)
            const totalSubmittedThisWeek = await Report.countDocuments({
                weekIdentifier: currentWeekIdentifier,
                status: { $in: [ReportStatus.SUBMITTED, ReportStatus.NEEDS_CORRECTION, ReportStatus.APPROVED] },
            });

            // 2. Submission Compliance Rate (Submitted vs Pending vs Late)
            const activeProjects = await Project.find({ isActive: true });

            // Find unique team members assigned across active projects
            const expectedUserProjectPairs = new Map<string, { userId: string; projectId: string }>();
            activeProjects.forEach((proj) => {
                proj.members.forEach((memberId) => {
                    expectedUserProjectPairs.set(`${memberId.toString()}_${proj._id.toString()}`, {
                        userId: memberId.toString(),
                        projectId: proj._id.toString(),
                    });
                });
            });

            const currentWeekReports = await Report.find({
                weekIdentifier: currentWeekIdentifier,
            });

            let submittedCount = 0;
            let pendingCount = 0;
            
            expectedUserProjectPairs.forEach(({ userId, projectId }) => {
                const report = currentWeekReports.find(
                    (r) => r.userId.toString() === userId && r.projectId.toString() === projectId
                );

                if (!report || report.status === ReportStatus.DRAFT) {
                    {
                        pendingCount++;
                    }
                } else {
                    // Report has been formally submitted, needs correction, or approved
                    {
                        submittedCount++;
                    }
                }
            });

            const totalExpected = submittedCount + pendingCount;
            const complianceRatePercentage =
                totalExpected > 0 ? Number(((submittedCount / totalExpected) * 100).toFixed(1)) : 0;

            // 3. Reports Currently in Needs Correction Status (Entire system scope)
            const needsCorrectionCount = await Report.countDocuments({
                status: ReportStatus.NEEDS_CORRECTION,
            });

            // 4. Open Key Blockers Count (Key Blockers in non-Approved reports for current week)
            const activeBlockerReports = await Report.find({
                weekIdentifier: currentWeekIdentifier,
                status: { $ne: ReportStatus.APPROVED },
            });

            let openBlockersCount = 0;
            activeBlockerReports.forEach((report) => {
                report.blockers.forEach((b: { isKeyBlocker?: boolean }) => {
                    if (b.isKeyBlocker) openBlockersCount++;
                });
            });

            // ------------------------------------------------------------------
            // B. VISUAL INSIGHTS & CHARTS DATA
            // ------------------------------------------------------------------

            // Chart 1: Tasks Completed Trend Over Time (Last 6 Weeks)
            const sixWeeksAgo = new Date(now);
            sixWeeksAgo.setDate(now.getDate() - 42);

            const trendReports = await Report.find({
                createdAt: { $gte: sixWeeksAgo },
            }).sort({ createdAt: 1 });

            const trendMap = new Map<string, number>();
            trendReports.forEach((r) => {
                const weekKey = r.weekIdentifier;
                const completedTasksCount = r.tasks.filter(
                    (t: { status?: string; actualPercent?: number }) =>
                        t.status === 'Completed' || t.actualPercent === 100
                ).length;
                trendMap.set(weekKey, (trendMap.get(weekKey) || 0) + completedTasksCount);
            });

            const tasksCompletedTrend = Array.from(trendMap.entries()).map(([date, completedTasks]) => ({
                date,
                completedTasks,
            }));

            // Chart 2: Report Status by Team Member (Excluding DRAFT)
            const allUsers = await User.find({ role: Role.TEAM_MEMBER, isActive: true });
            const memberReports = await Report.find({
                status: { $ne: ReportStatus.DRAFT },
            }).populate<{ userId: PopulatedUser }>('userId', 'name');

            const memberStatusMap = new Map<
                string,
                {
                    memberName: string;
                    APPROVED: number;
                    SUBMITTED: number;
                    NEEDS_CORRECTION: number;
                    DRAFT: number;
                }
            >();

            allUsers.forEach((u) => {
                memberStatusMap.set(u._id.toString(), {
                    memberName: u.name,
                    APPROVED: 0,
                    SUBMITTED: 0,
                    NEEDS_CORRECTION: 0,
                    DRAFT: 0,
                });
            });

            memberReports.forEach((r) => {
                if (!r.userId) return;
                const userObj = r.userId as unknown as PopulatedUser;
                const uId = userObj._id.toString();
                if (memberStatusMap.has(uId)) {
                    const stats = memberStatusMap.get(uId)!;
                    const statusKey = r.status as keyof typeof stats;
                    if (statusKey === 'APPROVED' || statusKey === 'SUBMITTED' || statusKey === 'NEEDS_CORRECTION' || statusKey === 'DRAFT') {
                        stats[statusKey] += 1;
                    }
                }
            });

            const statusByMember = Array.from(memberStatusMap.values());

            // Chart 3: Workload / Task Distribution by Project
            const workloadAggregation = await Report.aggregate([
                {
                    $group: {
                        _id: '$projectId',
                        taskCount: { $sum: { $size: '$tasks' } },
                        totalDevHours: { $sum: '$hoursWorked.development' },
                        totalTestingHours: { $sum: '$hoursWorked.testing' },
                        totalMeetingHours: { $sum: '$hoursWorked.meetings' },
                        totalDocHours: { $sum: '$hoursWorked.documentation' },
                    },
                },
                {
                    $lookup: {
                        from: 'projects',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'projectInfo',
                    },
                },
                { $unwind: '$projectInfo' },
                {
                    $project: {
                        projectName: '$projectInfo.name',
                        taskCount: 1,
                        totalHours: {
                            $add: ['$totalDevHours', '$totalTestingHours', '$totalMeetingHours', '$totalDocHours'],
                        },
                    },
                },
            ]);

            // Chart 4: Time Spent by Task Type (Team-Wide Hours Breakdown)
            const hoursAggregation = await Report.aggregate([
                {
                    $group: {
                        _id: null,
                        Development: { $sum: '$hoursWorked.development' },
                        Testing: { $sum: '$hoursWorked.testing' },
                        Meetings: { $sum: '$hoursWorked.meetings' },
                        Documentation: { $sum: '$hoursWorked.documentation' },
                    },
                },
            ]);

            const hoursData = hoursAggregation[0] || {
                Development: 0,
                Testing: 0,
                Meetings: 0,
                Documentation: 0,
            };
            const timeSpentByTaskType = [
                { type: 'Development', hours: hoursData.Development },
                { type: 'Testing', hours: hoursData.Testing },
                { type: 'Meetings', hours: hoursData.Meetings },
                { type: 'Documentation', hours: hoursData.Documentation },
            ];

            // ------------------------------------------------------------------
            // C. RECENT REVIEW ACTIONS & AUDIT FEED
            // ------------------------------------------------------------------
            const rawReportsWithReviews = await Report.find({
                'reviews.0': { $exists: true },
            })
                .populate<{ userId: PopulatedUser }>('userId', 'name')
                .populate<{ projectId: PopulatedProject }>('projectId', 'name')
                .slice('reviews', -5)
                .lean();

            const activityFeed: ActivityFeedItem[] = [];

            rawReportsWithReviews.forEach((report) => {
                const userObj = report.userId as unknown as PopulatedUser | undefined;
                const projectObj = report.projectId as unknown as PopulatedProject | undefined;

                report.reviews.forEach((rev) => {
                    const actionMapped: 'APPROVED' | 'NEEDS_CORRECTION' | 'SUBMITTED' =
                        rev.action === 'REQUEST_CORRECTION' ? 'NEEDS_CORRECTION' : (rev.action as 'APPROVED' | 'SUBMITTED') || 'SUBMITTED';

                    activityFeed.push({
                        id: rev._id ? rev._id.toString() : `${report._id.toString()}_${rev.createdAt}`,
                        reportId: report._id.toString(),
                        memberName: userObj && userObj.name ? userObj.name : 'Unknown',
                        projectName: projectObj && projectObj.name ? projectObj.name : 'Unknown',
                        action: actionMapped,
                        comment: rev.comment || '',
                        timestamp: new Date(rev.createdAt || Date.now()).toISOString(),
                    });
                });
            });

            // Sort feed chronologically (most recent first) and take the top 10
            activityFeed.sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            const limitedActivityFeed = activityFeed.slice(0, 10);

            // ------------------------------------------------------------------
            // D. RESPONSE ASSEMBLY
            // ------------------------------------------------------------------
            return res.json({
                summary: {
                    totalSubmittedThisWeek,
                    submissionCompliance: {
                        submitted: submittedCount,
                        pending: pendingCount,
                        complianceRatePercentage,
                    },
                    needsCorrectionCount,
                    openBlockersCount,
                },
                charts: {
                    tasksCompletedTrend,
                    statusByMember,
                    workloadByProject: workloadAggregation,
                    timeSpentByTaskType,
                },
                activityFeed: limitedActivityFeed,
            });
        } catch (error) {
            console.error('Error computing manager dashboard analytics:', error);
            return res.status(500).json({ message: 'Failed to generate manager dashboard statistics.' });
        }
    }
);

export default router;