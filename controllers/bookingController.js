import { createBookingService,getAllBookingService,updateBookingStatusService,getCampBookingsByIdService } from "../service/bookingService.js"

export const createBookingController = async(req,res)=>{
    const booking = await createBookingService(req.body)
    return res.status(201).json({message:"created booking",data:booking})
}

export const updateBookingStatusController = async(req,res)=>{
    const bookingId = parseInt(req.params.bookingId)
    const status = req.params.bookingStatus
    const booking = await updateBookingStatusService(bookingId,status)
    return res.status(201).json({message:"created booking",data:booking})
}

export const getAllBookingController = async(req,res)=>{
    const bookings  = await getAllBookingService();
    return res.status(201).json({message:"retrieved all booking datas",data:bookings})
}

export const getBookingByIdController = async(req,res)=>{
    const bookingId = parseInt(req.params.bookingId)
    const booking  = await getCampBookingsByIdService(bookingId);
    return res.status(201).json({message:"retrieved booking data by id ",data:booking})
}

export const getBookingsByUserIdController = async(req,res)=>{
    const userId = parseInt(req.params.userId)
    const bookings  = await getBookingsByUserIdController(userId);
    return res.status(201).json({message:"retrieved booking data by userid",data:bookings})
}