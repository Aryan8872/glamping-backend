import { addNewBlogService, getAllBlogService, getBlogByIDService, updateBlogStatusService } from "../service/blogsService.js"

export const addNewBlogController = async(req,res)=>{
    const blogData = req.body
    const data = await addNewBlogService(blogData)
    return res.status(200).json({message:"new blog added",data})
}

export const getAllBlogController = async(req,res)=>{
    const data = await getAllBlogService()
    return res.status(200).json({message:"all blogs",data})
}

export const getBlogByIDController = async(req,res)=>{
    const blogid = parseInt(req.params.blogId)
    const blog = await getBlogByIDService(blogid)
    return res.status(201).json({message:"blog by id",blog})
} 

export const updateBlogStatusController = async(req,res)=>{
    const blogid = parseInt(req.params.blogId)
    const status = req.params.status
    const blog = await updateBlogStatusService(blogid,status)
    return(blog? res.status(201).json({message:"blog status updated",blog}):res.status(404).json({message:"blog not status not updated",blog}))
} 