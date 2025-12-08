import {
  createDiscountService,
  getAllDiscountsService,
  getDiscountByIdService,
  updateDiscountService,
  deleteDiscountService,
  getActiveDiscountsService,
  getFeaturedDiscountService,
} from "./discountService.js";

export const createDiscountController = async (req, res) => {
  const discount = await createDiscountService(req.body);
  return res
    .status(201)
    .json({ message: "Discount created successfully", data: discount });
};

export const getAllDiscountsController = async (req, res) => {
  const discounts = await getAllDiscountsService();
  return res
    .status(200)
    .json({ message: "All discounts retrieved", data: discounts });
};

export const getDiscountByIdController = async (req, res) => {
  const { id } = req.params;
  const discount = await getDiscountByIdService(Number(id));
  if (!discount) {
    return res.status(404).json({ message: "Discount not found" });
  }
  return res
    .status(200)
    .json({ message: "Discount retrieved", data: discount });
};

export const updateDiscountController = async (req, res) => {
  const { id } = req.params;
  const discount = await updateDiscountService(Number(id), req.body);
  return res
    .status(200)
    .json({ message: "Discount updated successfully", data: discount });
};

export const deleteDiscountController = async (req, res) => {
  const { id } = req.params;
  await deleteDiscountService(Number(id));
  return res.status(200).json({ message: "Discount deleted successfully" });
};

export const getActiveDiscountsController = async (req, res) => {
  const discounts = await getActiveDiscountsService();
  return res
    .status(200)
    .json({ message: "Active discounts retrieved", data: discounts });
};

export const getFeaturedDiscountController = async (req, res) => {
  const discount = await getFeaturedDiscountService();
  return res
    .status(200)
    .json({ message: "Featured discount retrieved", data: discount });
};
