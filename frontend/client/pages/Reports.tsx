import { CheckCircle2, Clock, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import reportsImg from "../../images/reports.png";

export default function Reports() {
  const navigate = useNavigate();

  const handleSubmitReport = () => {
    navigate("/reports/dashboard"); // Change this route as per your app
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
              src={reportsImg}
              alt="Reports illustration"
              className="w-full h-[250px] md:h-[300px] object-contain rounded-2xl shadow-md"
            />
          </div>

          {/* Right - Text */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-poppins font-semibold text-2xl md:text-3xl lg:text-4xl text-[#232323] mb-4 leading-tight">
              View and Track Reports Generated from Polls & Petitions
            </h1>
            <p className="font-poppins text-sm md:text-base lg:text-lg text-[#696984] leading-relaxed max-w-xl mx-auto md:mx-0 mb-6">
              Stay informed about community decisions by viewing reports automatically generated from polls and petitions. Analyze results, track status, and participate in highlighting priority issues.
            </p>

            {/* Button */}
            <button
              onClick={handleSubmitReport}
              className="bg-[#6B2E1E] text-white font-poppins font-semibold text-base md:text-lg px-8 py-3 rounded-xl shadow-md hover:bg-[#4E342E] transition-all duration-300"
            >
              View Report
            </button>
          </div>
        </div>

        {/* Reports Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          {/* Feature 1 - Aggregated Reports */}
          <div className="flex flex-col items-center text-center bg-[#fafafa] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#6B2E1E] text-white mb-3">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-[#232323] mb-2">
              Aggregated Reports
            </h3>
            <p className="font-poppins text-sm text-[#696984] leading-snug">
              View reports automatically generated from polls and petitions.
            </p>
          </div>

          {/* Feature 2 - Status Updates */}
          <div className="flex flex-col items-center text-center bg-[#fafafa] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#6B2E1E] text-white mb-3">
              <Clock size={28} />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-[#232323] mb-2">
              Status Updates
            </h3>
            <p className="font-poppins text-sm text-[#696984] leading-snug">
              Receive real-time notifications about actions or decisions taken based on the reports.
            </p>
          </div>

          {/* Feature 3 - Community Insights */}
          <div className="flex flex-col items-center text-center bg-[#fafafa] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#6B2E1E] text-white mb-3">
              <BarChart2 size={28} />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-[#232323] mb-2">
              Community Insights
            </h3>
            <p className="font-poppins text-sm text-[#696984] leading-snug">
              Analyze trends and participate by upvoting or commenting to highlight priority issues.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
