"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { HomePageHeader } from "@/components/customer/HomePageHeader";
import { useSession, useLogout } from "@/lib/hooks/use-auth";
import { addressesService, type Address } from "@/lib/api/services/addresses";
import {
  Loader2,
  Home,
  Building,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  User,
  ShoppingBag,
  Heart,
  Book,
  LogOut,
  X,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MenuItem {
  icon: typeof User;
  title: string;
  path: string;
}

export default function AddressesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hydrated } = useSession();
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    lines: ['', '', '', '', ''], // address, apartment, city, state, postalCode
    isDefault: false,
  });

  const menuItems: MenuItem[] = [
    { icon: Home, title: "Overview", path: "/account" },
    { icon: ShoppingBag, title: "My Orders", path: "/account/orders" },
    { icon: Heart, title: "My Wishlist", path: "/account/wishlist" },
    { icon: Book, title: "Address Book", path: "/account/addresses" },
    { icon: User, title: "Profile", path: "/account/profile" },
  ];

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    fetchAddresses();
  }, [isAuthenticated, user, hydrated, router]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await addressesService.getAddresses();
      setAddresses(response.data || []);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);

    // Handle the stored address lines and map them back to form fields
    // The database might store fewer elements if optional fields were empty
    const storedLines = address.lines || [];
    let formLines = ['', '', '', '', ''];

    if (storedLines.length >= 5) {
      // Standard case: all 5 fields present
      formLines = [
        storedLines[0] || '',
        storedLines[1] || '',
        storedLines[2] || '',
        storedLines[3] || '',
        storedLines[4] || '',
      ];
    } else if (storedLines.length === 4) {
      // Apartment was likely empty, stored as [address, city, state, postalCode]
      formLines = [
        storedLines[0] || '', // address
        '',                    // apartment (was empty)
        storedLines[1] || '', // city
        storedLines[2] || '', // state
        storedLines[3] || '', // postalCode
      ];
    } else if (storedLines.length === 3) {
      // Minimal address: [address, city, postalCode]
      formLines = [
        storedLines[0] || '', // address
        '',                    // apartment (was empty)
        storedLines[1] || '', // city
        '',                    // state (was empty)
        storedLines[2] || '', // postalCode
      ];
    } else {
      // Fallback: assign what we have
      formLines = storedLines.concat(Array(5 - storedLines.length).fill(''));
    }

    setFormData({
      label: address.label || '',
      lines: formLines,
      isDefault: address.isDefault,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      await addressesService.deleteAddress(id);
      await fetchAddresses();
    } catch (error) {
      console.error('Failed to delete address:', error);
      alert('Failed to delete address. Please try again.');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressesService.setDefaultAddress(id);
      await fetchAddresses();
    } catch (error) {
      console.error('Failed to set default address:', error);
      alert('Failed to set default address. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields are present (address, city, postalCode)
    if (!formData.lines[0]?.trim() || !formData.lines[2]?.trim() || !formData.lines[4]?.trim()) {
      alert('Please fill in at least the address, city, and postal code');
      return;
    }

    try {
      const addressData = {
        label: formData.label || undefined,
        lines: formData.lines, // Keep all lines to preserve positions
        isDefault: formData.isDefault,
      };

      if (editingAddress) {
        await addressesService.updateAddress(editingAddress.id, addressData);
      } else {
        await addressesService.createAddress(addressData);
      }

      setShowAddForm(false);
      setEditingAddress(null);
      setFormData({
        label: '',
        lines: ['', '', '', '', ''],
        isDefault: false,
      });
      await fetchAddresses();
    } catch (error) {
      console.error('Failed to save address:', error);
      alert('Failed to save address. Please try again.');
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingAddress(null);
    setFormData({
      label: '',
      lines: ['', '', '', '', ''],
      isDefault: false,
    });
  };

  if (!hydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const userInitials = user.fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getAddressIcon = (label: string | null) => {
    const lowerLabel = label?.toLowerCase() || '';
    if (lowerLabel.includes('home') || lowerLabel.includes('house')) return Home;
    if (lowerLabel.includes('office') || lowerLabel.includes('work') || lowerLabel.includes('business')) return Building;
    return MapPin;
  };

  return (
    <div className="min-h-screen bg-background">
      <HomePageHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        cartCount={0}
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3">
            <Card className="sticky top-6">
              <CardContent className="p-0">
                {/* Profile Avatar Section */}
                <div className="p-6 text-center border-b border-border">
                  <Avatar className="w-20 h-20 mx-auto mb-3">
                    <AvatarFallback className="bg-muted text-primary text-xl font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{user.fullName}</h3>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>

                {/* Navigation Menu */}
                <div className="p-2">
                  <ul className="space-y-0.5">
                    {menuItems.map((item, index) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.path ||
                                       (item.path === '/account' && pathname === '/account') ||
                                       (item.path !== '/account' && pathname.startsWith(item.path));

                      return (
                        <li key={index}>
                          <button
                            onClick={() => router.push(item.path)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                              "text-sm",
                              isActive
                                ? "bg-primary text-primary-foreground font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{item.title}</span>
                            {isActive && (
                              <ChevronRight className="w-4 h-4 ml-auto shrink-0" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Divider */}
                <div className="border-t border-border mx-2" />

                {/* Logout Button */}
                <div className="p-2">
                  <button
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      "text-sm text-destructive hover:bg-destructive/10",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {logout.isPending ? (
                      <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4 shrink-0" />
                    )}
                    <span>{logout.isPending ? 'Signing out...' : 'Sign Out'}</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">

            {/* Page Header */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">Address Book</h1>
                  <p className="text-muted-foreground">
                    Manage your delivery destinations with ease...
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingAddress(null);
                    setFormData({
                      label: '',
                      lines: ['', '', '', '', ''],
                      isDefault: false,
                    });
                    setShowAddForm(true);
                  }}
                  size="lg"
                  variant="default"
                >
                  Add New Address
                </Button>
              </div>
            </div>

            {/* Add/Edit Address Form */}
            {showAddForm && (
              <Card className="border-2 border-primary">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Address Label (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        placeholder="e.g., Home, Office, Mom's House"
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        value={formData.lines[0]}
                        onChange={(e) => {
                          const newLines = [...formData.lines];
                          newLines[0] = e.target.value;
                          setFormData({ ...formData, lines: newLines });
                        }}
                        placeholder="123 Main Street"
                        required
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Apartment, Suite, etc. (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.lines[1]}
                        onChange={(e) => {
                          const newLines = [...formData.lines];
                          newLines[1] = e.target.value;
                          setFormData({ ...formData, lines: newLines });
                        }}
                        placeholder="Apt 4B"
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          value={formData.lines[2]}
                          onChange={(e) => {
                            const newLines = [...formData.lines];
                            newLines[2] = e.target.value;
                            setFormData({ ...formData, lines: newLines });
                          }}
                          placeholder="New York"
                          required
                          className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          State/Province *
                        </label>
                        <input
                          type="text"
                          value={formData.lines[3]}
                          onChange={(e) => {
                            const newLines = [...formData.lines];
                            newLines[3] = e.target.value;
                            setFormData({ ...formData, lines: newLines });
                          }}
                          placeholder="NY"
                          required
                          className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        value={formData.lines[4]}
                        onChange={(e) => {
                          const newLines = [...formData.lines];
                          newLines[4] = e.target.value;
                          setFormData({ ...formData, lines: newLines });
                        }}
                        placeholder="10001"
                        required
                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={formData.isDefault}
                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                        className="w-4 h-4 text-primary focus:ring-primary"
                      />
                      <label htmlFor="isDefault" className="text-sm">
                        Set as default address
                      </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        size="lg"
                        variant="default"
                      >
                        {editingAddress ? 'Update Address' : 'Add Address'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Address List */}
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
                <p className="text-muted-foreground">Loading addresses...</p>
              </div>
            ) : addresses.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No addresses yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Add your first address to make checkout faster
                  </p>
                  <Button
                    onClick={() => {
                      setEditingAddress(null);
                      setFormData({
                        label: '',
                        lines: ['', '', '', '', ''],
                        isDefault: false,
                      });
                      setShowAddForm(true);
                    }}
                    size="lg"
                    variant="default"
                  >
                    Add Your First Address
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {addresses.map((address) => {
                  const Icon = getAddressIcon(address.label);
                  return (
                    <Card
                      key={address.id}
                      className={cn(
                        "relative group hover:shadow-md transition-shadow",
                        address.isDefault && "border-primary border-2"
                      )}
                    >
                      <CardContent className="p-5">
                        {/* Default Badge - Top Left */}
                        {address.isDefault && (
                          <Badge className="absolute top-4 left-4 bg-success text-white">
                            DEFAULT
                          </Badge>
                        )}

                        {/* Actions - Top Right */}
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => handleEdit(address)}
                            className="h-6 w-6"
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => handleDelete(address.id)}
                            className="h-6 w-6 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Address Icon & Label */}
                        <div className="flex items-start gap-3 mb-4 mt-2">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">
                              {address.label || 'Address'}
                            </h3>
                          </div>
                        </div>

                        {/* Address Details */}
                        <div className="space-y-1">
                          {address.lines.map((line, index) => (
                            line && (
                              <p key={index} className="text-sm text-muted-foreground">
                                {line}
                              </p>
                            )
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Add New Address Card */}
                <Card
                  className="border-dashed hover:border-primary transition-colors cursor-pointer"
                  onClick={() => {
                    setEditingAddress(null);
                    setFormData({
                      label: '',
                      lines: ['', '', '', '', ''],
                      isDefault: false,
                    });
                    setShowAddForm(true);
                  }}
                >
                  <CardContent className="p-5 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      Add New Location
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Expanding your reach? Add another address.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
