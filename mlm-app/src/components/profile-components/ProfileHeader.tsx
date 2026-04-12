import { useRef, useState } from "react";
import { User, Camera, Edit2, Save, X } from "lucide-react";
import LuxuryImage from "../ui/LuxuryImage";
import imageCompression from "browser-image-compression";

export default function ProfileHeader({
  userData,
  editForm,
  isEditing,
  setIsEditing,
  setEditForm,
  handleSave,
  handleCancel,
}: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        onProgress: (p: number) => setUploadProgress(p * 0.5), 
      };
      
      const compressedFile = await imageCompression(file, options);
      
      let dummyProgress = 50;
      const interval = setInterval(() => {
        dummyProgress += 5;
        if (dummyProgress <= 100) setUploadProgress(dummyProgress);
      }, 50);

      await new Promise(resolve => setTimeout(resolve, 500));
      clearInterval(interval);
      setUploadProgress(100);

      const url = URL.createObjectURL(compressedFile);
      setEditForm({ ...editForm, avatar: url });
      userData.avatar = url; // optimistic internal patch for UI
      
      setTimeout(() => {
        setIsUploading(false);
      }, 400);

    } catch (error) {
      console.error(error);
      setIsUploading(false);
    }
  };

  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (uploadProgress / 100) * circumference;

  return (
    <div className="mb-12">
      <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange} />
      
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-between">
        
        {/* Avatar */}
        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
          <div className="relative w-32 h-32 overflow-hidden rounded-full bg-gradient-to-br from-[#c9a96e]/10 to-transparent">
            
            {editForm.avatar || userData.avatar ? (
              <LuxuryImage
                src={editForm.avatar || userData.avatar}
                alt={userData.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <User className="w-16 h-16 text-[#c9a96e]/40" />
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/60 backdrop-blur-sm group-hover:opacity-100">
              <Camera className="w-6 h-6 text-[#c9a96e]" />
            </div>
          </div>

          {/* Upload Progress SVG */}
          {(isUploading || uploadProgress === 100) && (
            <div className="absolute inset-0 -m-1">
              <svg className="w-[136px] h-[136px] transform -rotate-90">
                <circle
                  cx="68"
                  cy="68"
                  r={radius}
                  stroke="#c9a96e"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-200 ease-out"
                />
              </svg>
            </div>
          )}

          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 text-xs rounded-full bg-[#c9a96e] text-[#0a0705]">
            Member
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center md:text-left mt-4 md:mt-0">
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
                className="flex items-center gap-2 px-4 py-2 mt-4 md:mt-0 text-sm transition-colors rounded-lg text-[#c9a96e] hover:bg-[#c9a96e]/10"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2 mt-4 md:mt-0">
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