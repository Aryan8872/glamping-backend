import { getAboutUsService, upsertAboutUsService } from "../service/aboutUsService.js";

export const saveAboutUsController = async (req, res) => {
  try {
    const data = req.body;
    const saved = await upsertAboutUsService(data);

    return res.status(200).json({
      message: "Successfully saved about us content",
      data: saved,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateAboutUsController = async (req, res) => {
  const updatedData =await updateAboutUsService(req.body);
  return res
    .status(200)
    .json({
      message: "successfully updated about us content",
      data: updatedData,
    });
};



export const getAboutUsController = async (req, res) => {
  const data = await getAboutUsService();
  return res
    .status(200)
    .json({ message: "successfully retireved about us content", data: data });
};
