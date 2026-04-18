// mlm-app/src/pages/Profile.tsx
// Master-Detail profile layout.
// Desktop: two-column (sidebar nav + content panel).
// Mobile: menu hub → navigate to section.

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOnboardingStatus, getMe, updateMe } from "../api/auth";
import { listOrders } from "../api/orders";
import { getWalletBalance, type WalletSummary } from "../api/wallet";
import type { OnboardingStatus } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";


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
  ShoppingBag,
  Package,
  Wallet,
  User,
  ChevronRight,
  LogOut,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserData {
  name: string;
  email: string;
  mobile: string;
  walletBalance: number;
  referralCode: string;
  joinedDate: string;
  avatar?: string;
}

type ProfileTab = "account" | "orders" | "wallet" | "referrals";

// ─── Desktop Sidebar Nav ──────────────────────────────────────────────────────

const sidebarItems: { id: ProfileTab; icon: React.ElementType; label: string; luxury: string }[] = [
  { id: "account", icon: User, label: "My Account", luxury: "Personal Details" },
  { id: "orders", icon: Package, label: "Order History", luxury: "My Collection" },
  { id: "wallet", icon: Wallet, label: "Hadi Reserve", luxury: "Atelier Balance" },
  { id: "referrals", icon: Gift, label: "Referrals", luxury: "Invite & Earn" },
];

// ─── Mobile Menu List Item ────────────────────────────────────────────────────

