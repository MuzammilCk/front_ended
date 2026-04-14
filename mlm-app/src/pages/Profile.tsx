import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOnboardingStatus, getMe, updateMe } from "../api/auth";
import { listOrders } from "../api/orders";
import { getWalletBalance, type WalletSummary } from "../api/wallet";
import type { OnboardingStatus } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from '../context/WishlistContext';

import StatsCard from "../components/profile-components/StatsCard";
import ActivityList from "../components/profile-components/ActivityList";
import InfoField from "../components/profile-components/InfoField";
import ReferralCard from "../components/profile-components/ReferralCard";
import WalletCard from "../components/profile-components/WalletCard";
import ProfileHeader from "../components/profile-components/ProfileHeader";

import {
  Mail,
  Phone,
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
  avatar?: string;
}

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [cart, setCart] = useState<number[]>([]);

  const { count: wishlistCount } = useWishlist();

  const [editForm, setEditForm] = useState<UserData | null>(null);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { setUserName } = useAuth();
  const queryClient = useQueryClient();

  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => getMe(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: onboardingStatus } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: () => getOnboardingStatus(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => listOrders({ limit: 5 }),
    staleTime: 60 * 1000,
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => getWalletBalance(),
    staleTime: 60 * 1000,
  });

  const userData: UserData | null = meData ? {
    name: meData.full_name || 'User',
    email: meData.email || '',
    mobile: meData.phone || '',
    walletBalance: walletData?.available ?? 0,
    referralCode: (meData as any).referral_code || meData.id.slice(0, 8).toUpperCase(),
    joinedDate: meData.onboarding_completed_at
      ? new Date(meData.onboarding_completed_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'Member',
  } : null;

  useEffect(() => {
    if (userData && !editForm) setEditForm(userData);
  }, [userData]);

  const stats = [
    { label: 'Orders', value: ordersData ? String(ordersData.total) : '—', icon: ShoppingBag },
    { label: 'Wishlist', value: String(wishlistCount), icon: Heart },
    { label: 'Reviews', value: '—', icon: Gift },
  ];

  const activities = ordersData?.data.map((order) => {
    const diffDays = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 86400000);
    return {
      id: order.id,
      action: `Order #${order.id.slice(-6)}`,
      date: diffDays === 0 ? 'Today' : `${diffDays} days ago`,
      status: order.status,
      amount: `${order.currency} ${parseFloat(order.total_amount).toFixed(0)}`,
    };
  }) ?? [];

  const isLoading = meLoading;

  const handleCopyReferral = () => {
    if (!userData) return;
    navigator.clipboard.writeText(userData.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!editForm || isSaving) return;
    setIsSaving(true);
    setSaveError("");
    try {
      await updateMe({ full_name: editForm.name, email: editForm.email });
      setUserName(editForm.name);
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      setIsEditing(false);
    } catch (err) {
      setSaveError("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (userData) setEditForm(userData);
    setIsEditing(false);
    setSaveError("");
  };

  return (
    <div className="min-h-screen bg-[#0a0705] text-[#e8dcc8] font-serif">
      <Sidebar
        cartCount={cart.length}
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
          <svg className="w-6 h-6 text-[#e8dcc8]" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm text-[#c9a96e]">Profile</span>
      </div>

      <div className="fixed inset-0 bg-cover bg-center opacity-20 pointer-events-none" style={{ backgroundImage: 'url(/assets/profile-bg.png)' }} />

      <div className="relative max-w-6xl px-4 py-8 mx-auto md:px-8 md:py-12">
        <div className="mb-8">
          <Link to="/" className="text-[#c9a96e]/70 hover:text-[#c9a96e]">← Back to Home</Link>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-12">
              <div className="w-32 h-32 rounded-full bg-[#c9a96e]/10 shrink-0" />
              <div className="flex-1 space-y-3 w-full max-w-sm">
                <div className="h-8 w-48 rounded-lg bg-[#c9a96e]/10" />
                <div className="h-4 w-32 rounded-lg bg-white/5" />
              </div>
            </div>
            {/* Stats skeleton */}
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-white/5 border border-white/5" />
              ))}
            </div>
            {/* Main grid skeleton */}
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 h-64 rounded-2xl bg-white/5 border border-white/5" />
              <div className="space-y-6">
                <div className="h-40 rounded-2xl bg-white/5 border border-white/5" />
                <div className="h-32 rounded-2xl bg-white/5 border border-white/5" />
              </div>
            </div>
            {/* Activity skeleton */}
            <div className="h-48 rounded-2xl bg-white/5 border border-white/5" />
          </div>
        ) : userData && editForm ? (
          <>
            <ProfileHeader
              userData={userData}
              editForm={editForm}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              setEditForm={setEditForm}
              handleSave={handleSave}
              handleCancel={handleCancel}
              isSaving={isSaving}
            />

            {saveError && (
              <div className="mb-4 text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{saveError}</div>
            )}

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
                    {new Date(onboardingStatus.onboarding_completed_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}

            <div className="grid gap-4 mb-12 md:grid-cols-3">
              {stats.map((s, i) => (
                <StatsCard key={i} {...s} />
              ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
                  <div className="p-6 border-b border-[#c9a96e]/10">
                    <h2 className="text-xl">Personal Information</h2>
                  </div>

                  <div className="p-6 space-y-6">
                    <InfoField
                      icon={Mail}
                      label="Email Address"
                      value={editForm.email}
                      isEditing={isEditing}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />

                    <div>
                      <InfoField
                        icon={Phone}
                        label="Mobile Number"
                        value={editForm.mobile}
                        isEditing={false}
                        type="tel"
                      />
                      <p className="text-xs text-muted/40 mt-0.5 ml-9">To update, contact support</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <WalletCard balance={userData.walletBalance} pending={walletData?.pending} />

                <ReferralCard
                  code={userData.referralCode}
                  copied={copied}
                  onCopy={handleCopyReferral}
                />

                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-[#c9a96e]" />
                    <h3 className="text-sm">Account Security</h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted/40">
                    <Clock className="w-4 h-4" />
                    <span>Two-factor authentication</span>
                    <span className="ml-auto px-2 py-0.5 rounded-full border border-[#c9a96e]/20 text-[#c9a96e]/40 text-[10px] tracking-wider uppercase">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12">
              {activities.length > 0 ? (
                <ActivityList activities={activities} />
              ) : (
                <div className="py-16 text-center border border-[#c9a96e]/10 rounded-2xl bg-white/5 backdrop-blur-sm">
                  <ShoppingBag className="w-12 h-12 mx-auto text-[#c9a96e]/30 mb-4" />
                  <p className="text-[#e8dcc8] mb-6">Your story with Hadi hasn't begun yet.</p>
                  <Link to="/product" className="inline-block px-6 py-3 bg-[#c9a96e] text-[#0a0705] rounded-lg tracking-widest text-xs uppercase font-medium hover:bg-[#c9a96e]/90 transition">
                    Explore the Collection →
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-20 text-center text-muted/60">Failed to load profile.</div>
        )}
      </div>
    </div>
  );
}
