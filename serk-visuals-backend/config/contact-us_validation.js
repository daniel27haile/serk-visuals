// config/contact-us.validation.js
const { z } = require("zod");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createContactSchema = z.object({
  fullName: z.string().min(2).max(100).trim(),
  email: z
    .string()
    .regex(emailRegex)
    .transform((s) => s.toLowerCase().trim()),
  subject: z.string().min(3).max(150).trim(),
  message: z.string().min(1).max(2000).trim(),
  // reply intentionally excluded on create
});

const updateContactSchema = z.object({
  fullName: z.string().min(2).max(100).trim().optional(),
  email: z
    .string()
    .regex(emailRegex)
    .transform((s) => s.toLowerCase().trim())
    .optional(),
  subject: z.string().min(3).max(150).trim().optional(),
  message: z.string().min(1).max(2000).trim().optional(),
  reply: z.string().min(1).max(2000).trim().optional(),
  status: z.enum(["new", "read", "replied"]).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["new", "read", "replied"]),
});

module.exports = {
  createContactSchema,
  updateContactSchema,
  updateStatusSchema,
};
