import * as experienceService from "./experienceService.js";
import {
  createExperienceSchema,
  updateExperienceSchema,
} from "./experienceValidation.js";
import { processSingleFile } from "../../utils/uploads/uploadAdapter.js";

export const getAllExperiencesController = async (req, res) => {
  const { q, page, limit, isActive } = req.query;
  const result = await experienceService.searchExperiences({
    q,
    page: Number(page) || 1,
    perPage: Number(limit) || 15,
    isActive,
  });

  res.json({
    message: "Experiences fetched successfully",
    data: result.results,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    hasMore: result.hasMore,
  });
};

export const getExperienceByIdController = async (req, res) => {
  const { id } = req.params;
  const experience = await experienceService.getExperienceById(id);
  res.json({ data: experience });
};

export const createExperienceController = async (req, res) => {
  const imagePath = await processSingleFile(
    req.files?.imageUrl?.[0],
    "experience",
  );

  const slug = req.body.title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const rawData = {
    ...req.body,
    slug: req.body.slug || slug,
    isActive: req.body.isActive === "true" || req.body.isActive === true, // simple casting
  };

  const validatedData = createExperienceSchema.safeParse(rawData);

  if (!validatedData.success) {
    return res.status(400).json({
      message: "Validation Error",
      errors: validatedData.error.issues,
    });
  }

  const payload = {
    ...validatedData.data,
    imageUrl: imagePath || null,
  };

  const experience = await experienceService.createExperience(payload);
  res
    .status(201)
    .json({ data: experience, message: "Experience created successfully" });
};

export const updateExperienceController = async (req, res) => {
  const { id } = req.params;
  const imagePath = await processSingleFile(
    req.files?.imageUrl?.[0],
    "experience",
  );

  const rawData = { ...req.body };
  if (req.body.isActive !== undefined) {
    rawData.isActive =
      req.body.isActive === "true" || req.body.isActive === true;
  }

  const validatedData = updateExperienceSchema.safeParse(rawData);

  if (!validatedData.success) {
    return res.status(400).json({
      message: "Validation Error",
      errors: validatedData.error.issues,
    });
  }

  const payload = {
    ...validatedData.data,
    ...(imagePath ? { imageUrl: imagePath } : {}),
  };

  const experience = await experienceService.updateExperience(id, payload);
  res.json({ data: experience, message: "Experience updated successfully" });
};

export const deleteExperienceController = async (req, res) => {
  const { id } = req.params;
  await experienceService.deleteExperience(id);
  res.json({ message: "Experience deleted successfully" });
};
