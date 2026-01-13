import { CheckCircle, Clock, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

export default function Petitions() {
  const navigate = useNavigate();

  const handleStartPetition = () => {
    navigate("/petitions/community");
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <Header />

      {/* Hero Section */}
      <main className="flex-grow flex flex-col justify-center items-center px-4 sm:px-6 md:px-10 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-6xl gap-10 mb-12">
          {/* Left - Image */}
          <div className="flex-shrink-0 w-full md:w-1/2 flex justify-center">
            <img
              src="/images/petitions.png" // 🖼️ Make sure image is in public/images/
              alt="Petition illustration"
              className="w-full h-[250px] md:h-[300px] object-contain rounded-2xl shadow-md"
            />
          </div>

          {/* Right - Text */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-poppins font-semibold text-2xl md:text-3xl lg:text-4xl text-[#232323] mb-4 leading-tight">
              Create and Support Petitions That Drive Real Change
            </h1>
            <p className="font-poppins text-sm md:text-base lg:text-lg text-[#696984] leading-relaxed max-w-xl mx-auto md:mx-0 mb-6">
              Start meaningful initiatives, gather digital signatures, and inspire your community
              to take action on issues that matter. Every signature is a step toward progress.
            </p>

            {/* Button - moved here */}
            <button
              onClick={handleStartPetition}
              className="bg-[#6B2E1E] text-white font-poppins font-semibold text-base md:text-lg px-8 py-3 rounded-xl shadow-md hover:bg-[#4E342E] transition-all duration-300"
            >
              Start a Petition
            </button>
          </div>
        </div>

        {/* Petitions Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          {/* Step 1 - Digital Signatures */}
          <div className="flex flex-col items-center text-center bg-[#fafafa] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#6B2E1E] text-white mb-3">
              <CheckCircle size={28} />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-[#232323] mb-2">
              Digital Signatures
            </h3>
            <p className="font-poppins text-sm text-[#696984] leading-snug">
              Securely collect verified digital signatures and amplify your cause with trusted
              community backing.
            </p>
          </div>

          {/* Step 2 - Real-time Tracking */}
          <div className="flex flex-col items-center text-center bg-[#fafafa] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#6B2E1E] text-white mb-3">
              <Clock size={28} />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-[#232323] mb-2">
              Real-time Tracking
            </h3>
            <p className="font-poppins text-sm text-[#696984] leading-snug">
              Monitor progress live as supporters sign and share your petition, seeing momentum grow
              in real time.
            </p>
          </div>

          {/* Step 3 - Share & Promote */}
          <div className="flex flex-col items-center text-center bg-[#fafafa] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#6B2E1E] text-white mb-3">
              <Share2 size={28} />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-[#232323] mb-2">
              Share & Promote
            </h3>
            <p className="font-poppins text-sm text-[#696984] leading-snug">
              Spread your petition effortlessly on social platforms to reach more voices and
              strengthen your movement.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
