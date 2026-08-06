"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HomePageHeader } from "@/components/customer/HomePageHeader";
import { useCart } from "@/lib/hooks/use-cart";
import { Loader2, ChevronDown } from "lucide-react";
import { useSession } from "@/lib/hooks/use-auth";
import { addressesService, type Address } from "@/lib/api/services/addresses";

interface FormErrors {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  country?: string;
  state?: string;
  postalCode?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cart, totalItems, subtotal, fetchCart, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, isAuthenticated } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Protect checkout page from direct URL access
  useEffect(() => {
    // If cart is still loading, wait
    if (!cart) {
      return;
    }

    // If cart is empty, redirect to products page with message
    if (cart.items && cart.items.length === 0) {
      // Show message and redirect
      alert('Your cart is empty. Please add items before checkout.');
      router.push('/products');
      return;
    }

    // Allow access if cart has items
    if (cart.items && cart.items.length > 0) {
      return;
    }
  }, [cart, router]);

  // Pre-fill form for authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      const nameParts = user.fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setContactInfo(prev => ({
        ...prev,
        email: user.email,
        phone: user.phone || ''
      }));

      setShippingAddress(prev => ({
        ...prev,
        firstName,
        lastName,
        country: prev.country || 'US'
      }));

      // Fetch addresses for authenticated users
      fetchAddresses();
    }
  }, [isAuthenticated, user]);

  // Smart address line mapping (handles different storage scenarios)
  const mapAddressLinesToForm = (storedLines: string[]) => {
    const lines = storedLines || [];
    let formLines = { address: '', apartment: '', city: '', state: '', postalCode: '' };

    if (lines.length >= 5) {
      // Standard case: all 5 fields present
      formLines = {
        address: lines[0] || '',
        apartment: lines[1] || '',
        city: lines[2] || '',
        state: lines[3] || '',
        postalCode: lines[4] || '',
      };
    } else if (lines.length === 4) {
      // Apartment was likely empty, stored as [address, city, state, postalCode]
      formLines = {
        address: lines[0] || '',
        apartment: '',
        city: lines[1] || '',
        state: lines[2] || '',
        postalCode: lines[3] || '',
      };
    } else if (lines.length === 3) {
      // Minimal address: [address, city, postalCode]
      formLines = {
        address: lines[0] || '',
        apartment: '',
        city: lines[1] || '',
        state: '',
        postalCode: lines[2] || '',
      };
    } else {
      // Fallback: assign what we have
      formLines = {
        address: lines[0] || '',
        apartment: lines[1] || '',
        city: lines[2] || '',
        state: lines[3] || '',
        postalCode: lines[4] || '',
      };
    }

    return formLines;
  };

  // Fetch addresses from backend
  const fetchAddresses = async () => {
    if (!isAuthenticated) return;

    try {
      setLoadingAddresses(true);
      const response = await addressesService.getAddresses();
      const userAddresses = response.data || [];

      setAddresses(userAddresses);

      // Auto-select default address or use first address
      if (userAddresses.length > 0) {
        const defaultAddress = userAddresses.find(addr => addr.isDefault) || userAddresses[0];
        setSelectedAddress(defaultAddress);

        // Pre-fill form with address data using smart mapping
        const formFields = mapAddressLinesToForm(defaultAddress.lines);
        setShippingAddress(prev => ({
          ...prev,
          ...formFields,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Handle address selection
  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);

    // Pre-fill form with selected address data using smart mapping
    const formFields = mapAddressLinesToForm(address.lines);
    setShippingAddress(prev => ({
      ...prev,
      ...formFields,
    }));

    setShowAddressDropdown(false);
  };

  // Handle entering a new address manually
  const handleEnterNewAddress = () => {
    setSelectedAddress(null);
    // Clear form fields for manual entry but keep user data
    setShippingAddress(prev => ({
      ...prev,
      address: '',
      apartment: '',
      city: '',
      state: '',
      postalCode: '',
    }));
  };

  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: ""
  });

  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    country: "",
    state: "",
    postalCode: ""
  });

  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return 'Phone number is required';
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phone)) return 'Please enter a valid phone number';
    if (phone.replace(/\D/g, '').length < 10) return 'Phone number must be at least 10 digits';
    return undefined;
  };

  const validatePostalCode = (postalCode: string, country: string): string | undefined => {
    if (!postalCode) return 'Postal code is required';

    const cleanPostalCode = postalCode.trim().toUpperCase();

    switch (country) {
      case 'US':
        const usRegex = /^\d{5}(-\d{4})?$/;
        if (!usRegex.test(cleanPostalCode)) return 'Please enter a valid US ZIP code (12345 or 12345-6789)';
        break;
      case 'CA':
        const caRegex = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/;
        if (!caRegex.test(cleanPostalCode.replace(/[\s\-]/g, ''))) return 'Please enter a valid Canadian postal code (A1A 1A1)';
        break;
      case 'UK':
        const ukRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/;
        if (!ukRegex.test(cleanPostalCode)) return 'Please enter a valid UK postal code';
        break;
      case 'AU':
        const auRegex = /^\d{4}$/;
        if (!auRegex.test(cleanPostalCode)) return 'Please enter a valid Australian postal code (4 digits)';
        break;
      default:
        if (cleanPostalCode.length < 3) return 'Postal code is too short';
        if (cleanPostalCode.length > 10) return 'Postal code is too long';
    }

    return undefined;
  };

  const validateField = (field: keyof FormErrors, value: string, additionalData?: any): string | undefined => {
    switch (field) {
      case 'email':
        return validateEmail(value);
      case 'phone':
        return validatePhone(value);
      case 'postalCode':
        return validatePostalCode(value, additionalData);
      default:
        if (!value || value.trim() === '') return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
        return undefined;
    }
  };

  const handleFieldBlur = (field: keyof FormErrors, value: string, additionalData?: any) => {
    setTouchedFields(prev => new Set([...prev, field]));
    const error = validateField(field, value, additionalData);
    setFormErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleFieldChange = (field: keyof FormErrors, value: string, additionalData?: any) => {
    const error = validateField(field, value, additionalData);
    setFormErrors(prev => ({ ...prev, [field]: error }));
  };

  const shippingCost = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + shippingCost;
  const items = cart?.items || [];

  const handleConfirmOrder = async () => {
    // Validate all fields
    const errors: FormErrors = {};

    // Validate contact info
    errors.email = validateField('email', contactInfo.email);
    errors.phone = validateField('phone', contactInfo.phone);

    // Validate shipping address
    errors.firstName = validateField('firstName', shippingAddress.firstName);
    errors.lastName = validateField('lastName', shippingAddress.lastName);
    errors.address = validateField('address', shippingAddress.address);
    errors.city = validateField('city', shippingAddress.city);
    errors.country = validateField('country', shippingAddress.country);
    errors.postalCode = validateField('postalCode', shippingAddress.postalCode, shippingAddress.country);

    // Check if any errors exist
    const hasErrors = Object.values(errors).some(error => error !== undefined);
    if (hasErrors) {
      setFormErrors(errors);
      setTouchedFields(new Set([
        'email', 'phone', 'firstName', 'lastName', 'address',
        'city', 'country', 'state', 'postalCode'
      ]));
      alert('Please fix the validation errors before proceeding');
      return;
    }

    if (items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      // Create order data matching backend expectations
      const orderData = {
        contactInfo,
        shippingAddress,
        deliveryMethod,
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          salePrice: item.salePrice,
          image: item.image
        })),
        subtotal,
        shippingCost,
        total,
        // Add user info if authenticated
        userId: isAuthenticated && user ? user.id : undefined
      };

      console.log('Creating order with data:', orderData);

      // Call public API to create order
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(errorText || 'Failed to create order');
      }

      const result = await response.json();
      console.log('Order created:', result);

      const orderId = result.data.orderNumber || result.data.id;

      // Set flag that user just completed checkout
      sessionStorage.setItem('justCompletedCheckout', 'true');
      sessionStorage.setItem('recentOrderId', orderId);

      // Clear cart after successful order
      await clearCart();

      // If user is not authenticated, redirect to login/signup for order tracking
      if (!isAuthenticated) {
        // Store the order info for post-login redirect
        sessionStorage.setItem('pendingOrderId', orderId);
        sessionStorage.setItem('pendingOrderEmail', contactInfo.email);

        router.push('/login?redirect=order-confirmation');
      } else {
        // Redirect to order confirmation page
        router.push(`/order-confirmation/${orderId}`);
      }
    } catch (error) {
      console.error('Order creation failed:', error);
      alert(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F8]">
      {/* Header/Navigation */}
      <HomePageHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        cartCount={totalItems}
      />

      {/* Main Checkout Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Page Heading with Return to Cart */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Checkout</h1>
          <Link
            href="/cart"
            className="inline-flex items-center text-[#00234E] hover:text-[#00234E]/80 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Return to Cart
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Contact Information & Shipping Address */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Contact Information & Shipping Address</h2>

              {/* Contact Section */}
              <div className="mb-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => {
                        setContactInfo({ ...contactInfo, email: e.target.value });
                        if (touchedFields.has('email')) {
                          handleFieldChange('email', e.target.value);
                        }
                      }}
                      onBlur={() => handleFieldBlur('email', contactInfo.email)}
                      placeholder="Enter your email"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#00234E] focus:border-transparent outline-none transition-all ${
                        formErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.email && touchedFields.has('email') && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => {
                        setContactInfo({ ...contactInfo, phone: e.target.value });
                        if (touchedFields.has('phone')) {
                          handleFieldChange('phone', e.target.value);
                        }
                      }}
                      onBlur={() => handleFieldBlur('phone', contactInfo.phone)}
                      placeholder="Enter your phone number"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#00234E] focus:border-transparent outline-none transition-all ${
                        formErrors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.phone && touchedFields.has('phone') && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Section */}
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-4">Shipping Address</h3>

                {/* Manual Address Entry Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.firstName}
                        onChange={(e) => {
                          setShippingAddress({ ...shippingAddress, firstName: e.target.value });
                          if (touchedFields.has('firstName')) {
                            handleFieldChange('firstName', e.target.value);
                          }
                        }}
                        onBlur={() => handleFieldBlur('firstName', shippingAddress.firstName)}
                        placeholder="First name"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#00234E] focus:border-transparent outline-none transition-all ${
                          formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.firstName && touchedFields.has('firstName') && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.lastName}
                        onChange={(e) => {
                          setShippingAddress({ ...shippingAddress, lastName: e.target.value });
                          if (touchedFields.has('lastName')) {
                            handleFieldChange('lastName', e.target.value);
                          }
                        }}
                        onBlur={() => handleFieldBlur('lastName', shippingAddress.lastName)}
                        placeholder="Last name"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#00234E] focus:border-transparent outline-none transition-all ${
                          formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.lastName && touchedFields.has('lastName') && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    {isAuthenticated && addresses.length > 0 ? (
                      <select
                        value={selectedAddress?.id || 'manual'}
                        onChange={(e) => {
                          if (e.target.value === 'manual') {
                            handleEnterNewAddress();
                          } else {
                            const address = addresses.find(a => a.id === e.target.value);
                            if (address) {
                              handleAddressSelect(address);
                            }
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#00234E] focus:border-transparent outline-none transition-all bg-white ${
                          formErrors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="manual">Enter new address...</option>
                        {addresses.map((address) => (
                          <option key={address.id} value={address.id}>
                            {address.label || 'Address'} {address.isDefault ? '(Default)' : ''} - {address.lines[0]}, {address.lines[2]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={shippingAddress.address}
                        onChange={(e) => {
                          setShippingAddress({ ...shippingAddress, address: e.target.value });
                          if (touchedFields.has('address')) {
                            handleFieldChange('address', e.target.value);
                          }
                        }}
                        onBlur={() => handleFieldBlur('address', shippingAddress.address)}
                        placeholder="Street address"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#00234E] focus:border-transparent outline-none transition-all ${
                          formErrors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    )}
                    {formErrors.address && touchedFields.has('address') && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apartment, suite, etc. (optional)
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.apartment}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, apartment: e.target.value })}
                      placeholder="Apartment, suite, etc."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00234E] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => {
                          setShippingAddress({ ...shippingAddress, city: e.target.value });
                          if (touchedFields.has('city')) {
                            handleFieldChange('city', e.target.value);
                          }
                        }}
                        onBlur={() => handleFieldBlur('city', shippingAddress.city)}
                        placeholder="City"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#00234E] focus:border-transparent outline-none transition-all ${
                          formErrors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.city && touchedFields.has('city') && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <select
                        value={shippingAddress.country}
                        onChange={(e) => {
                          setShippingAddress({ ...shippingAddress, country: e.target.value });
                          if (touchedFields.has('country')) {
                            handleFieldChange('country', e.target.value);
                          }
                          // Re-validate postal code when country changes
                          if (touchedFields.has('postalCode')) {
                            handleFieldBlur('postalCode', shippingAddress.postalCode);
                          }
                        }}
                        onBlur={() => handleFieldBlur('country', shippingAddress.country)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#00234E] focus:border-transparent outline-none transition-all ${
                          formErrors.country ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select country</option>
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="UK">United Kingdom</option>
                        <option value="AU">Australia</option>
                      </select>
                      {formErrors.country && touchedFields.has('country') && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.country}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State/Province
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => {
                          setShippingAddress({ ...shippingAddress, state: e.target.value });
                          if (touchedFields.has('state')) {
                            handleFieldChange('state', e.target.value);
                          }
                        }}
                        onBlur={() => handleFieldBlur('state', shippingAddress.state)}
                        placeholder="State"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00234E] focus:border-transparent outline-none transition-all"
                      />
                      {formErrors.state && touchedFields.has('state') && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.state}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.postalCode}
                        onChange={(e) => {
                          setShippingAddress({ ...shippingAddress, postalCode: e.target.value });
                          if (touchedFields.has('postalCode')) {
                            handleFieldChange('postalCode', e.target.value, shippingAddress.country);
                          }
                        }}
                        onBlur={() => handleFieldBlur('postalCode', shippingAddress.postalCode, shippingAddress.country)}
                        placeholder="Postal code"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#00234E] focus:border-transparent outline-none transition-all ${
                          formErrors.postalCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.postalCode && touchedFields.has('postalCode') && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.postalCode}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Delivery Method */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Method</h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-[#00234E] transition-colors">
                  <input
                    type="radio"
                    name="delivery"
                    value="standard"
                    checked={deliveryMethod === "standard"}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="w-4 h-4 text-[#00234E] focus:ring-[#00234E]"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Standard Delivery</span>
                      <span className="text-gray-600">{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Delivery in 5-7 business days</p>
                  </div>
                </label>
                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-[#00234E] transition-colors">
                  <input
                    type="radio"
                    name="delivery"
                    value="express"
                    checked={deliveryMethod === "express"}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="w-4 h-4 text-[#00234E] focus:ring-[#00234E]"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Express Delivery</span>
                      <span className="text-gray-600">$14.99</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Delivery in 2-3 business days</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary (Card 4) */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Your cart is empty</p>
                    <Link
                      href="/products"
                      className="inline-block mt-4 text-orange-500 hover:text-orange-600 font-medium"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative w-20 h-20 shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                          {item.name}
                        </h3>
                        <p className="text-gray-500 text-xs mt-1">Qty: {item.quantity}</p>
                        <p className="text-orange-500 font-semibold text-sm mt-1">
                          ${(item.salePrice * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order Totals */}
              {items.length > 0 && (
                <>
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span className="text-orange-500">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Complete Order Button */}
                  <button
                    onClick={handleConfirmOrder}
                    disabled={isProcessing || items.length === 0}
                    className="w-full mt-6 bg-[#00234E] hover:bg-[#00234E]/90 text-white py-4 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm Order'
                    )}
                  </button>

                  {/* Security Note */}
                  <div className="mt-4 flex items-center justify-center text-gray-500 text-xs">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secure checkout powered by Stripe
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}