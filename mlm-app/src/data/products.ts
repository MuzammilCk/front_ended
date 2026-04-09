import oud from "../assets/oud.png"
import kunanfa from "../assets/kunafa.png"
import kashimiri from "../assets/kashmiri.png"

// src/data/products.ts

export const products = [
  { id: 1, name: "Oud", type: "Eau de Parfum", family: "Woody", notes: "Dark woods · Amber · Smoke", price: 420, ml: "50ml", badge: "Bestseller", intensity: 90 , image:oud },
  { id: 2, name: "Rose Sauvage", type: "Extrait de Parfum", family: "Floral", notes: "Damask Rose · Musk · Velvet", price: 580, ml: "50ml", badge: "New", intensity: 75, image:kunanfa },
  { id: 3, name: "Sel de Mer", type: "Eau de Cologne", family: "Fresh", notes: "Sea Salt · Bergamot · Driftwood", price: 310, ml: "100ml", badge: null, intensity: 55 , image:kashimiri},
  { id: 4, name: "Ambre Brûlé", type: "Eau de Parfum", family: "Oriental", notes: "Burnt Amber · Vanilla · Saffron", price: 495, ml: "50ml", badge: "Limited", intensity: 85 },
  { id: 5, name: "Vétiver Glacé", type: "Eau de Toilette", family: "Woody", notes: "Vetiver · Ice · Cedar", price: 275, ml: "100ml", badge: null, intensity: 60 },
  { id: 6, name: "Iris Obscur", type: "Extrait de Parfum", family: "Floral", notes: "Orris · Violet · White Musk", price: 640, ml: "30ml", badge: "Exclusive", intensity: 80 },
  { id: 7, name: "Poivre Noir", type: "Eau de Parfum", family: "Oriental", notes: "Black Pepper · Leather · Patchouli", price: 390, ml: "50ml", badge: null, intensity: 88 },
  { id: 8, name: "Côte d'Azur", type: "Eau de Cologne", family: "Fresh", notes: "Citrus · Marine · White Tea", price: 240, ml: "100ml", badge: "New", intensity: 45 },
];

export const families = ["All", "Woody", "Floral", "Fresh", "Oriental"];

export const sorts = ["Featured", "Price: Low–High", "Price: High–Low", "Intensity"];

export const gradients: Record<string, string> = {
  Woody: "linear-gradient(135deg, #1a0f0a 0%, #2d1810 100%)",
  Floral: "linear-gradient(135deg, #1a0e0e 0%, #2d1515 100%)",
  Fresh: "linear-gradient(135deg, #0d141a 0%, #102030 100%)",
  Oriental: "linear-gradient(135deg, #140e05 0%, #271a08 100%)",
};

export const glowColors: Record<string, string> = {
  Woody: "#c9a96e",
  Floral: "#c97a7a",
  Fresh: "#7ab3c9",
  Oriental: "#c9a040",
};