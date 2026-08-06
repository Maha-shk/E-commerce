import { WishlistItemResponseDto } from './wishlist-item.dto';

export class WishlistResponseDto {
  id: string;
  items: WishlistItemResponseDto[];
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}