import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  /**
   * Get all addresses for authenticated user
   */
  @Get()
  async findAll(@Request() req) {
    return this.addressesService.findAll(req.user.id);
  }

  /**
   * Get a single address by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.addressesService.findOne(id, req.user.id);
  }

  /**
   * Get default address for authenticated user
   */
  @Get('default/me')
  async getDefaultAddress(@Request() req) {
    return this.addressesService.getDefaultAddress(req.user.id);
  }

  /**
   * Create a new address
   */
  @Post()
  async create(@Request() req, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(req.user.id, dto);
  }

  /**
   * Update an existing address
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(id, req.user.id, dto);
  }

  /**
   * Set an address as default
   */
  @Patch(':id/default')
  async setDefault(@Param('id') id: string, @Request() req) {
    return this.addressesService.setDefault(id, req.user.id);
  }

  /**
   * Delete an address
   */
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.addressesService.remove(id, req.user.id);
  }
}
