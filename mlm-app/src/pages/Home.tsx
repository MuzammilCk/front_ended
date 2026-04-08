import "../styles/Home.css";
import Navbar from "../components/home-components/Navbar";
import HeroSection from "../components/home-components/HeroSection";
import FeaturedCollection from "../components/home-components/FeaturedCollection";
import BrandStatement from "../components/home-components/BrandStatement";
import Testimonials from "../components/home-components/Testimonials";
import NotesExplorer from "../components/home-components/NotesExplorer";
import Footer from "../components/home-components/Footer";

function Home() {
  return (
    <div className="min-h-screen bg-[#0d0905] text-[#e8dcc8] font-serif">
      <div className="grain">
        {/* ── NAV ── */}
        <Navbar />

        {/* ── HERO ── */}
        <HeroSection />

        {/* ── FEATURED COLLECTION ── */}
        <FeaturedCollection />

        {/* ── BRAND STATEMENT ── */}
        <BrandStatement />

        {/* ── TESTIMONIALS ── */}
        <Testimonials />

        {/* ── NOTES EXPLORER ── */}
        <NotesExplorer />

        {/* ── FOOTER ── */}
        <Footer />
      </div>
    </div>
  );
}

export default Home;
