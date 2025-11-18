import {
  createGalleryService,
  getGalleryBySlugService,
  getGalleryService,
  updateGalleryService,
} from "../service/galleryService.js";

export const createGalleryController = async (req, res) => {
  const galleryData = await createGalleryService(req.body);
  return res
    .status(200)
    .json({ message: "Gallery created", data: galleryData });
};

export const updateGalleryController = async (req, res) => {
  const galleryId = parseInt(req.params.galleryId);
  const galleryData = await updateGalleryService(galleryId, req.body);
  return res
    .status(200)
    .json({ message: "gallery updated", data: galleryData });
};

export const getGalleryController = async (req, res) => {
  const galleryData = await getGalleryService();
  return res.status(200).json({ message: "gallery data", data: galleryData });
};

export const getGalleryBySlugController = async (req, res) => {
  const slug = req.params.slug;
  const galleryData = await getGalleryBySlugService(slug);
  return res
    .status(200)
    .json({ message: "gallery by id data", data: galleryData });
};

export const updateGalleryStatusController = async (req, res) => {
  const galleryId = parseInt(req.params.galleryId);
  const status = req.params.status;
  const gallery = await updateGalleryStatusController(galleryId, status);
  return gallery
    ? res.status(201).json({ message: "gallery status updated", gallery })
    : res.status(404).json({ message: "gallery status not updated", gallery });
};
