import prisma from "../utils/prismaClient.js"

export const createContactService =async (data)=>{
    const contactData = await prisma.contact.create(data)
    return contactData
}

export const updateContactService = async(id,data)=>{
    const updatedContact = await prisma.contact.update({where:{id},data})
    return updatedContact
}
export const getContactService = async()=>{
    const conact = await prisma.contact.findMany()
    return conact
}