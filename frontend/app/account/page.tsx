"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HomePageHeader } from "@/components/customer/HomePageHeader";
import { useSession } from "@/lib/hooks/use-auth";
import { useLogout } from "@/lib/hooks/use-auth";
import { Loader2, ShoppingBag, Package, User, Settings, LogOut, ChevronRight } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin } = useSession();
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Redirect admins to their dashboard - /account is for customers only
    if (isAuthenticated && isAdmin) {
      router.push('/admin/dashboard');
    }

    // Redirect unauthenticated users to login
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#FBF9F8] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#00234E]" />
          <p className="mt-4 text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      icon: ShoppingBag,
      title: "My Orders",
      description: "View and track your orders",
      action: () => router.push('/orders'),
      color: "text-orange-500"
    },
    {
      icon: Package,
      title: "Order Tracking",
      description: "Track your recent deliveries",
      action: () => router.push('/orders'),
      color: "text-blue-500"
    },
    {
      icon: User,
      title: "Profile Settings",
      description: "Manage your account information",
      action: () => router.push('/account/profile'),
      color: "text-green-500"
    },
    {
      icon: Settings,
      title: "Account Settings",
      description: "Password and preferences",
      action: () => router.push('/account/settings'),
      color: "text-gray-500"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FBF9F8]">
      {/* Header */}
      <HomePageHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        cartCount={0}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.fullName.split(' ')[0]}!
            </h1>
            <p className="text-gray-600">
              Manage your account and track your orders
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="p-6 bg-gradient-to-r from-[#00234E] to-[#003366]">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-[#00234E]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-white">{user.fullName}</h2>
                  <p className="text-blue-200 text-sm">{user.email}</p>
                  {user.phone && (
                    <p className="text-blue-200 text-sm">{user.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Member Since</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Account Status</p>
                  <p className="text-green-600 font-medium">
                    {user.emailVerified ? 'Verified' : 'Pending Verification'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Account Type</p>
                  <p className="text-gray-900 font-medium">Customer Account</p>
                </div>
                <div>
                  <p className="text-gray-500">Email Status</p>
                  <p className={user.emailVerified ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                    {user.emailVerified ? 'Verified' : 'Verification Required'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="divide-y divide-gray-200">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {logout.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5" />
                Sign Out
              </>
            )}
          </button>

          {/* Help Section */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-2">Need help with your account?</p>
            <a
              href="/contact"
              className="text-[#00234E] hover:text-[#001a3a] font-medium"
            >
              Contact Our Support Team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}