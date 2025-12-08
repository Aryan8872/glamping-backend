import * as experienceService from "./experienceService.js";
import {
  createExperienceSchema,
  updateExperienceSchema,
} from "./experienceValidation.js";
import { mapFilesToPaths } from "../../utils/uploads/mapFiles.js";

export const getAllExperiencesController = async (req, res) => {
  const includeInactive = req.query.includeInactive === "true";
  const experiences = await experienceService.getAllExperiences(
    includeInactive
  );
  res.json({ data: experiences });
};

export const getExperienceByIdController = async (req, res) => {
  const { id } = req.params;
  const experience = await experienceService.getExperienceById(id);
  res.json({ data: experience });
};

export const createExperienceController = async (req, res) => {
  const imagePaths = req.files?.imageUrl
    ? mapFilesToPaths(req.files.imageUrl)
    : [];

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
    imageUrl: imagePaths[0] || null,
  };

  const experience = await experienceService.createExperience(payload);
  res
    .status(201)
    .json({ data: experience, message: "Experience created successfully" });
};

export const updateExperienceController = async (req, res) => {
  const { id } = req.params;
  const imagePaths = req.files?.imageUrl
    ? mapFilesToPaths(req.files.imageUrl)
    : null;

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
    ...(imagePaths ? { imageUrl: imagePaths[0] } : {}),
  };

  const experience = await experienceService.updateExperience(id, payload);
  res.json({ data: experience, message: "Experience updated successfully" });
};

export const deleteExperienceController = async (req, res) => {
  const { id } = req.params;
  await experienceService.deleteExperience(id);
  res.json({ message: "Experience deleted successfully" });
};
