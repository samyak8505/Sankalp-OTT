import { api } from '../../services/api';

export async function fetchMembershipPlans() {
  const res = await api.get('/membership/plans');
  return res.data?.data ?? [];
}

export async function simulateMembershipPurchase(planId) {
  const res = await api.post('/membership/simulate-purchase', { plan_id: planId });
  return res.data?.data;
}

export function formatPlanPrice(price, currency = 'INR') {
  const n = parseFloat(price);
  if (currency === 'INR') return `₹${n.toFixed(2)}`;
  if (currency === 'USD') return `$${n.toFixed(2)}`;
  return String(price);
}

export function getDurationLabel(duration) {
  const d = String(duration || '').toLowerCase();
  if (d === 'weekly' || d === 'week') return 'week';
  if (d === 'monthly' || d === 'month') return 'month';
  if (d === 'annual' || d === 'year' || d === 'yearly') return 'year';
  return duration;
}

export function formatMembershipEnd(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
