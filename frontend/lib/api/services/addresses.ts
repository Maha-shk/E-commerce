import { api } from '../client';
import type { ApiResponse } from '../types';

// Types
export interface Address {
  id: string;
  userId: string;
  label: string | null;
  lines: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressDto {
  label?: string;
  lines: string[];
  isDefault?: boolean;
}

export interface UpdateAddressDto {
  label?: string;
  lines?: string[];
  isDefault?: boolean;
}

// Service methods
export const addressesService = {
  /**
   * Get all addresses for authenticated user
   */
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    const { data } = await api.get<ApiResponse<Address[]>>('/addresses');
    return data;
  },

  /**
   * Get a single address by ID
   */
  async getAddress(id: string): Promise<ApiResponse<Address>> {
    const { data } = await api.get<ApiResponse<Address>>(`/addresses/${id}`);
    return data;
  },

  /**
   * Get default address for authenticated user
   */
  async getDefaultAddress(): Promise<ApiResponse<Address | null>> {
    const { data } = await api.get<ApiResponse<Address | null>>('/addresses/default/me');
    return data;
  },

  /**
   * Create a new address
   */
  async createAddress(dto: CreateAddressDto): Promise<ApiResponse<Address>> {
    const { data } = await api.post<ApiResponse<Address>>('/addresses', dto);
    return data;
  },

  /**
   * Update an existing address
   */
  async updateAddress(id: string, dto: UpdateAddressDto): Promise<ApiResponse<Address>> {
    const { data } = await api.patch<ApiResponse<Address>>(`/addresses/${id}`, dto);
    return data;
  },

  /**
   * Set an address as default
   */
  async setDefaultAddress(id: string): Promise<ApiResponse<void>> {
    const { data } = await api.patch<ApiResponse<void>>(`/addresses/${id}/default`);
    return data;
  },

  /**
   * Delete an address
   */
  async deleteAddress(id: string): Promise<ApiResponse<void>> {
    const { data } = await api.delete<ApiResponse<void>>(`/addresses/${id}`);
    return data;
  },
};
