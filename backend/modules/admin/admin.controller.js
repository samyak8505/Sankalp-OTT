import { prisma } from '../../prisma/client.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { AppError } from '../../middleware/error.middleware.js';

/**
 * GET /api/v1/admin/users
 * Fetch all users with their details (coins, status, membership expiry)
 * Admin only
 */
export async function getAllUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        coins: true,
        isBlocked: true,
        createdAt: true,
        memberships: {
          where: { status: 'ACTIVE' },
          orderBy: { end_date: 'desc' },
          take: 1,
          select: { end_date: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format response for frontend
    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role === 'USER' ? 'user' : u.role === 'ADMIN' ? 'admin' : 'sub_admin',
      plan: u.plan ? (u.plan === 'MEMBER' ? 'member' : 'free') : 'free',
      coins: u.coins || 0,
      joined: new Date(u.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      status: u.isBlocked ? 'Blocked' : 'Active',
      subscription: u.memberships.length > 0
        ? new Date(u.memberships[0].end_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : '—',
    }));

    return res.json(
      new ApiResponse(200, { users: formattedUsers, total: formattedUsers.length }, 'Users fetched successfully')
    );
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/admin/users/:userId/status
 * Toggle user block status
 */
export async function toggleUserStatus(req, res, next) {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: !user.isBlocked },
    });

    return res.json(
      new ApiResponse(
        200,
        { id: updated.id, isBlocked: updated.isBlocked },
        `User ${updated.isBlocked ? 'blocked' : 'unblocked'} successfully`
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/admin/users/:userId/coins
 * Adjust user coins (credit or debit)
 * Body: { amount: number (positive or negative), reason: string }
 */
export async function adjustUserCoins(req, res, next) {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || typeof amount !== 'number') {
      throw new AppError('Invalid amount provided', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const newCoins = Math.max(0, (user.coins || 0) + amount);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { coins: newCoins },
    });

    // Optional: log coin transaction
    if (amount !== 0) {
      await prisma.coinTransaction.create({
        data: {
          user_id: userId,
          amount: amount,
          type: amount > 0 ? 'CREDIT' : 'DEBIT',
          reason: reason || 'Admin adjustment',
        },
      });
    }

    return res.json(
      new ApiResponse(200, { id: updated.id, coins: updated.coins }, 'Coins adjusted successfully')
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/admin/users/:userId/profile
 * Fetch detailed user profile with activity and history
 */
export async function getUserProfile(req, res, next) {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        coins: true,
        isBlocked: true,
        createdAt: true,
        memberships: {
          select: {
            id: true,
            start_date: true,
            end_date: true,
            status: true,
            plan: { select: { name: true } },
          },
          orderBy: { created_at: 'desc' },
        },
        watch_history: {
          orderBy: { last_watched: 'desc' },
          take: 10,
          select: {
            episode: {
              select: {
                id: true,
                episode_num: true,
                title: true,
                show: { select: { id: true, title: true } },
              },
            },
            last_watched: true,
            progress_sec: true,
          },
        },
        coin_transactions: {
          orderBy: { created_at: 'desc' },
          take: 20,
          select: {
            id: true,
            amount: true,
            type: true,
            reason: true,
            created_at: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return res.json(new ApiResponse(200, user, 'User profile fetched successfully'));
  } catch (error) {
    next(error);
  }
}
