import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOnboardingStatus, getMe, updateMe } from "../api/auth";
import { listOrders } from "../api/orders";
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

  const [userData, setUserData] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState<UserData | null>(null);

  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [saveError, setSaveError] = useState("");

  const [stats, setStats] = useState([
    { label: "Orders", value: "—", icon: ShoppingBag },
    { label: "Wishlist", value: "—", icon: Heart },
    { label: "Reviews", value: "—", icon: Gift },
  ]);

  const [activities, setActivities] = useState<any[]>([]);

  const handleCopyReferral = () => {
    if (!userData) return;
    navigator.clipboard.writeText(userData.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!editForm) return;
    setSaveError("");
    try {
      await updateMe({ full_name: editForm.name, email: editForm.email });
      setUserData(editForm);
      setIsEditing(false);
    } catch (err) {
      setSaveError("Failed to save changes.");
    }
  };

  const handleCancel = () => {
    if (userData) setEditForm(userData);
    setIsEditing(false);
    setSaveError("");
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await Promise.resolve();
      setStatusLoading(true);

      try {
        const [me, status, orderCounts, recentOrders] = await Promise.all([
          getMe().catch(() => null),
          getOnboardingStatus().catch(() => null),
          listOrders({ limit: 1 }).catch(() => null),
          listOrders({ limit: 4 }).catch(() => null),
        ]);

        if (cancelled) return;

        if (me) {
          const joinedDate = me.onboarding_completed_at
            ? new Date(me.onboarding_completed_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : 'Member';

          const newUserData = {
            name: me.full_name || "User",
            email: me.email || "",
            mobile: me.phone || "",
            walletBalance: 0,
            referralCode: me.id.slice(0, 8).toUpperCase(),
            joinedDate,
            address: "",
          };
          setUserData(newUserData);
          setEditForm(newUserData);
        }

        if (status) {
          setOnboardingStatus(status);
        }

        if (orderCounts) {
          setStats([
            { label: "Orders", value: orderCounts.total.toString(), icon: ShoppingBag },
            { label: "Wishlist", value: "—", icon: Heart },
            { label: "Reviews", value: "—", icon: Gift },
          ]);
        }

        if (recentOrders && recentOrders.data.length > 0) {
          const mappedActivities = recentOrders.data.map((order) => {
            const diffTime = Math.abs(new Date().getTime() - new Date(order.created_at).getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            let dateStr = diffDays === 0 ? "Today" : `${diffDays} days ago`;

            return {
              action: `Order #${order.id.slice(-6)}`,
              date: dateStr,
              status: order.status,
              amount: "AED " + parseFloat(order.total_amount).toFixed(0),
            };
          });
          setActivities(mappedActivities);
        } else {
          setActivities([]);
        }

      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

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

        {statusLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin"></div>
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

                    <InfoField
                      icon={Phone}
                      label="Mobile Number"
                      value={editForm.mobile}
                      isEditing={isEditing}
                      onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    />

                    <InfoField
                      icon={MapPin}
                      label="Address"
                      value={editForm.address}
                      isEditing={isEditing}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <WalletCard balance={userData.walletBalance} />

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

            <div className="mt-12">
              {activities.length > 0 ? (
                <ActivityList activities={activities} />
              ) : (
                <div className="text-[#c9b99a]/60 italic">No recent activity yet.</div>
              )}
            </div>
          </>
        ) : (
          <div className="py-20 text-center text-[#c9b99a]/60">Failed to load profile.</div>
        )}
      </div>
    </div>
  );
}
