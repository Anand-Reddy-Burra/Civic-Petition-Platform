import { UserPlus, MessageSquare, Globe2, Globe2Icon } from "lucide-react";
import Header from "@/components/Header";

export default function HowItWorks() {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <Header />

      {/* Main Section */}
      <main className="flex-grow flex flex-col justify-center items-center px-4 sm:px-6 md:px-10 py-10">
        {/* Title */}
        <h1 className="font-poppins font-semibold text-xl md:text-2xl lg:text-3xl text-[#232323] mb-6 text-center leading-tight">
          Get started with Civix in three simple steps and make an impact that matters
        </h1>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center bg-[#fafafa] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#6B2E1E] text-white font-bold text-xl mb-3">
              <UserPlus size={28} />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-[#232323] mb-2">
              Create Your Account
            </h3>
            <p className="font-poppins text-sm text-[#696984] leading-snug">
              Join Civix as a citizen or verified official in less than a minute. 
              Customize your profile and start your civic journey — it’s fast, secure, and free.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center bg-[#fafafa] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#6B2E1E] text-white font-bold text-xl mb-3">
              <MessageSquare size={28} />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-[#232323] mb-2">
              Engage & Participate
            </h3>
            <p className="font-poppins text-sm text-[#696984] leading-snug">
              Create petitions, participate in polls, share reports, and discuss issues that 
              affect your community. Your engagement helps raise awareness and drive change.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center bg-[#fafafa] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#6B2E1E] text-white font-bold text-xl mb-3">
              <Globe2 size={28} />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-[#232323] mb-2">
              Make Real Impact
            </h3>
            <p className="font-poppins text-sm text-[#696984] leading-snug">
              Watch your participation turn into action. As petitions gain support and reports 
              get verified, your voice helps shape community policies and inspire real change.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
