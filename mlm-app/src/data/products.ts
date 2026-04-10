import oud from "../assets/oud.png"
import kunafa from "../assets/kunafa.png"
import kashmiri from "../assets/kashmiri.png"
import Gynaikes from "../assets/Gynaikes.png"
import TamDao from "../assets/TamDao.png"
import HadiSignature from "../assets/Signature.png"
import SandalKerala from "../assets/Sandal.png"
import HadiClassic from "../assets/Classic.png"

// src/data/products.ts

export const products = [
  { id: 1, name: "Oud Baklawa", type: "Perfume Oil", family: "Oriental", notes: "Oud · Baklava · Amber · Warm Spice", price: 420, ml: "12ml", badge: "Bestseller", intensity: 90, image: oud },
  { id: 2, name: "Kunafa Chocolate", type: "Perfume Oil", family: "Gourmand", notes: "Dark Chocolate · Pastry · Vanilla · Sweet Musk", price: 350, ml: "12ml", badge: "New", intensity: 75, image: kunafa },
  { id: 3, name: "Kashmiri Qahwa", type: "Perfume Oil", family: "Oriental", notes: "Cardamom · Saffron · Green Tea · Rose", price: 280, ml: "6ml", badge: null, intensity: 55, image: kashmiri },
  { id: 4, name: "Gynaikes 360", type: "Eau de Parfum", family: "Fresh", notes: "Citrus · White Musk · Light Woods", price: 310, ml: "15ml", badge: "Limited", intensity: 65, image: Gynaikes },
  { id: 5, name: "Tam Dao", type: "Eau de Parfum", family: "Woody", notes: "Sandalwood · Cypress · White Musk", price: 495, ml: "75ml", badge: null, intensity: 70, image: TamDao },
  { id: 6, name: "Hadi Signature", type: "Perfume Oil", family: "Oriental", notes: "Amber · Oud · Warm Resins", price: 320, ml: "12ml", badge: "Exclusive", intensity: 80, image: HadiSignature },
  { id: 7, name: "Sandal Kerala", type: "Eau de Parfum", family: "Woody", notes: "Kerala Sandalwood · Vetiver · Earthy Musk", price: 390, ml: "50ml", badge: null, intensity: 78, image: SandalKerala },
  { id: 8, name: "Hådi Classic", type: "Eau de Parfum", family: "Oriental", notes: "Amber · Patchouli · Golden Musk", price: 440, ml: "50ml", badge: "New", intensity: 72, image: HadiClassic },
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