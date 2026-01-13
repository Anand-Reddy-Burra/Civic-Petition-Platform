import { CheckCircle, Clock, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import pollsImg from "../../images/polls.png";

export default function Polls() {
  const navigate = useNavigate();

  const handleStartPoll = () => {
    navigate("/polls/community");
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
              src={pollsImg}
              alt="Polls illustration"
              className="w-full h-[250px] md:h-[300px] object-contain rounded-2xl shadow-md"
            />
          </div>

          {/* Right - Text */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-poppins font-semibold text-2xl md:text-3xl lg:text-4xl text-[#232323] mb-4 leading-tight">
              Participate in Community Polls and Make Your Voice Count
            </h1>
            <p className="font-poppins text-sm md:text-base lg:text-lg text-[#696984] leading-relaxed max-w-xl mx-auto md:mx-0 mb-6">
              Vote on important local and civic issues, share your opinions, and help shape
              community decisions through transparent and secure online polling.
            </p>

            {/* Button */}
            <button
              onClick={handleStartPoll}
              className="bg-[#6B2E1E] text-white font-poppins font-semibold text-base md:text-lg px-8 py-3 rounded-xl shadow-md hover:bg-[#4E342E] transition-all duration-300"
            >
              Start a Poll
            </button>
          </div>
        </div>

        {/* Polls Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          {/* Feature 1 - Secure Voting */}
          <div className="flex flex-col items-center text-center bg-[#fafafa] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#6B2E1E] text-white mb-3">
              <CheckCircle size={28} />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-[#232323] mb-2">
              Secure Voting
            </h3>
            <p className="font-poppins text-sm text-[#696984] leading-snug">
              Each user casts a verified vote ensuring fairness and transparency in every poll.
            </p>
          </div>

          {/* Feature 2 - Real-time Results */}
          <div className="flex flex-col items-center text-center bg-[#fafafa] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#6B2E1E] text-white mb-3">
              <Clock size={28} />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-[#232323] mb-2">
              Real-time Results
            </h3>
            <p className="font-poppins text-sm text-[#696984] leading-snug">
              View poll results instantly as votes come in from across your community.
            </p>
          </div>

          {/* Feature 3 - Poll Insights */}
          <div className="flex flex-col items-center text-center bg-[#fafafa] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#6B2E1E] text-white mb-3">
              <BarChart2 size={28} />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-[#232323] mb-2">
              Poll Insights
            </h3>
            <p className="font-poppins text-sm text-[#696984] leading-snug">
              Get valuable analytics and understand the collective opinions driving change.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
