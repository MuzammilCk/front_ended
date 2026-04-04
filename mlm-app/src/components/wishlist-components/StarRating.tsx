import { Star } from "lucide-react";

export default function StarRating({ rating, reviews }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i < fullStars
              ? "fill-[#c9a96e] text-[#c9a96e]"
              : i === fullStars && hasHalfStar
              ? "text-[#c9a96e]"
              : "text-[#c9b99a]/30"
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-[#c9b99a]/60">{rating}</span>
      <span className="text-xs text-[#c9b99a]/40">({reviews})</span>
    </div>
  );
}