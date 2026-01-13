import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { EyeOff, Eye, ArrowLeft, Mail } from "lucide-react";
import { authAPI, showAlert, validateEmail } from "../lib/auth.js";

type Step = "email" | "code" | "password";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const sendResetCode = async () => {
    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      showAlert("⚠️ Please enter your email address", "warning", 3000);
      return;
    }
    if (!validateEmail(email)) {
      setErrors({ email: "Please enter a valid email address" });
      showAlert("⚠️ Please enter a valid email address", "warning", 3000);
      return;
    }

    setIsLoading(true);
    setErrors({});
    try {
      const response = await authAPI.forgotPassword({ email: email.trim() });
      if (response.success) {
        showAlert("✅ Verification code sent! Check your email.", "success", 4000);
        setStep("code");
      }
    } catch (error: any) {
      showAlert(error.message || "❌ Failed to send reset link.", "error", 6000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendResetCode();
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) {
      setErrors({ code: "Please enter a valid 6-digit code" });
      showAlert("⚠️ Please enter the 6-digit verification code", "warning", 3000);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.verifyResetCode({
        email: email.trim(),
        code: code.trim(),
      });
      if (response.success) {
        showAlert("✅ Code verified! Now set your new password.", "success", 4000);
        setStep("password");
      }
    } catch (error: any) {
      showAlert(error.message || "❌ Invalid or expired code.", "error", 6000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (!confirmPassword.trim())
      newErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.resetPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword: password,
      });

      if (response.success) {
        showAlert("🎉 Password reset successful!", "success", 4000);
        setTimeout(() => navigate("/signin"), 2000);
      }
    } catch (error: any) {
      showAlert(error.message || "❌ Failed to reset password.", "error", 6000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "email") setEmail(value);
    if (field === "code") setCode(value.replace(/\D/g, "").slice(0, 6));
    if (field === "password") setPassword(value);
    if (field === "confirmPassword") setConfirmPassword(value);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left Section - Hero (same as SignIn) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#E2B59A] px-6 py-12 lg:py-16">
        <div className="max-w-xl w-full text-center lg:text-left">
          <h1 className="font-inter font-bold text-4xl sm:text-5xl text-black mb-6 lg:mb-8">
            Welcome to Civix
          </h1>
          <p className="font-inter text-xl sm:text-2xl lg:text-3xl text-black leading-relaxed">
            Your voice matters. Sign in to participate in local governance and
            make a difference in your community.
          </p>
        </div>
      </div>

      {/* Right Section - Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-8 md:px-10 lg:px-16 py-10 sm:py-12 lg:py-16 bg-white">
        <div className="w-full max-w-lg">
          <h2 className="font-inter font-bold text-3xl text-[#232323] mb-2">
            Forgot Password?
          </h2>
          {step === "email" && (
            <p className="text-gray-600 mb-6">
              Enter your registered email. We'll send a reset link.
            </p>
          )}
          {step === "code" && (
            <p className="text-gray-600 mb-6">
              Enter the 6-digit code sent to your email.
            </p>
          )}
          {step === "password" && (
            <p className="text-gray-600 mb-6">Enter your new password below.</p>
          )}

          {/* Step 1 - Email */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Email Address"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg font-inter text-base ${
                    errors.email
                      ? "border-red-500"
                      : "border-[#D9D9D9] focus:border-[#E2B59A]"
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-semibold text-base text-black ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#E2B59A] hover:opacity-90"
                }`}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          {/* Step 2 - Verification Code */}
          {step === "code" && (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => handleInputChange("code", e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className={`w-full px-4 py-3 border rounded-lg font-inter text-center tracking-[6px] ${
                  errors.code
                    ? "border-red-500"
                    : "border-[#D9D9D9] focus:border-[#E2B59A]"
                }`}
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-semibold text-base text-black ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#E2B59A] hover:opacity-90"
                }`}
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </button>
            </form>
          )}

          {/* Step 3 - Reset Password */}
          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="New Password"
                  className="w-full px-4 py-3 border rounded-lg font-inter text-base pr-10 border-[#D9D9D9] focus:border-[#E2B59A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  placeholder="Confirm New Password"
                  className="w-full px-4 py-3 border rounded-lg font-inter text-base pr-10 border-[#D9D9D9] focus:border-[#E2B59A]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-semibold text-base text-black ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#E2B59A] hover:opacity-90"
                }`}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          {/* Back to login link */}
          <div className="mt-6 text-center">
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 font-inter text-base text-[#432323] underline hover:opacity-80"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}