import * as contactService from "./contactService.js";
import {updateContactSchema } from "../../validation/contactSchema.js";
export const getContactController = async (req, res) => {
  const contact = await contactService.getContact();
  res.json({ data: contact });
};
export const updateContactController = async (req, res) => {
  const validatedData = updateContactSchema.parse(req.body);
  const contact = await contactService.updateContact(validatedData);
  res.json({ data: contact, message: "Contact updated successfully" });
};