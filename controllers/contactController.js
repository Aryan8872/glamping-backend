import {
  getContactService,
  upsertContactService,
} from "../service/contactService.js";

export const saveContactController = async (req, res) => {
  const newContact = await upsertContactService(req.body);
  return res.status(200).json({ message: "contact created", data: newContact });
};

export const updateContactController = async (req, res) => {
  const updatedContact = await upsertContactService(req.body);
  return res
    .status(200)
    .json({ message: "contact updated", data: updatedContact });
};

export const getContactController = async (req, res) => {
  const contactData = await getContactService();
  return res.status(200).json({ message: "contact data", data: contactData });
};
