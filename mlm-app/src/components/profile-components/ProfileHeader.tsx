import { User, Camera, Edit2, Save, X } from "lucide-react";
import LuxuryImage from "../ui/LuxuryImage";

export default function ProfileHeader({
  userData,
  editForm,
  isEditing,
  setIsEditing,
  setEditForm,
  handleSave,
  handleCancel,
}) {
  return (
    <div className="mb-12">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-between">
        
        {/* Avatar */}
        <div className="relative group">
          <div className="relative w-32 h-32 overflow-hidden border-2 rounded-full border-[#c9a96e]/30 bg-gradient-to-br from-[#c9a96e]/10 to-transparent">
            
            {userData.avatar ? (
              <LuxuryImage
                src={userData.avatar}
                alt={userData.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <User className="w-16 h-16 text-[#c9a96e]/40" />
              </div>
            )}

            <button className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/60 group-hover:opacity-100">
              <Camera className="w-6 h-6 text-[#c9a96e]" />
            </button>
          </div>

          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 text-xs rounded-full bg-[#c9a96e] text-[#0a0705]">
            Member
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col items-center gap-2 md:flex-row md:items-baseline md:justify-between">

            {/* Name */}
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="px-3 py-1 text-3xl font-light bg-transparent border rounded-lg border-[#c9a96e]/30 text-[#e8dcc8] focus:outline-none focus:border-[#c9a96e]"
                />
              ) : (
                <h1 className="text-3xl font-light">{userData.name}</h1>
              )}

              <p className="mt-1 text-sm text-muted/60">
                Premium Member since {userData.joinedDate}
              </p>
            </div>

            {/* Buttons */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm transition-colors rounded-lg text-[#c9a96e] hover:bg-[#c9a96e]/10"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-[#c9a96e] text-[#0a0705] hover:bg-[#c9a96e]/80"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>

                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-[#e8dcc8]/60 hover:bg-[#c9a96e]/10"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}