import * as adventureService from "./adventureService.js";
import {
  createAdventureSchema,
  updateAdventureSchema,
  assignAdventureSchema,
} from "../../validation/adventureSchema.js";
export const getAllAdventuresController = async (req, res) => {
  const includeInactive = req.query.includeInactive === "true";
  const adventures = await adventureService.getAllAdventures(includeInactive);
  res.json({ data: adventures });
};
export const getAdventureByIdController = async (req, res) => {
  const { id } = req.params;
  const adventure = await adventureService.getAdventureById(id);
  res.json({ data: adventure });
};
export const getAdventureBySlugController = async (req, res) => {
  const { slug } = req.params;
  const adventure = await adventureService.getAdventureBySlug(slug);
  res.json({ data: adventure });
};
export const createAdventureController = async (req, res) => {
  const validatedData = createAdventureSchema.parse(req.body);
  const adventure = await adventureService.createAdventure(validatedData);
  res.status(201).json({ data: adventure, message: "Adventure created successfully" });
};
export const updateAdventureController = async (req, res) => {
  const { id } = req.params;
  const validatedData = updateAdventureSchema.parse(req.body);
  const adventure = await adventureService.updateAdventure(id, validatedData);
  res.json({ data: adventure, message: "Adventure updated successfully" });
};
export const deleteAdventureController = async (req, res) => {
  const { id } = req.params;
  await adventureService.deleteAdventure(id);
  res.json({ message: "Adventure deleted successfully" });
};
export const assignAdventuresToCampController = async (req, res) => {
  const { campId } = req.params;
  const { adventureIds } = assignAdventureSchema.parse(req.body);
  const camp = await adventureService.assignAdventuresToCamp(campId, adventureIds);
  res.json({ data: camp, message: "Adventures assigned successfully" });
};