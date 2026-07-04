import { z } from 'zod';

/**
 * Centralized validation schemas for API routes
 * Using Zod for runtime type safety and validation
 */

// ============ Authentication ============

export const LoginSchema = z.object({
  userId: z.string().min(1, 'Student ID is required').max(20),
  password: z.string().min(1, 'Password is required'),
});

export type LoginRequest = z.infer<typeof LoginSchema>;

// ============ AI Assistant ============

export const AssistantMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
  conversationId: z.string().optional(),
  context: z.object({
    studentId: z.string(),
    userName: z.string(),
  }).optional(),
});

export type AssistantMessage = z.infer<typeof AssistantMessageSchema>;

// ============ Student Settings ============

export const StudentSettingsSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  language: z.enum(['en', 'fil']).optional(),
  notifications_enabled: z.boolean().optional(),
  email_notifications: z.boolean().optional(),
  privacy_level: z.enum(['private', 'friends_only', 'public']).optional(),
});

export type StudentSettings = z.infer<typeof StudentSettingsSchema>;

// ============ Admin Routes ============

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  content: z.string().min(1, 'Content required'),
  category: z.enum(['academic', 'financial', 'event', 'general']),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  targetAudience: z.enum(['all', 'firstyear', 'seniors']).optional(),
});

export type CreateAnnouncement = z.infer<typeof CreateAnnouncementSchema>;

export const UpdateStudentSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  mobile: z.string().optional(),
  course: z.string().optional(),
  year_level: z.number().min(1).max(4).optional(),
  semester: z.number().min(1).max(2).optional(),
});

export type UpdateStudent = z.infer<typeof UpdateStudentSchema>;

// ============ Validation Helpers ============

/**
 * Safe parse with detailed error handling
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, errors: fieldErrors };
  }

  return { success: true, data: result.data };
}
