"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "./use-auth";
import { wishlistApi, type WishlistItem } from "@/lib/api/services/wishlist";

export function useWishlist() {
  const { isAuthenticated } = useSession();
  const queryClient = useQueryClient();

  // Fetch wishlist from API
  const { data: wishlistData, isLoading: isLoadingWishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistApi.getWishlist(),
    enabled: isAuthenticated, // Only fetch when authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get wishlist items
  const wishlistItems: WishlistItem[] = wishlistData?.data?.items || [];

  // Get wishlist item IDs for easy checking
  const wishlistItemIds = wishlistItems.map(item => item.productId);

  // Check if product is in wishlist
  const isInWishlist = (productId: string) => {
    return wishlistItemIds.includes(productId);
  };

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await wishlistApi.addToWishlist(productId);
    },
    onSuccess: () => {
      toast.success("Added to wishlist");
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (error) => {
      console.error("Failed to add to wishlist:", error);
      toast.error("Failed to add to wishlist");
    },
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await wishlistApi.removeFromWishlist(itemId);
    },
    onSuccess: () => {
      toast.success("Removed from wishlist");
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (error) => {
      console.error("Failed to remove from wishlist:", error);
      toast.error("Failed to remove from wishlist");
    },
  });

  // Add to wishlist
  const addToWishlist = (productId: string) => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to wishlist");
      return;
    }
    addToWishlistMutation.mutate(productId);
  };

  // Remove from wishlist by product ID
  const removeFromWishlistByProductId = (productId: string) => {
    const item = wishlistItems.find(item => item.productId === productId);
    if (item) {
      removeFromWishlistMutation.mutate(item.id);
    }
  };

  // Remove from wishlist by item ID (for internal use)
  const removeFromWishlistByItemId = (itemId: string) => {
    removeFromWishlistMutation.mutate(itemId);
  };

  // Remove from wishlist - handles both product IDs and item IDs
  const removeFromWishlist = (id: string) => {
    // Check if it's a product ID or wishlist item ID
    const itemByProductId = wishlistItems.find(item => item.productId === id);
    if (itemByProductId) {
      removeFromWishlistMutation.mutate(itemByProductId.id);
      return;
    }

    // Otherwise assume it's a wishlist item ID
    removeFromWishlistMutation.mutate(id);
  };

  const isLoading = addToWishlistMutation.isPending || removeFromWishlistMutation.isPending;

  return {
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    removeFromWishlistByProductId,
    removeFromWishlistByItemId,
    isLoading,
    wishlistItems,
    wishlistItemIds,
  };
}