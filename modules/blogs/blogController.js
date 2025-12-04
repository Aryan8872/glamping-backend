import {
  addNewBlogService,
  getAllBlogService,
  getBlogByIDService,
  updateBlogStatusService,
} from "./blogService.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const addNewBlogController = asyncHandler(async (req, res) => {
  const blogData = req.validated || req.body;
  const data = await addNewBlogService(blogData);
  return res.status(201).json({ message: "new blog added", data });
});

export const getAllBlogController = asyncHandler(async (req, res) => {
  const data = await getAllBlogService();
  return res.status(200).json({ message: "all blogs", data });
});

export const getBlogByIDController = asyncHandler(async (req, res) => {
  const blogid = parseInt(req.params.blogId);
  const blog = await getBlogByIDService(blogid);
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }
  return res.status(200).json({ message: "blog by id", blog });
});

export const updateBlogStatusController = asyncHandler(async (req, res) => {
  const blogid = parseInt(req.params.blogId);
  const status = req.validated?.status || req.params.status;

  const blog = await updateBlogStatusService(blogid, status);

  if (blog) {
    return res.status(200).json({ message: "blog status updated", blog });
  } else {
    return res
      .status(400)
      .json({ message: "Invalid status or blog not found" });
  }
});
