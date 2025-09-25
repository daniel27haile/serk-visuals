// config/project_validation.js
const { z } = require("zod");
const { STATUSES } = require("../models/project_model");

const str = (min, max) => z.string().trim().min(min).max(max);
const optionalStr = (max) => z.string().trim().max(max).optional().nullable();

const isoDate = z
  .string()
  .datetime({ offset: true })
  .or(z.string().transform((v) => (v ? new Date(v).toISOString() : v)))
  .optional()
  .nullable();

const urlOpt = z.string().url().optional().nullable();

const common = {
  clientName: optionalStr(120),
  description: optionalStr(4000),
  startedAt: isoDate,
  dueAt: isoDate,
  deliveredAt: isoDate,
  coverUrl: urlOpt,
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).optional(),
};

exports.createProjectSchema = z.object({
  title: str(2, 180),
  status: z.enum(STATUSES).optional(),
  ...common,
});

exports.updateProjectSchema = z.object({
  title: optionalStr(180),
  status: z.enum(STATUSES).optional(),
  ...common,
});

exports.updateProjectStatusSchema = z.object({
  status: z.enum(STATUSES),
});
