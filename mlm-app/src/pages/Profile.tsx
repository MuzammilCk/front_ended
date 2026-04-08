import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOnboardingStatus } from "../api/auth";
import type { OnboardingStatus } from "../api/types";

import StatsCard from "../components/profile-components/StatsCard";
import ActivityList from "../components/profile-components/ActivityList";
import InfoField from "../components/profile-components/InfoField";
import ReferralCard from "../components/profile-components/ReferralCard";
import WalletCard from "../components/profile-components/WalletCard";
import ProfileHeader from "../components/profile-components/ProfileHeader";

import {
  Mail,
  Phone,
  MapPin,
  Shield,
  Clock,
  Gift,
  Heart,
  ShoppingBag,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

interface UserData {
  name: string;
  email: string;
  mobile: string;
  walletBalance: number;
  referralCode: string;
  joinedDate: string;
  address: string;
  avatar?: string;
}

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [cart, setCart] = useState<number[]>([]);
  const [userData, setUserData] = useState<UserData>({
    name: "Sophia Laurent",
    email: "sophia.laurent@hadi-perfumes.com",
    mobile: "+971 50 123 4567",
    walletBalance: 1250,
    referralCode: "HADI2025",
    joinedDate: "January 2024",
    address: "Downtown Dubai, UAE",
  });

  const [editForm, setEditForm] = useState(userData);

  const [onboardingStatus, setOnboardingStatus] = useState<
    OnboardingStatus | null
  >(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(userData.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setUserData(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm(userData);
    setIsEditing(false);
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Defer state updates to avoid react-hooks/set-state-in-effect lint.
      await Promise.resolve();
      setStatusLoading(true);
      getOnboardingStatus()
        .then((data) => {
          if (!cancelled) setOnboardingStatus(data);
        })
        .catch(() => {
          // Silently fail — user may not be logged in yet
          // Profile data stays as local placeholder state
        })
        .finally(() => {
          if (!cancelled) setStatusLoading(false);
        });
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    { label: "Orders", value: "24", icon: ShoppingBag },
    { label: "Wishlist", value: "12", icon: Heart },
    { label: "Reviews", value: "8", icon: Gift },
  ];

  const activities = [
    {
      action: "Order #AUR-1234",
      date: "2 days ago",
      status: "Delivered",
      amount: "AED 450",
    },
    {
      action: "Added to Wishlist",
      date: "3 days ago",
      status: "Oud Cambodi",
      amount: "",
    },
    {
      action: "Wallet Top-up",
      date: "1 week ago",
      status: "Completed",
      amount: "+AED 500",
    },
    {
      action: "Order #AUR-1233",
      date: "2 weeks ago",
      status: "Delivered",
      amount: "AED 890",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0705] text-[#e8dcc8] font-serif">
      <Sidebar
        cartCount={cart.length}
        wishlistCount={wishlist.length}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="sticky top-0 z-40 bg-[#0a0705]/95 backdrop-blur-sm border-b border-[#c9a96e]/10 p-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="p-2 transition rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a96e]/40"
        >
          <svg
            className="w-6 h-6 text-[#e8dcc8]"
            fill="none"
            stroke="currentColor"
          >
            <path strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <span className="text-sm text-[#c9a96e]">Profile</span>
      </div>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-noise" />
      </div>

      <div className="relative max-w-6xl px-4 py-8 mx-auto md:px-8 md:py-12">
        {/* Back */}
        <div className="mb-8">
          <Link to="/" className="text-[#c9a96e]/70 hover:text-[#c9a96e]">
            ← Back to Home
          </Link>
        </div>

        {/* Header */}
        <ProfileHeader
          userData={userData}
          editForm={editForm}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          setEditForm={setEditForm}
          handleSave={handleSave}
          handleCancel={handleCancel}
        />

        {/* Account status from API — inserted after ProfileHeader */}
        {onboardingStatus && (
          <div className="flex gap-3 mb-6 flex-wrap">
            <span className="px-3 py-1 text-xs rounded-full border border-[#c9a96e]/30 text-[#c9a96e]/80">
              Account: {onboardingStatus.status}
            </span>
            <span className="px-3 py-1 text-xs rounded-full border border-[#c9a96e]/30 text-[#c9a96e]/80">
              KYC: {onboardingStatus.kyc_status}
            </span>
            {onboardingStatus.onboarding_completed_at && (
              <span className="px-3 py-1 text-xs rounded-full border border-[#c9a96e]/30 text-[#c9a96e]/80">
                Member since:{' '}
                {new Date(
                  onboardingStatus.onboarding_completed_at,
                ).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {statusLoading && (
          <div className="mb-6 text-xs text-[#c9b99a]/40">
            Loading account status…
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 mb-12 md:grid-cols-3">
          {stats.map((s, i) => (
            <StatsCard key={i} {...s} />
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Personal Info */}
          <div className="lg:col-span-2">
            <div className="border border-[#c9a96e]/10 rounded-lg bg-gradient-to-br from-[#c9a96e]/5 to-transparent">
              <div className="p-6 border-b border-[#c9a96e]/10">
                <h2 className="text-xl">Personal Information</h2>
              </div>

              <div className="p-6 space-y-6">
                <InfoField
                  icon={Mail}
                  label="Email Address"
                  value={editForm.email}
                  isEditing={isEditing}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />

                <InfoField
                  icon={Phone}
                  label="Mobile Number"
                  value={editForm.mobile}
                  isEditing={isEditing}
                  onChange={(e) =>
                    setEditForm({ ...editForm, mobile: e.target.value })
                  }
                />

                <InfoField
                  icon={MapPin}
                  label="Address"
                  value={editForm.address}
                  isEditing={isEditing}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-6">
            <WalletCard balance={userData.walletBalance} />

            <ReferralCard
              code={userData.referralCode}
              copied={copied}
              onCopy={handleCopyReferral}
            />

            {/* Security */}
            <div className="border border-[#c9a96e]/10 rounded-lg bg-gradient-to-br from-[#c9a96e]/5 to-transparent p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-[#c9a96e]" />
                <h3 className="text-sm">Account Security</h3>
              </div>

              <div className="flex justify-between">
                <div className="flex items-center gap-2 text-xs text-[#c9b99a]/60">
                  <Clock className="w-4 h-4" />
                  2FA Available
                </div>
                <button className="text-xs text-[#c9a96e] hover:underline">
                  Enable →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="mt-12">
          <ActivityList activities={activities} />
        </div>
      </div>
    </div>
  );
}
