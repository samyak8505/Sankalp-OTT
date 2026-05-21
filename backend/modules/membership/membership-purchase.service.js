import { prisma } from '../../prisma/client.js';

/**
 * Add plan duration to a start date (supports seed values: weekly, monthly, annual).
 */
export function addPlanDuration(startDate, durationRaw) {
  const d = new Date(startDate);
  const duration = String(durationRaw || '').toLowerCase();

  if (duration === 'weekly' || duration === 'week') {
    d.setDate(d.getDate() + 7);
  } else if (duration === 'monthly' || duration === 'month') {
    d.setMonth(d.getMonth() + 1);
  } else if (duration === 'annual' || duration === 'year' || duration === 'yearly') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setDate(d.getDate() + 30);
  }

  return d;
}

/**
 * Simulated membership purchase (no payment gateway).
 * Grants MEMBER plan and active UserMembership for the plan duration.
 */
export async function simulateMembershipPurchase(userId, planId) {
  const plan = await prisma.membershipPlan.findFirst({
    where: { id: planId, is_active: true },
  });

  if (!plan) {
    return { ok: false, status: 400, message: 'Invalid or inactive membership plan' };
  }

  const now = new Date();

  const activeMembership = await prisma.userMembership.findFirst({
    where: {
      user_id: userId,
      status: 'ACTIVE',
      end_date: { gte: now },
    },
    orderBy: { end_date: 'desc' },
  });

  const extendFrom = activeMembership?.end_date > now ? activeMembership.end_date : now;
  const startDate = activeMembership?.start_date && activeMembership.end_date > now
    ? activeMembership.start_date
    : now;
  const endDate = addPlanDuration(extendFrom, plan.duration);

  const result = await prisma.$transaction(async (tx) => {
    await tx.userMembership.updateMany({
      where: {
        user_id: userId,
        status: 'ACTIVE',
        end_date: { gte: now },
      },
      data: { status: 'EXPIRED' },
    });

    const payment = await tx.paymentTransaction.create({
      data: {
        user_id: userId,
        type: 'membership',
        amount: plan.price,
        currency: plan.currency,
        gateway: 'simulated',
        status: 'completed',
      },
    });

    const membership = await tx.userMembership.create({
      data: {
        user_id: userId,
        plan_id: plan.id,
        payment_id: payment.id,
        start_date: startDate,
        end_date: endDate,
        status: 'ACTIVE',
      },
      include: { plan: true },
    });

    await tx.user.update({
      where: { id: userId },
      data: { plan: 'MEMBER' },
    });

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { coins: true, plan: true },
    });

    return { membership, user, payment };
  });

  return {
    ok: true,
    data: {
      plan: result.user.plan,
      coins: result.user.coins ?? 0,
      membership: {
        id: result.membership.id,
        plan_id: result.membership.plan_id,
        plan_name: result.membership.plan.name,
        duration: result.membership.plan.duration,
        start_date: result.membership.start_date,
        end_date: result.membership.end_date,
        status: result.membership.status,
      },
    },
    message: 'Membership activated',
  };
}
