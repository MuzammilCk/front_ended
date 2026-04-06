import "../styles/home.css";
import Navbar from "../components/home-components/Navbar";
import HeroSection from "../components/Home-components/HeroSection";
import FeaturedCollection from "../components/Home-components/FeaturedCollection";
import BrandStatement from "../components/Home-components/BrandStatement";
import Testimonials from "../components/Home-components/Testimonials";
import NotesExplorer from "../components/Home-components/NotesExplorer";
import Footer from "../components/Home-components/Footer";

function Home() {
  return (
    <div className="min-h-screen bg-[#0d0905] text-[#e8dcc8] font-serif overflow-x-hidden">
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
