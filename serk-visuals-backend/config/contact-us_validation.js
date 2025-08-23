// validation/contact-us.js
const { z } = require("zod");

const createContactSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  subject: z.string().trim().min(1).max(150),
  message: z.string().trim().min(1).max(2000),
});

module.exports = { createContactSchema };
