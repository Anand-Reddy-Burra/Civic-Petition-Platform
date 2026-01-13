import { useLocation } from "react-router-dom";
import Header from "@/components/Header";

export default function Placeholder() {
  const location = useLocation();
  const pageName = location.pathname.slice(1).replace(/-/g, " ");

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-[1440px] mx-auto px-8 md:px-12 py-20 text-center">
        <h1 className="font-montserrat font-bold text-4xl md:text-5xl lg:text-6xl uppercase text-[#232323] mb-6">
          {pageName || "Page"} Coming Soon
        </h1>
        <p className="font-montserrat text-xl text-[#504A4A] max-w-2xl mx-auto">
          This page is under construction. Continue prompting to help us build out this content!
        </p>
      </main>
    </div>
  );
}
