import { z } from "zod"

export const ruleSchema = z.object({
  field: z.enum(["store", "location", "amount", "notes", "tags"]),
  operator: z.enum([
    "equals",
    "contains",
    "startsWith",
    "endsWith",
    "greaterThan",
    "lessThan",
    "between",
  ]),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
  caseSensitive: z.boolean().optional(),
})

export const groupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color code")
    .optional()
    .or(z.literal("")),
  icon: z.string().optional(),
  rules: z.array(ruleSchema).optional(),
})

export type GroupFormValues = z.infer<typeof groupSchema>
