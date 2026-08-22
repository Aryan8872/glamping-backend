import { z } from 'zod';

const statSchema = z.object({
  value: z.string().min(1, 'Value is required'),
  icon: z.string().optional(),
  heading: z.string().min(1, 'Heading is required'),
});

const coreValueSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  icon: z.string().optional(),
});

export const updateAboutUsSchema = z.object({
  aboutUs: z.string().min(10, 'About Us text must be at least 10 characters'),
  textbox_1: z.string().optional(),
  textbox_2: z.string().optional(),
  mission: z.string().min(10, 'Mission must be at least 10 characters'),
  vision: z.string().min(10, 'Vision must be at least 10 characters'),
  stats: z.array(statSchema).optional(),
  coreValues: z.array(coreValueSchema).optional(),
});
