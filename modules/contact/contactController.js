import * as contactService from "./contactService.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getContactController = asyncHandler(async (req, res) => {
  const contact = await contactService.getContact();
  res.json({ message: "Contact info", data: contact });
});

export const updateContactController = asyncHandler(async (req, res) => {
  const data = req.validated || req.body;
  const updated = await contactService.updateContact(data);
  res.json({ message: "Contact updated", data: updated });
});
