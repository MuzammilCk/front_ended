export type ScentFamily = {
  family: string;
  count: string;
  description: string;
  keyNotes: string[];
  accent: string;
};

export const scentFamilies: ScentFamily[] = [
  {
    family: "Woody & Resinous",
    count: "14 fragrances",
    description:
      "Grounded, smoldering woods—cedar, vetiver, and resin that linger like embers.",
    keyNotes: ["Cedar", "Vetiver", "Sandalwood"],
    accent: "#6b5344",
  },
  {
    family: "Floral & Romantic",
    count: "9 fragrances",
    description:
      "Velvet petals and honeyed blooms—rose, jasmine, and soft powder on the skin.",
    keyNotes: ["Rose", "Jasmine", "Iris"],
    accent: "#9a6b78",
  },
  {
    family: "Fresh & Aquatic",
    count: "7 fragrances",
    description:
      "Crisp air and clean water—citrus zest, sea spray, and green stems.",
    keyNotes: ["Bergamot", "Marine", "Green tea"],
    accent: "#6a8f8c",
  },
  {
    family: "Oriental & Spicy",
    count: "11 fragrances",
    description:
      "Warm, resinous depths anchored by oud, amber, and spice.",
    keyNotes: ["Oud", "Amber", "Cardamom"],
    accent: "#8b5e3c",
  },
];

export type Testimonial = {
  text: string;
  author: string;
  location: string;
  fragrance: string;
  rating: 5;
};

export const testimonialsData: Testimonial[] = [
  {
    text: "Aurore fragrances are not just scents — they are memories bottled. The depth and elegance are unmatched.",
    author: "Sophia Laurent",
    location: "Paris, France",
    fragrance: "Noir Absolu",
    rating: 5,
  },
  {
    text: "The oud collection is extraordinary. Long-lasting, rich, and deeply personal. I receive compliments everywhere.",
    author: "Daniel Reed",
    location: "London, UK",
    fragrance: "Oud Majestic",
    rating: 5,
  },
  {
    text: "A perfect balance of art and science. Every fragrance tells a story. Truly a luxury experience.",
    author: "Amira Khan",
    location: "Dubai, UAE",
    fragrance: "Sable Doré",
    rating: 5,
  },
  {
    text: "I layer two of their florals for evenings out — the dry-down is silk on skin. My signature now.",
    author: "Elena Vasquez",
    location: "Barcelona, Spain",
    fragrance: "Rose de Minuit",
    rating: 5,
  },
  {
    text: "The atelier sample set convinced me in one afternoon. Precision, restraint, and real sillage.",
    author: "James Okonkwo",
    location: "Lagos, Nigeria",
    fragrance: "Encens Vérité",
    rating: 5,
  },
  {
    text: "Quiet luxury in a bottle. People ask what I'm wearing — I smile and say it's from Aurore.",
    author: "Mei Lin",
    location: "Singapore",
    fragrance: "Brume d'Iris",
    rating: 5,
  },
];
