import { Save, X } from "lucide-react";
import { luxuryDate } from "../../utils/luxuryDate";

export default function ProfileHeader({
  userData,
  editForm,
  isEditing,
  setIsEditing,
  setEditForm,
  handleSave,
  handleCancel,
  isSaving,
}: any) {
  return (
    <div className="mb-10 pb-8 border-b border-white/10">
      <div className="flex flex-col items-start">
        {isEditing ? (
          <input
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="bg-transparent border-b border-[#c9a96e]/40 focus:border-[#c9a96e] focus:outline-none text-[#e8dcc8] text-5xl md:text-6xl font-display font-light leading-none tracking-wide w-full pb-1 transition-colors duration-500"
          />
        ) : (
          <h1 className="text-5xl md:text-6xl font-display text-[#e8dcc8] font-light leading-none tracking-wide">
            {userData.name}
          </h1>
        )}

        <p className="mt-3 text-xs uppercase tracking-widest text-[#c9a96e]/50 font-sans">
          Connoisseur since {luxuryDate(userData.joinedDate) || userData.joinedDate}
        </p>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="mt-4 text-[10px] uppercase tracking-widest text-[#c9a96e]/50 hover:text-[#c9a96e] transition-colors duration-500 border-b border-transparent hover:border-[#c9a96e]/40 pb-0.5"
          >
            Edit Details
          </button>
        ) : (
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              aria-busy={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-[#c9a96e] text-[#0a0705] hover:bg-[#c9a96e]/80 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border border-[#0a0705] border-t-transparent rounded-full animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>

            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-[#e8dcc8]/60 hover:bg-[#c9a96e]/10"
            >
              <X className="w-4 h-4" />
              Discard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
