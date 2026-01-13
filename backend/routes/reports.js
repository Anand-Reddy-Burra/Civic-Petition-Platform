import express from 'express';
import Petition from '../models/Petition.js';
import Poll from '../models/Poll.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const buildDateFilter = (monthParam) => {
  if (!monthParam || monthParam === 'all') {
    return {};
  }
  const start = new Date(monthParam);
  if (Number.isNaN(start.getTime())) return {};
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { createdAt: { $gte: start, $lt: end } };
};

// Helper to build community-level metrics
const buildCommunityMetrics = async (monthParam) => {
  const dateFilter = buildDateFilter(monthParam);

  const [totalPetitions, totalPolls] = await Promise.all([
    Petition.countDocuments(dateFilter),
    Poll.countDocuments(dateFilter)
  ]);

  const basePetitionMatch =
    Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : [];

  const [{ totalSignatures = 0 } = {}] = await Petition.aggregate([
    ...basePetitionMatch,
    { $group: { _id: null, totalSignatures: { $sum: '$signatures' } } }
  ]);

  const basePollMatch =
    Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : [];

  const [{ totalVotes = 0 } = {}] = await Poll.aggregate([
    ...basePollMatch,
    {
      $addFields: {
        totalVotes: {
          $sum: {
            $map: {
              input: '$options',
              as: 'opt',
              in: { $ifNull: ['$$opt.votes', 0] }
            }
          }
        }
      }
    },
    { $group: { _id: null, totalVotes: { $sum: '$totalVotes' } } }
  ]);

  const totalEngagement = totalSignatures + totalVotes;

  // Petition categories distribution
  const petitionCategoryAgg = await Petition.aggregate([
    ...basePetitionMatch,
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  const petitionStatusAgg = await Petition.aggregate([
    ...basePetitionMatch,
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Simple sentiment proxy for petitions: signed vs remaining goals
  const petitionSentimentAgg = await Petition.aggregate([
    ...basePetitionMatch,
    {
      $group: {
        _id: null,
        totalSigned: { $sum: '$signatures' },
        totalGoal: { $sum: '$goal' }
      }
    }
  ]);

  // Poll breakdowns
  const pollStatusAgg = await Poll.aggregate([
    ...basePollMatch,
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const pollCategoryAgg = await Poll.aggregate([
    ...basePollMatch,
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  // Simple sentiment proxy for polls: polls with votes vs without
  const pollSentimentAgg = await Poll.aggregate([
    ...basePollMatch,
    {
      $addFields: {
        totalVotes: {
          $sum: {
            $map: {
              input: '$options',
              as: 'opt',
              in: { $ifNull: ['$$opt.votes', 0] }
            }
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        withVotes: {
          $sum: { $cond: [{ $gt: ['$totalVotes', 0] }, 1, 0] }
        },
        noVotes: {
          $sum: { $cond: [{ $eq: ['$totalVotes', 0] }, 1, 0] }
        }
      }
    }
  ]);

  const petitionCategoryChart = {
    id: 1,
    title: 'Petition Categories Distribution',
    type: 'pie',
    data: petitionCategoryAgg.map((item, index) => {
      const base = `${item._id || 'Uncategorized'}`;
      const palette = ['#DC2626', '#2563EB', '#16A34A', '#CA8A04', '#9333EA', '#EA580C', '#0891B2'];
      return {
        name: base,
        value: item.count,
        color: palette[index % palette.length]
      };
    }),
    barColor: []
  };

  const petitionStatusChart = {
    id: 2,
    title: 'Petition Status Breakdown',
    type: 'pie',
    data: petitionStatusAgg.map((item) => {
      const status = item._id || 'unknown';
      let color = '#6B7280';
      if (status === 'active') color = '#16A34A';
      else if (status === 'under_review') color = '#F59E0B';
      else if (status === 'closed') color = '#6366F1';
      else if (status === 'rejected') color = '#DC2626';
      return {
        name: status,
        value: item.count,
        color
      };
    }),
    barColor: []
  };

  const petitionSentiment = petitionSentimentAgg[0] || {
    totalSigned: 0,
    totalGoal: 0
  };
  const remaining = Math.max(petitionSentiment.totalGoal - petitionSentiment.totalSigned, 0);

  const petitionSentimentChart = {
    id: 3,
    title: 'Petition Support (Signed vs Remaining)',
    type: 'bar',
    data: [
      { name: 'Signed', volume: petitionSentiment.totalSigned || 0 },
      { name: 'Remaining to Goal', volume: remaining }
    ],
    barColor: ['#6B8E23', '#8B0000']
  };

  const pollStatusChart = {
    id: 4,
    title: 'Poll Status Breakdown',
    type: 'pie',
    data: pollStatusAgg.map((item) => {
      const status = item._id || 'unknown';
      let color = '#6B7280';
      if (status === 'active') color = '#16A34A';
      else if (status === 'under_review') color = '#F59E0B';
      else if (status === 'closed') color = '#6366F1';
      else if (status === 'rejected') color = '#DC2626';
      return {
        name: status,
        value: item.count,
        color
      };
    }),
    barColor: []
  };

  const pollSentiment = pollSentimentAgg[0] || { withVotes: 0, noVotes: 0 };

  const pollSentimentChart = {
    id: 5,
    title: 'Poll Engagement (With Votes / No Votes)',
    type: 'bar',
    data: [
      { name: 'With Votes', volume: pollSentiment.withVotes || 0 },
      { name: 'No Votes', volume: pollSentiment.noVotes || 0 }
    ],
    barColor: ['#1B5E20', '#C62828']
  };

  const pollCategoryChart = {
    id: 6,
    title: 'Poll Categories Distribution',
    type: 'pie',
    data: pollCategoryAgg.map((item, index) => {
      const base = `${item._id || 'Uncategorized'}`;
      const palette = ['#DC2626', '#2563EB', '#16A34A', '#CA8A04', '#9333EA', '#EA580C', '#0891B2'];
      return {
        name: base,
        value: item.count,
        color: palette[index % palette.length]
      };
    }),
    barColor: []
  };

  // User activity by role (Public vs Officials)
  // Get all petitions with signedBy populated
  const petitionsWithSigners = await Petition.find(dateFilter)
    .select('signedBy')
    .populate('signedBy', 'role')
    .lean();
  
  // Get all polls with votedBy populated
  const pollsWithVoters = await Poll.find(dateFilter)
    .select('votedBy')
    .populate('votedBy', 'role')
    .lean();

  // Count signatures by role
  let publicSignatures = 0;
  let officialSignatures = 0;
  petitionsWithSigners.forEach(petition => {
    if (petition.signedBy && Array.isArray(petition.signedBy)) {
      petition.signedBy.forEach(user => {
        if (user && user.role === 'official') {
          officialSignatures++;
        } else if (user) {
          publicSignatures++;
        }
      });
    }
  });

  // Count votes by role
  let publicVotes = 0;
  let officialVotes = 0;
  pollsWithVoters.forEach(poll => {
    if (poll.votedBy && Array.isArray(poll.votedBy)) {
      poll.votedBy.forEach(user => {
        if (user && user.role === 'official') {
          officialVotes++;
        } else if (user) {
          publicVotes++;
        }
      });
    }
  });

  const userActivityChart = {
    id: 9,
    title: 'User Activity by Role (Signed & Voted)',
    type: 'bar',
    data: [
      { name: 'Public - Signed', volume: publicSignatures },
      { name: 'Public - Voted', volume: publicVotes },
      { name: 'Officials - Signed', volume: officialSignatures },
      { name: 'Officials - Voted', volume: officialVotes }
    ],
    barColor: ['#2563EB', '#16A34A', '#9333EA', '#EA580C']
  };

  return {
    kpi: { totalPetitions, totalPolls, totalEngagement },
    charts: [
      petitionCategoryChart,
      petitionStatusChart,
      petitionSentimentChart,
      pollStatusChart,
      pollSentimentChart,
      pollCategoryChart,
      userActivityChart
    ]
  };
};

// Helper to build "my activity" metrics for a specific user
const buildMyActivityMetrics = async (userId, monthParam) => {
  const dateFilter = buildDateFilter(monthParam);
  const baseFilter = (extra) =>
    Object.keys(dateFilter).length > 0
      ? { ...extra, ...dateFilter }
      : extra;

  const [myPetitions, myPolls] = await Promise.all([
    Petition.find(baseFilter({ createdBy: userId })).select('status'),
    Poll.find(baseFilter({ createdBy: userId })).select('status')
  ]);

  const totalPetitions = myPetitions.length;
  const totalPolls = myPolls.length;

  // Engagement proxy: how many of my petitions/polls have any signatures/votes
  const [{ mySignedPetitions = 0 } = {}] = await Petition.aggregate([
    { $match: baseFilter({ createdBy: userId }) },
    { $match: { signatures: { $gt: 0 } } },
    { $group: { _id: null, mySignedPetitions: { $sum: 1 } } }
  ]);

  const [{ myVotedPolls = 0 } = {}] = await Poll.aggregate([
    { $match: baseFilter({ createdBy: userId }) },
    {
      $addFields: {
        totalVotes: {
          $sum: {
            $map: {
              input: '$options',
              as: 'opt',
              in: { $ifNull: ['$$opt.votes', 0] }
            }
          }
        }
      }
    },
    { $match: { totalVotes: { $gt: 0 } } },
    { $group: { _id: null, myVotedPolls: { $sum: 1 } } }
  ]);

  const totalEngagement = mySignedPetitions + myVotedPolls;

  const groupByStatus = (docs) =>
    docs.reduce(
      (acc, doc) => {
        const status = doc.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {}
    );

  const petitionStatusCounts = groupByStatus(myPetitions);
  const pollStatusCounts = groupByStatus(myPolls);

  const myPetitionStatusChart = {
    id: 7,
    title: 'My Petition Status Breakdown',
    type: 'pie',
    data: Object.entries(petitionStatusCounts).map(([status, count]) => {
      let color = '#6B7280';
      if (status === 'active') color = '#16A34A';
      else if (status === 'under_review') color = '#F59E0B';
      else if (status === 'closed') color = '#6366F1';
      else if (status === 'rejected') color = '#DC2626';
      return { name: status, value: count, color };
    }),
    barColor: []
  };

  const myPollStatusChart = {
    id: 8,
    title: 'My Polls Status Breakdown',
    type: 'pie',
    data: Object.entries(pollStatusCounts).map(([status, count]) => {
      let color = '#6B7280';
      if (status === 'active') color = '#16A34A';
      else if (status === 'under_review') color = '#F59E0B';
      else if (status === 'closed') color = '#6366F1';
      else if (status === 'rejected') color = '#DC2626';
      return { name: status, value: count, color };
    }),
    barColor: []
  };

  return {
    kpi: { totalPetitions, totalPolls, totalEngagement },
    charts: [myPetitionStatusChart, myPollStatusChart]
  };
};

// @route   GET /api/reports/overview
// @desc    Get reports & analytics for petitions and polls
// @query   scope=community|my_activity  (default: community)
//          month=YYYY-MM-01 (currently accepted but not strictly used)
// @access  For my_activity scope, authentication is required
router.get('/overview', authenticate, async (req, res) => {
  try {
    const scope = (req.query.scope || 'community').toString();
    const month = req.query.month || 'all';

    let result;
    if (scope === 'my_activity') {
      result = await buildMyActivityMetrics(req.user._id, month);
    } else {
      result = await buildCommunityMetrics(month);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Reports overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating reports'
    });
  }
});

export default router;


