import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  EyeOff,
  Eye,
  User,
  Mail,
  Lock,
  Calendar,
  MapPin,
  Globe2,
  UserCircle,
  ShieldCheck,
} from "lucide-react";
import {
  authAPI,
  showAlert,
  validateEmail,
  validatePassword,
  formatDateForAPI,
} from "../lib/auth.js";
import LoadingSpinner from "../components/ui/loading-spinner";

type SignUpForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  location: string;
  role: string;
};

type FormErrors = Partial<Record<keyof SignUpForm, string>>;

export default function SignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState("form");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const [formData, setFormData] = useState<SignUpForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    location: "",
    role: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const roleRef = React.useRef<HTMLDivElement | null>(null);
  const dateInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const key = name as keyof SignUpForm;
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    } as SignUpForm));

    if (errors[key]) {
      setErrors((prev) => ({
        ...prev,
        [key]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    let hasEmpty = false;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      hasEmpty = true;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      hasEmpty = true;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
      showAlert("⚠️ Please enter a valid email address", "warning", 3000);
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
      hasEmpty = true;
    } else {
      const validation = validatePassword(formData.password);
      if (!validation.isValid) {
        newErrors.password =
          "Password must have 8+ chars, uppercase, lowercase, number & symbol";
        showAlert("⚠️ Weak password. Please try again.", "warning", 4000);
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword?.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
      hasEmpty = true;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      showAlert("⚠️ Passwords do not match.", "warning", 3000);
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
      hasEmpty = true;
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
      hasEmpty = true;
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
      hasEmpty = true;
    }

    if (hasEmpty)
      showAlert("⚠️ Please fill out all required fields.", "warning", 3000);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const response = await authAPI.signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        dateOfBirth: formatDateForAPI(formData.dateOfBirth),
        location: formData.location.trim(),
        role: formData.role,
      });

      if (response.success) {
        setVerificationEmail(formData.email);
        setStep("verify");
        setCode("");
        setResendSeconds(60);
        showAlert(
          "📩 We sent a 6-digit verification code to your email.",
          "info",
          4000
        );
      }
    } catch (err) {
      console.error(err);
      showAlert("❌ Sign up failed. Please try again.", "error", 4000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  // Close role dropdown when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isRoleOpen) return;
      const target = e.target as Node;
      if (roleRef.current && !roleRef.current.contains(target)) {
        setIsRoleOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [isRoleOpen]);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      showAlert("⚠️ Please enter a valid 6-digit code", "warning", 3000);
      return;
    }

    setIsVerifying(true);
    try {
      const res = await authAPI.verifyEmailCode({
        email: verificationEmail,
        code: code.trim(),
      });
      if (res.success) {
        const login = await authAPI.signin({
          email: verificationEmail,
          password: formData.password,
        });
        if (login.success) {
          localStorage.setItem("user", JSON.stringify(login.data.user));
          localStorage.setItem("isAuthenticated", "true");
          if (login.data.token) localStorage.setItem("token", login.data.token);
          window.dispatchEvent(new Event("authChanged"));
          showAlert(
            "🎉 Email verified successfully! Welcome to Civix!",
            "success",
            4000
          );
          navigate("/");
        }
      }
    } catch (err) {
      console.error(err);
      showAlert("❌ Invalid or expired code. Try again.", "error", 4000);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendSeconds > 0) return;
    try {
      await authAPI.resendEmailCode({ email: verificationEmail });
      setResendSeconds(60);
      showAlert("📩 Code resent successfully.", "info", 3000);
    } catch (err) {
      showAlert("❌ Failed to resend code. Try again.", "error", 4000);
    }
  };

  // ✅ Verification Step
  if (step === "verify") {
    return (
      <div className="min-h-screen w-full flex bg-white overflow-y-auto">
        <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16">
          <div className="max-w-md w-full">
            <h2 className="font-bold text-3xl text-[#432323] mb-3">
              Verify Your Email
            </h2>
            <p className="text-gray-600 mb-6">
              We’ve sent a 6-digit code to <b>{verificationEmail}</b>
            </p>
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                className="w-full text-center text-2xl tracking-widest border rounded-lg p-3 border-[#E2B59A] focus:outline-none focus:border-[#432323] box-border"
                placeholder="Enter code"
              />
              <button
                type="submit"
                disabled={isVerifying || code.length !== 6}
                className={`w-full rounded-lg py-3 font-semibold text-base text-white transition ${isVerifying || code.length !== 6
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#E2B59A] hover:opacity-90"
                  }`}
              >
                {isVerifying ? "Verifying..." : "Verify Email"}
              </button>
            </form>

            <div className="text-center mt-4">
              <button
                onClick={handleResendCode}
                disabled={resendSeconds > 0}
                className={`text-[#432323] underline ${resendSeconds > 0 ? "opacity-60 cursor-not-allowed" : ""
                  }`}
              >
                Resend {resendSeconds > 0 && `(${resendSeconds}s)`}
              </button>
            </div>
          </div>
        </div>

        {/* LEFT HERO */}
        <div className="hidden lg:flex w-1/2 bg-[#E2B59A] items-center justify-center px-10">
          <div className="max-w-xl">
            <h1 className="font-bold text-4xl text-black mb-4">Welcome to Civix</h1>
            <p className="text-xl text-black leading-relaxed">
              Your voice matters. Verify your email to complete registration and
              make a difference in your community.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Main Signup Page
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white m-0 p-0 overflow-y-auto">
      {/* LEFT INFO PANEL (now edge-aligned) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#E2B59A] px-4 sm:px-6 py-8 lg:py-16">
        <div className="max-w-xl w-full text-center lg:text-left px-2 sm:px-0">
          <h1 className="font-bold text-4xl sm:text-5xl text-black mb-6 lg:mb-8">
            Join Civix
          </h1>
          <p className="text-xl sm:text-2xl lg:text-3xl text-black leading-relaxed mb-7">
            Become part of a platform where citizens connect, collaborate, and
            create impact through civic participation.
          </p>
          <ul className="space-y-6 text-left">
            <li className="flex gap-4 items-start">
              <UserCircle size={28} className="text-[#432323] shrink-0" />
              <div>
                <span className="font-bold text-[#432323]">
                  Personalized Profiles:
                </span>
                <div className="text-[#432323] text-sm">
                  Create your civic identity and engage meaningfully with your
                  community.
                </div>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <ShieldCheck size={28} className="text-[#432323] shrink-0" />
              <div>
                <span className="font-bold text-[#432323]">
                  Verified Participation:
                </span>
                <div className="text-[#432323] text-sm">
                  Build trust and accountability by verifying your email and
                  participating transparently.
                </div>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <Globe2 size={28} className="text-[#432323] shrink-0" />
              <div>
                <span className="font-bold text-[#432323]">Connect Globally:</span>
                <div className="text-[#432323] text-sm">
                  Collaborate with citizens, officials, and organizations around
                  the world.
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="w-full lg:w-1/2 flex flex-col items-start justify-start px-4 sm:px-8 md:px-10 lg:px-24 pt-6 bg-white">
        <div className="w-full max-w-lg mx-auto px-2 sm:px-0">
          <div className="mb-3 flex flex-col items-center sm:items-center">
            <Globe2 size={48} className="mb-1 text-[#432323]" />
            <div className="font-extrabold text-xl text-[#432323] tracking-tight mb-1 uppercase">
              CIVIX
            </div>
          </div>

          <div className="mb-3 text-center">
            <h2 className="font-bold text-2xl text-[#432323] mb-1">Sign up</h2>
            <p className="text-sm text-gray-600">
              Create your account and join the community.
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div className="relative">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Full Name"
                className={`peer w-full box-border px-4 py-2.5 border-[1.5px] rounded-lg text-base text-black bg-white placeholder:text-[#9A9A9A] focus:outline-none transition-colors ${errors.name
                    ? "border-red-500"
                    : "border-[#DDC6B1] focus:border-[#432323]"
                  }`}
              />
              <User
                size={20}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#432323]"
              />
            </div>

            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email"
                className={`peer w-full box-border px-4 py-2.5 border-[1.5px] rounded-lg text-base text-black bg-white placeholder:text-[#9A9A9A] focus:outline-none transition-colors ${errors.email
                    ? "border-red-500"
                    : "border-[#DDC6B1] focus:border-[#432323]"
                  }`}
              />
              <Mail
                size={20}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#432323]"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                className={`peer w-full box-border px-4 py-2.5 border-[1.5px] rounded-lg text-base text-black bg-white placeholder:text-[#9A9A9A] focus:outline-none transition-colors pr-12 ${errors.password
                    ? "border-red-500"
                    : "border-[#DDC6B1] focus:border-[#432323]"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff size={20} className="text-[#432323]" />
                ) : (
                  <Eye size={20} className="text-[#432323]" />
                )}
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={(formData as any).confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm Password"
                className={`peer w-full box-border px-4 py-2.5 border-[1.5px] rounded-lg text-base text-black bg-white placeholder:text-[#9A9A9A] focus:outline-none transition-colors pr-12 ${(errors as any).confirmPassword
                    ? "border-red-500"
                    : "border-[#DDC6B1] focus:border-[#432323]"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff size={20} className="text-[#432323]" />
                ) : (
                  <Eye size={20} className="text-[#432323]" />
                )}
              </button>
            </div>

            <div className="relative">
              <input
                ref={dateInputRef}
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className={`peer no-native-datepicker w-full box-border px-4 py-2.5 border-[1.5px] rounded-lg text-base text-black bg-white focus:outline-none transition-colors ${errors.dateOfBirth
                    ? "border-red-500"
                    : "border-[#DDC6B1] focus:border-[#432323]"
                  }`}
              />
              <button
                type="button"
                onClick={() => {
                  const el = dateInputRef.current as any;
                  if (!el) return;
                  // Preferred modern API
                  if (typeof el.showPicker === "function") {
                    try {
                      el.showPicker();
                      return;
                    } catch (e) {
                      // ignore and fallback
                    }
                  }
                  // Fallback: focus and open native picker by dispatching a click
                  el.focus();
                  try {
                    el.click();
                  } catch (e) {
                    /* no-op */
                  }
                }}
                aria-label="Choose date"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
              >
                <Calendar size={20} className="text-[#432323]" />
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Location"
                className={`peer w-full box-border px-4 py-2.5 border-[1.5px] rounded-lg text-base text-black bg-white placeholder:text-[#9A9A9A] focus:outline-none transition-colors ${errors.location
                    ? "border-red-500"
                    : "border-[#DDC6B1] focus:border-[#432323]"
                  }`}
              />
              <MapPin
                size={20}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#432323]"
              />
            </div>

            <div className="relative" ref={roleRef}>
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isRoleOpen}
                onClick={() => setIsRoleOpen((s) => !s)}
                className={`w-full text-left px-4 py-2.5 min-h-[44px] border-[1.5px] rounded-lg text-base ${formData.role ? "text-black" : "text-gray-400"
                  } bg-white focus:outline-none ${errors.role ? 'border-red-500' : 'border-[#DDC6B1] focus:border-[#432323]'} flex items-center justify-between`}
              >
                <span className={`truncate ${formData.role ? '' : 'text-gray-400'}`}>
                  {formData.role ? formData.role.charAt(0).toUpperCase() + formData.role.slice(1) : 'Select role'}
                </span>
                <svg className={`w-4 h-4 ml-2 transition-transform text-[#432323] ${isRoleOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M6 8l4 4 4-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {isRoleOpen && (
                <div className="absolute left-0 mt-1 w-full bg-white border border-[#DDC6B1] rounded-md shadow-sm z-40 max-h-52 overflow-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((p) => ({ ...p, role: 'public' }));
                      setIsRoleOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50"
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((p) => ({ ...p, role: 'official' }));
                      setIsRoleOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50"
                  >
                    Official
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full rounded-lg px-4 py-3 font-semibold text-sm sm:text-base text-white transition-opacity ${isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#E2B59A] hover:opacity-90"
                } min-h-[44px]`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span>Creating account...</span>
                </div>
              ) : (
                "Sign up"
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            <span className="text-[#6C6C6C]">Already have an account? </span>
            <Link
              to="/signin"
              className="font-semibold text-[#432323] underline hover:opacity-80"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}