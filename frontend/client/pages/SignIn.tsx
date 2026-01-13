import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Pencil,
  BarChart2,
  Megaphone,
  UserCircle,
  Mail,
  Lock,
  Globe2,
} from "lucide-react";
import { authAPI, showAlert, validateEmail } from "../lib/auth.js";
import LoadingSpinner from "../components/ui/loading-spinner";

export default function SignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  type SignInForm = {
    email: string;
    password: string;
  };

  type FormErrors = Partial<Record<keyof SignInForm, string>>;

  const [formData, setFormData] = useState<SignInForm>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const key = name as keyof SignInForm;
    setFormData((prev) => ({ ...prev, [key]: value } as SignInForm));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      showAlert("⚠️ Please enter your email address", "warning", 3000);
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      showAlert("⚠️ Please enter a valid email address", "warning", 3000);
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
      showAlert("⚠️ Please enter your password", "warning", 3000);
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const response = await authAPI.signin({
        email: formData.email.trim(),
        password: formData.password,
      });
      if (response.success) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("isAuthenticated", "true");
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }
        window.dispatchEvent(new Event("authChanged"));
        showAlert(
          "🎉 Welcome back! You've successfully signed in to Civix.",
          "success",
          4000
        );
        navigate("/");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      showAlert(
        "❌ Sign in failed. Please check your email and password.",
        "error",
        6000
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* LEFT*/}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#E2B59A] px-6 py-12 lg:py-16">
        <div className="max-w-xl w-full text-center lg:text-left">
          <h1 className="font-bold text-4xl sm:text-5xl text-black mb-6 lg:mb-8">
            Welcome to Civix
          </h1>
          <p className="text-xl sm:text-2xl lg:text-3xl text-black leading-relaxed mb-7">
            Your voice matters. Sign in to participate in local governance and make a difference in your community.
          </p>
          <ul className="space-y-6 text-left">
            <li className="flex gap-4 items-start">
              <Pencil size={28} className="text-[#432323] shrink-0" />
              <div>
                <span className="font-bold text-[#432323]">Create Petitions:</span>
                <div className="text-[#432323] text-sm">
                  Start campaigns on issues that matter to you and gather support from your community.
                </div>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <BarChart2 size={28} className="text-[#432323] shrink-0" />
              <div>
                <span className="font-bold text-[#432323]">Vote in Polls:</span>
                <div className="text-[#432323] text-sm">
                  Share your opinion on public matters and influence decisions that shape your neighborhood.
                </div>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <Megaphone size={28} className="text-[#432323] shrink-0" />
              <div>
                <span className="font-bold text-[#432323]">Reports</span>
                <div className="text-[#432323] text-sm">
                  Track community engagement, analyze trends, and measure civic impact. 
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* RIGHT: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-8 md:px-10 lg:px-16 py-10 sm:py-12 lg:py-16 bg-white">
        <div className="w-full max-w-lg">
          <div className="mb-5 flex flex-col items-center">
            <Globe2 size={48} className="mb-1 text-[#432323]" />
            <div className="font-extrabold text-xl text-[#432323] tracking-tight mb-1 uppercase">
              CIVIX
            </div>
          </div>
          <div className="mb-4 text-center">
            <h2 className="font-bold text-2xl text-[#432323] mb-2">Sign in</h2>
            <p className="text-sm text-gray-600">Please login to continue to your account.</p>
          </div>
          <form onSubmit={handleSignIn} className="space-y-3.5">
            {/* Email Field */}
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email"
                autoComplete="off"
                className={`peer w-full px-4 py-2.5 border-[1.5px] rounded-lg text-base text-black bg-white placeholder:text-[#9A9A9A] focus:outline-none transition-colors ${
                  errors.email
                    ? "border-red-500"
                    : "border-[#DDC6B1] focus:border-[#432323]"
                }`}
              />
              <Mail size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#432323]" />
            </div>
            {/* Password Field */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                autoComplete="off"
                className={`peer w-full px-4 py-2.5 border-[1.5px] rounded-lg text-base text-black bg-white placeholder:text-[#9A9A9A] focus:outline-none transition-colors pr-12 ${
                  errors.password
                    ? "border-red-500"
                    : "border-[#DDC6B1] focus:border-[#432323]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff size={20} className="text-[#432323]" />
                ) : (
                  <Eye size={20} className="text-[#432323]" />
                )}
              </button>
              
            </div>
            {/* Remember Me & Forgot Password */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setKeepLoggedIn(!keepLoggedIn)}
              >
                <div className="w-5 h-5 border-2 border-[#432323] rounded flex items-center justify-center">
                  {keepLoggedIn && (
                    <div className="w-3 h-3 bg-[#432323] rounded"></div>
                  )}
                </div>
                <span className="text-[#432323] text-sm font-medium">
                  Keep me logged in
                </span>
              </div>
              <Link
                to="/forgot-password"
                className="text-[#432323] text-sm underline hover:opacity-80"
              >
                Forgot Password?
              </Link>
            </div>
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full rounded-lg px-4 py-2.5 font-semibold text-base text-white transition-opacity ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#E2B59A] hover:opacity-90"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
          <p className="mt-4 text-center text-sm">
            <span className="text-[#6C6C6C]">Need an account? </span>
            <Link
              to="/signup"
              className="font-semibold text-[#432323] underline hover:opacity-80"
            >
              Create one
            </Link>
          </p>
          <div className="mt-4 text-center text-xs text-gray-500">
            Join thousands of engaged citizens using CIVIX to make democracy digital, accessible, and effective.
          </div>
        </div>
      </div>
    </div>
  );
}
