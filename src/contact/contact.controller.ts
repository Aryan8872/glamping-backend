import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ContactService } from './contact.service.js';
import { Public } from '../decorators/public.decorator.js';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Get()
  async getContact() {
    const contact = await this.contactService.getContact();
    return { message: 'successfully returned contact data', data: contact };
  }

  @Patch()
  async updateContact(@Body() body: any) {
    const updated = await this.contactService.updateContact(body);
    return { message: 'successfully updated contact data', data: updated };
  }
}