function MobileMenuListItem({
  icon: Icon,
  label,
  sublabel,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full flex items-center justify-between
        px-5 py-4
        border-b border-white/8
        last:border-b-0
        hover:bg-[#c9a96e]/5 active:bg-[#c9a96e]/10
        transition-colors duration-300
        group
      "
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#c9a96e]/8 group-hover:bg-[#c9a96e]/15 transition-colors">
          <Icon className="w-4 h-4 text-[#c9a96e]" strokeWidth={1.5} />
        </div>
        <div className="text-left">
          <p className="text-sm text-[#e8dcc8] font-medium">{label}</p>
          {sublabel && (
            <p className="text-[10px] text-[#c9a96e]/50 uppercase tracking-widest mt-0.5">{sublabel}</p>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-[#e8dcc8]/50 group-hover:text-[#c9a96e]/60 transition-colors" />
    </button>
  );
}

// ─── Content Panels ───────────────────────────────────────────────────────────

function AccountPanel({
  userData,
  editForm,
  setEditForm,
  isEditing,
  setIsEditing,
  handleSave,
  handleCancel,
  isSaving,
  saveError,
  onboardingStatus,
}: {
  userData: UserData;
  editForm: UserData;
  setEditForm: (v: UserData) => void;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  handleSave: () => void;
  handleCancel: () => void;
  isSaving: boolean;
  saveError: string;
  onboardingStatus: OnboardingStatus | undefined;
}) {
  return (
    <div className="space-y-6">
      {/* Prose stats summary */}
      <p className="text-sm text-[#e8dcc8]/50 font-sans leading-relaxed mb-2">
        {onboardingStatus?.order_count > 0
          ? `You have collected ${onboardingStatus.order_count} fragrance${onboardingStatus.order_count === 1 ? '' : 's'} with Hadi.`
          : `Your fragrance journey with Hadi begins here.`}
      </p>

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
        <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
          {saveError}
        </div>
      )}



      <div className="bg-[#0d0a07]/40 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/8">
          <h2 className="text-sm uppercase tracking-widest text-[#c9a96e]/70">Personal Information</h2>
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
  );
}

function OrdersPanel({ activities }: { activities: any[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xs uppercase tracking-widest text-[#c9a96e]/70 mb-1">My Collection</h2>
        <p className="text-2xl font-display text-[#e8dcc8]">Your Collection</p>
      </div>
      {activities.length > 0 ? (
        <ActivityList activities={activities} />
      ) : (
        <div className="py-16 text-center rounded-2xl bg-[#0d0a07]/40">
          <ShoppingBag className="w-12 h-12 mx-auto text-[#c9a96e]/30 mb-4" />
          <p className="text-[#e8dcc8] mb-2 text-lg font-display">Your story with Hadi hasn't begun yet.</p>
          <p className="text-[#e8dcc8]/55 text-xs tracking-widest uppercase mb-6">Explore the collection below</p>
          <Link
            to="/product"
            className="inline-block px-6 py-3 bg-[#c9a96e] text-[#0a0705] rounded-lg tracking-widest text-xs uppercase font-medium hover:bg-[#c9a96e]/90 transition"
          >
            Explore Collection →
          </Link>
        </div>
      )}
    </div>
  );
}

function WalletPanel({ balance, pending }: { balance: number; pending?: number }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xs uppercase tracking-widest text-[#c9a96e]/70 mb-1">Atelier Balance</h2>
        <p className="text-2xl font-display text-[#e8dcc8]">Hadi Reserve</p>
      </div>
      <WalletCard balance={balance} pending={pending} />
    </div>
  );
}

function ReferralsPanel({ code }: { code: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xs uppercase tracking-widest text-[#c9a96e]/70 mb-1">Invite & Earn</h2>
        <p className="text-2xl font-display text-[#e8dcc8]">Referrals</p>
      </div>
      <ReferralCard code={code} />
    </div>
  );
}



// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="flex gap-12 animate-pulse">
      {/* Left sidebar skeleton */}
      <div className="w-64 shrink-0 space-y-4">
        <div className="h-24 rounded-2xl bg-[#c9a96e]/6 border border-white/8" />
        <div className="grid grid-cols-3 gap-2">
          {[0,1,2].map(i => <div key={i} className="h-16 rounded-xl bg-white/[0.03]" />)}
        </div>
        <div className="space-y-1 pt-2">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="h-10 rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      </div>
      {/* Right panel skeleton */}
      <div className="flex-1 p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#c9a96e]/8" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-44 rounded bg-[#c9a96e]/8" />
            <div className="h-3 w-28 rounded bg-white/5" />
          </div>
        </div>
        <div className="h-px bg-[#c9a96e]/8" />
        <div className="space-y-4">
          <div className="h-4 w-36 rounded bg-[#c9a96e]/8" />
          <div className="h-12 rounded-xl bg-white/[0.03]" />
          <div className="h-12 rounded-xl bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}

function ProfileSkeletonMobile() {
  return (
    <div className="animate-pulse space-y-6 px-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#c9a96e]/8 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-32 rounded bg-[#c9a96e]/8" />
          <div className="h-3 w-20 rounded bg-white/5" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0,1,2].map(i => <div key={i} className="h-16 rounded-xl bg-white/[0.03]" />)}
      </div>
      <div className="rounded-2xl border border-white/8 overflow-hidden">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="h-[60px] border-b border-white/8 bg-[#0d0a07] last:border-b-0" />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Profile() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<ProfileTab>("account");

  // Read deep-link tab from navigation state (set by Navbar dropdown links)
  useEffect(() => {
    const tabFromState = (location.state as { tab?: string } | null)?.tab;
    if (tabFromState && ["account", "orders", "wallet", "referrals"].includes(tabFromState)) {
      setActiveTab(tabFromState as ProfileTab);
    }
  }, [location.state]);

  const [mobileView, setMobileView] = useState<"menu" | ProfileTab>("menu");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserData | null>(null);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { count: wishlistCount } = useWishlist();
  const { setUserName, logout } = useAuth();
  const queryClient = useQueryClient();

  // ── API Queries (unchanged from original) ──
  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: onboardingStatus } = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: () => getOnboardingStatus(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: ordersData } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => listOrders({ limit: 5 }),
    staleTime: 60 * 1000,
  });

  const { data: walletData } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () => getWalletBalance(),
    staleTime: 60 * 1000,
  });

  // ── Derived Data (unchanged from original) ──
  const userData: UserData | null = meData
    ? {
        name: meData.full_name || "User",
        email: meData.email || "",
        mobile: meData.phone || "",
        walletBalance: walletData?.available ?? 0,
        referralCode:
          (meData as any).referral_code || meData.id.slice(0, 8).toUpperCase(),
        joinedDate: meData.onboarding_completed_at
          ? new Date(meData.onboarding_completed_at).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })
          : "Member",
      }
    : null;

  useEffect(() => {
    if (userData && !editForm) setEditForm(userData);
  }, [userData]);



  const activities =
    ordersData?.data.map((order) => {
      const diffDays = Math.floor(
        (Date.now() - new Date(order.created_at).getTime()) / 86400000
      );
      return {
        id: order.id,
        action: `Order #${order.id.slice(-6)}`,
        date: diffDays === 0 ? "Today" : `${diffDays} days ago`,
        status: order.status,
        amount: `${order.currency} ${parseFloat(order.total_amount).toFixed(0)}`,
      };
    }) ?? [];

  // ── Handlers (unchanged from original) ──
  const handleSave = async () => {
    if (!editForm || isSaving) return;
    setIsSaving(true);
    setSaveError("");
    try {
      await updateMe({ full_name: editForm.name, email: editForm.email });
      setUserName(editForm.name);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      setIsEditing(false);
    } catch {
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

  // ── Render active tab content ──
  const renderTabContent = () => {
    if (!userData || !editForm) return null;

    switch (activeTab) {
      case "account":
        return (
          <AccountPanel
            userData={userData}
            editForm={editForm}
            setEditForm={setEditForm}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            handleSave={handleSave}
            handleCancel={handleCancel}
            isSaving={isSaving}
            saveError={saveError}
            onboardingStatus={onboardingStatus}
          />
        );
      case "orders":
        return <OrdersPanel activities={activities} />;
      case "wallet":
        return <WalletPanel balance={userData.walletBalance} pending={walletData?.pending} />;
      case "referrals":
        return <ReferralsPanel code={userData.referralCode} />;

    }
  };

  // ── Mobile: which section to show ──
  const renderMobileContent = () => {
    if (!userData || !editForm) return null;

    switch (mobileView) {
      case "account":
        return (
          <AccountPanel
            userData={userData}
            editForm={editForm}
            setEditForm={setEditForm}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            handleSave={handleSave}
            handleCancel={handleCancel}
            isSaving={isSaving}
            saveError={saveError}
            onboardingStatus={onboardingStatus}
          />
        );
      case "orders":
        return <OrdersPanel activities={activities} />;
      case "wallet":
        return <WalletPanel balance={userData.walletBalance} pending={walletData?.pending} />;
      case "referrals":
        return <ReferralsPanel code={userData.referralCode} />;

      default:
        return null;
    }
  };

  const isLoading = meLoading;

  return (
    <div className="min-h-screen bg-void text-[#e8dcc8]">

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden md:block">
        {/* Desktop Navbar is handled globally — no local hamburger needed */}
        <div className="max-w-6xl mx-auto px-8 page-container">

          {isLoading ? (
            <ProfileSkeleton />
          ) : userData && editForm ? (
            <div className="flex gap-8">

              {/* ── LEFT SIDEBAR ── */}
              <aside className="w-56 shrink-0 pt-2">
                <div className="mb-8 pl-4">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-[#c9a96e]/40">Hadi Perfumes</p>
                </div>

                {/* Nav Items */}
                <nav className="flex flex-col gap-1">
                  {sidebarItems.map(({ id, icon: Icon, label, luxury }) => {
                    const isActive = activeTab === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setActiveTab(id)}
                        className={`
                          group relative overflow-hidden
                          w-full flex items-center justify-between
                          px-4 py-3 rounded-xl text-left
                          text-sm transition-all duration-500 ease-out
                          ${
                            isActive
                              ? "text-[#c9a96e] bg-gradient-to-r from-[#c9a96e]/10 to-transparent"
                              : "text-[#e8dcc8]/50 hover:text-[#e8dcc8]"
                          }
                        `}
                      >
                        {/* Hover Background Layer */}
                        <div 
                          className={`
                            absolute inset-0 bg-gradient-to-r from-[#c9a96e]/10 to-transparent 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out
                            ${isActive ? "hidden" : "block"}
                          `} 
                        />
                        
                        {/* Left Animated Indicator */}
                        <div 
                          className={`
                            absolute left-0 top-0 bottom-0 w-[2px] transition-all duration-500 ease-out
                            ${isActive ? "bg-[#c9a96e] scale-y-100" : "bg-[#c9a96e] scale-y-0 opacity-0 group-hover:scale-y-100 group-hover:opacity-100"}
                          `}
                        />

                        <div className="relative flex items-center gap-3 transition-transform duration-500 ease-out group-hover:translate-x-1.5">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-all duration-500 ease-out ${
                              isActive 
                                ? "text-[#c9a96e]" 
                                : "text-[#e8dcc8]/55 group-hover:text-[#c9a96e] group-hover:scale-105"
                            }`}
                            strokeWidth={1.5}
                          />
                          <span className={`tracking-wide transition-all duration-500 ${isActive ? "font-medium" : ""}`}>
                            {label}
                          </span>
                        </div>
                        
                        {/* Luxury Sublabel (fades in on hover) */}
                        {!isActive && (
                          <span className="relative text-[10px] uppercase tracking-widest text-[#c9a96e]/40 opacity-0 translate-x-1 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-x-0 hidden lg:block">
                            {luxury}
                          </span>
                        )}
                        {/* Chevron for Active */}
                        {isActive && (
                           <ChevronRight className="relative w-4 h-4 text-[#c9a96e]/50" />
                        )}
                      </button>
                    );
                  })}
                </nav>

                {/* Sign Out */}
                <div className="mt-6 pt-6 border-t border-white/8">
                  <button
                    type="button"
                    onClick={logout}
                    className="
                      group relative overflow-hidden
                      w-full flex items-center justify-between
                      px-4 py-3 rounded-xl text-left
                      text-sm text-[#e8dcc8]/50 hover:text-red-400
                      transition-all duration-500 ease-out
                    "
                  >
                    {/* Hover Background Layer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out" />
                    
                    {/* Left Animated Indicator */}
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-red-500 scale-y-0 opacity-0 transition-all duration-500 ease-out group-hover:scale-y-100 group-hover:opacity-100" />
                    
                    <div className="relative flex items-center gap-3 transition-transform duration-500 ease-out group-hover:translate-x-1.5">
                      <LogOut className="w-4 h-4 shrink-0 transition-transform duration-500 ease-out group-hover:scale-105" strokeWidth={1.5} />
                      <span className="tracking-wide">Sign Out</span>
                    </div>
                  </button>
                </div>
              </aside>

              {/* ── RIGHT CONTENT PANEL ── */}
              <main className="flex-1 min-w-0 p-8">
                {renderTabContent()}
              </main>

            </div>
          ) : (
            <div className="py-20 text-center text-muted/60">Failed to load profile.</div>
          )}
        </div>
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <div className="md:hidden">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-40 bg-void/95 backdrop-blur-sm border-b border-white/8 px-4 py-4 flex items-center gap-4">
          {mobileView !== "menu" && (
            <button
              type="button"
              onClick={() => {
                setMobileView("menu");
                setIsEditing(false);
              }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
              aria-label="Back to profile menu"
            >
              <ChevronRight className="w-5 h-5 text-[#e8dcc8] rotate-180" />
            </button>
          )}
          <span className="text-sm tracking-widest uppercase text-[#c9a96e]">
            {mobileView === "menu"
              ? "Profile"
              : sidebarItems.find((s) => s.id === mobileView)?.label ?? "Profile"}
          </span>
        </div>

        <div className="px-4 py-6">
          {isLoading ? (
            <ProfileSkeletonMobile />
          ) : userData && editForm ? (
            mobileView === "menu" ? (
              /* MOBILE MENU HUB */
              <div className="space-y-6">
                {/* User greeting */}
                <div className="flex items-center gap-4 px-1">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#c9a96e]/30 to-[#c9a96e]/10 flex items-center justify-center shrink-0">
                    <span className="text-xl font-display text-[#c9a96e]">
                      {userData.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-display text-xl text-[#e8dcc8]">{userData.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-[#c9a96e]/50 mt-0.5">
                      {userData.joinedDate}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-[#e8dcc8]/50 px-1">
                  {onboardingStatus?.order_count > 0
                    ? `Since joining, you have collected ${onboardingStatus.order_count} fragrance${onboardingStatus.order_count === 1 ? '' : 's'}.`
                    : `Your journey begins here.`}
                </p>

                {/* Menu list */}
                <div className="bg-[#0d0a07]/40 rounded-2xl overflow-hidden">
                  <MobileMenuListItem
                    icon={User}
                    label="Personal Details"
                    sublabel="My Account"
                    onClick={() => setMobileView("account")}
                  />
                  <MobileMenuListItem
                    icon={Package}
                    label="My Collection"
                    sublabel="Order History"
                    onClick={() => setMobileView("orders")}
                  />
                  <MobileMenuListItem
                    icon={Wallet}
                    label="Hadi Reserve"
                    sublabel={`₹ ${userData.walletBalance.toFixed(2)} available`}
                    onClick={() => setMobileView("wallet")}
                  />
                  <MobileMenuListItem
                    icon={Gift}
                    label="Referrals"
                    sublabel="Invite & Earn"
                    onClick={() => setMobileView("referrals")}
                  />

                </div>

                {/* Sign out */}
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-red-400/60 hover:text-red-400 border border-red-400/10 hover:border-red-400/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              /* MOBILE SECTION VIEW */
              <div className="pb-8">
                {renderMobileContent()}
              </div>
            )
          ) : (
            <div className="py-20 text-center text-muted/60">Failed to load profile.</div>
          )}
        </div>
      </div>
    </div>
  );
}
