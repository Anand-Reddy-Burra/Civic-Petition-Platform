"use client";

import { FileText, ClipboardList, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "@/components/Header";

export default function Home() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    setIsAuth(localStorage.getItem("isAuthenticated") === "true");

    const onAuthChange = () => {
      setIsAuth(localStorage.getItem("isAuthenticated") === "true");
    };

    window.addEventListener("authChanged", onAuthChange);
    return () => window.removeEventListener("authChanged", onAuthChange);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <main className="flex-grow flex flex-col justify-center items-center px-4 sm:px-6 md:px-10 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-6xl gap-10">
          {/* Left Side - Text */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-montserrat font-bold text-[36px] md:text-[50px] lg:text-[60px] uppercase text-[#232323] leading-tight mb-6">
              Empower <span className="text-civix-gold">Your Voice</span> <br />
              in Democracy
            </h1>
            <p className="font-poppins text-base md:text-lg text-[#696984] max-w-[550px] mx-auto md:mx-0 leading-relaxed mb-6">
              Connect with your community, create petitions, participate in polls, and make your
              voice heard. Civix brings digital civic engagement to your fingertips.
            </p>

            {!isAuth ? (
              <Link
                to="/signin"
                className="inline-flex items-center justify-center bg-civix-gold text-white font-poppins font-semibold px-8 py-3 rounded-xl shadow-md hover:shadow-lg hover:bg-[#5a2319] transition-all duration-300"
              >
                Start Engaging
              </Link>
            ) : (
              <div className="flex gap-4 justify-center md:justify-start">
                <Link
                  to="/petitions/community"
                  className="inline-flex items-center justify-center bg-[#4E342E] text-white font-poppins font-semibold px-6 py-2.5 rounded-xl shadow-md hover:bg-[#3E2723] transition-colors"
                >
                  Create Petitions
                </Link>

                <Link
                  to="/polls/community"
                  className="inline-flex items-center justify-center bg-[#6B2E1E] text-white font-poppins font-semibold px-6 py-2.5 rounded-xl shadow-md hover:bg-[#4E342E] transition-colors"
                >
                  Create Polls
                </Link>
              </div>
            )}
          </div>

          {/* Right Side - Image */}
          <div className="flex-shrink-0 w-full md:w-auto md:max-w-[420px] lg:max-w-[500px]">
            <img
              src="/images/image-1761328190793.png"
              alt="Civic engagement illustration"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="flex flex-col items-center justify-center px-4 sm:px-6 md:px-10 py-12 bg-white">
        {/* Title */}
        <h2 className="font-poppins font-bold text-2xl md:text-3xl lg:text-4xl text-[#232323] mb-3 text-center">
          Everything You Need to Make a Difference
        </h2>
        <p className="font-poppins text-sm md:text-base lg:text-lg text-[#696984] text-center max-w-3xl mb-10">
          Comprehensive tools for civic engagement and community participation
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-6xl">
          {/* Feature 1 - Create Petitions */}
          <div className="flex flex-col items-center text-center bg-[#fafafa] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#232323] text-white mb-3">
              <FileText size={28} />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-civix-gold mb-2">
              Create Petitions
            </h3>
            <p className="font-poppins text-sm text-[#696984] leading-snug">
              Turn your ideas into action by starting petitions on issues that matter. Gather
              digital signatures, share updates, and unite people to create meaningful change in
              your community.
            </p>
          </div>

          {/* Feature 2 - Participate in Polls */}
          <div className="flex flex-col items-center text-center bg-[#fafafa] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#232323] text-white mb-3">
              <ClipboardList size={28} />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-civix-gold mb-2">
              Participate in Polls
            </h3>
            <p className="font-poppins text-sm text-[#696984] leading-snug">
              Express your opinion on local and national issues through secure and verified polls.
              See real-time results and help shape the decisions that impact your community.
            </p>
          </div>

          {/* Feature 3 - Submit Reports */}
          <div className="flex flex-col items-center text-center bg-[#fafafa] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#232323] text-white mb-3">
              <BarChart3 size={28} />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-civix-gold mb-2">
              Submit Reports
            </h3>
            <p className="font-poppins text-sm text-[#696984] leading-snug">
              Track community engagement, analyze trends, and measure civic impact. Civix reports
              provide insights into public priorities and help build stronger, transparent
              communities.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
