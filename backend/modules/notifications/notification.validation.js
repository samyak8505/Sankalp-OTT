import Joi from 'joi';

export const sendNotificationSchema = Joi.object({
  title: Joi.string().max(255).required(),
  body: Joi.string().max(500).required(),
  type: Joi.string().valid('drama', 'membership', 'reward', 'reminder', 're-engage', 'custom').required(),
  trigger: Joi.string().valid('on-login', 'real-time', 'scheduled').default('on-login'),
  drama_id: Joi.string().uuid().optional(),
  audience: Joi.string().valid('all', 'free', 'paid', 'weekly-plan', 'monthly-plan', 'annual-plan').default('all'),
  scheduledAt: Joi.date().iso().optional().when('trigger', {
    is: 'scheduled',
    then: Joi.required(),
  }),
  ctaLink: Joi.string().uri().optional(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  showOncePerUser: Joi.boolean().default(false),
}).required();

export const updateNotificationConfigSchema = Joi.object({
  enableDramaNotifications: Joi.boolean().optional(),
  enableMembershipNotifications: Joi.boolean().optional(),
  enableRewardNotifications: Joi.boolean().optional(),
  defaultTrigger: Joi.string().valid('on-login', 'real-time', 'scheduled').optional(),
  maxNotificationsPerDay: Joi.number().min(1).max(10).optional(),
}).required();

export const getNotificationsSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(20),
  type: Joi.string().optional(),
  status: Joi.string().valid('sent', 'scheduled', 'draft').optional(),
}).required();
