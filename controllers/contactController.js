import {
  createContactService,
  getContactService,
  updateContactService,
} from "../service/contactService.js";

export const createContactController = async (req, res) => {
  const newContact = await createContactService(req.body);
  return res.status(200).json({ message: "contact created", data: newContact });
};

export const updateContactController = async (req, res) => {
  const contactId = parseInt(req.params.contactId);
  const updatedContact = await updateContactService(contactId, req.body);
  return res
    .status(200)
    .json({ message: "contact updated", data: updatedContact });
};

export const getContactController = async (req, res) => {
  const contactData = await getContactService();
  return res.status(200).json({ message: "contact data", data: contactData });
};
