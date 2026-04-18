export function luxuryDate(dateInput: string | Date): string {
  if (!dateInput) return "";

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const day = date.getDate();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  const getOrdinalSuffix = (n: number): string => {
    if (n >= 11 && n <= 13) return "th";
    switch (n % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  return `${day}${getOrdinalSuffix(day)} of ${month}, ${year}`;
}
