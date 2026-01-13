import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { authAPI } from "../lib/auth.js";
import LoadingSpinner from "./ui/loading-spinner";
import { useLocation } from "react-router-dom";

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  location: string;
}

export default function Header() {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(false);

  const location = useLocation();
    const links = [
    { path: "/Home", label: "HOME" },
    { path: "/how-it-works", label: "HOW IT WORKS" },
    { path: "/petitions", label: "PETITIONS" },
    { path: "/polls", label: "POLLS" },
    { path: "/reports", label: "REPORTS" },
  ];

  // Fetch user data when authenticated
  const fetchUserData = async () => {
    if (!isAuth) return;
    
    // Only show loading if we don't have user data yet
    if (!userData) {
      setIsLoadingUser(true);
    }
    
    try {
      // Try to get user data from localStorage first (faster)
      const storedUser = localStorage.getItem("user");
      if (storedUser && !userData) {
        const user = JSON.parse(storedUser);
        setUserData(user);
        setIsLoadingUser(false);
        return;
      }

      // If no stored user, fetch from API with timeout
      const response = await Promise.race([
        authAPI.getCurrentUser(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 3000)
        )
      ]);
      
      if (response.success) {
        setUserData(response.data.user);
        // Store user data in localStorage for faster access
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // If API fails but we have stored data, keep showing it
      if (!userData) {
        // Show fallback data if no stored data available
        const fallbackUser = {
          _id: 'fallback',
          name: 'User',
          email: 'user@example.com',
          role: 'public',
          location: 'Unknown',
          isActive: true
        };
        setUserData(fallbackUser);
      }
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    setIsAuth(authStatus);
    
    if (authStatus) {
      // Immediately load user data from localStorage if available
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setUserData(user);
          setIsLoadingUser(false);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
        }
      }
      
      // Then fetch fresh data in background
      fetchUserData();
    }
  }, []);

  useEffect(() => {
    const onAuthChange = () => {
      const authStatus = localStorage.getItem("isAuthenticated") === "true";
      setIsAuth(authStatus);
      
      if (authStatus) {
        // Immediately load user data from localStorage if available
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            setUserData(user);
            setIsLoadingUser(false);
          } catch (error) {
            console.error('Error parsing stored user data:', error);
          }
        }
        
        // Then fetch fresh data in background
        fetchUserData();
      } else {
        setUserData(null);
        setIsLoadingUser(false);
        setIsProfileDropdownOpen(false);
        // Clear stored user data on logout
        localStorage.removeItem("user");
      }
    };

    window.addEventListener("authChanged", onAuthChange);
    return () => window.removeEventListener("authChanged", onAuthChange);
  }, [isAuth]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProfileDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('.profile-dropdown')) {
          setIsProfileDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileDropdownOpen]);

  function handleSignOut() {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // notify other listeners in the same tab
    window.dispatchEvent(new Event("authChanged"));
    setIsAuth(false);
    setUserData(null);
    setIsProfileDropdownOpen(false);
    navigate("/");
  }

  // Utility function to truncate long text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Utility function to get display name (first name + last initial)
  const getDisplayName = (fullName: string) => {
    const names = fullName.split(' ');
    if (names.length === 1) return names[0];
    return `${names[0]} ${names[names.length - 1].charAt(0)}.`;
  };

  return (
    <header className="w-full border-b border-[#504A4A] px-4 sm:px-6 md:px-8 lg:px-[50px] py-2 sm:py-3 md:py-4 lg:py-5">
      <div className="flex items-center justify-between max-w-[1440px] mx-auto">
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5">
          <svg
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-[73px] lg:h-[73px]"
            viewBox="0 0 73 73"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.29229 33.4583H15.2083C16.8217 33.4583 18.3691 34.0993 19.5099 35.2401C20.6507 36.3809 21.2917 37.9283 21.2917 39.5417V42.5833C21.2917 44.1967 21.9326 45.7441 23.0734 46.8849C24.2143 48.0257 25.7616 48.6667 27.375 48.6667C28.9884 48.6667 30.5357 49.3076 31.6766 50.4484C32.8174 51.5893 33.4583 53.1366 33.4583 54.75V63.7077M24.3333 11.969V16.7292C24.3333 18.7459 25.1345 20.6801 26.5605 22.1061C27.9866 23.5322 29.9208 24.3333 31.9375 24.3333H33.4583C35.0717 24.3333 36.6191 24.9743 37.7599 26.1151C38.9007 27.2559 39.5417 28.8033 39.5417 30.4167C39.5417 32.0301 40.1826 33.5774 41.3234 34.7182C42.4643 35.8591 44.0116 36.5 45.625 36.5C47.2384 36.5 48.7857 35.8591 49.9266 34.7182C51.0674 33.5774 51.7083 32.0301 51.7083 30.4167C51.7083 28.8033 52.3493 27.2559 53.4901 26.1151C54.6309 24.9743 56.1783 24.3333 57.7917 24.3333H61.028M45.625 62.3177V54.75C45.625 53.1366 46.2659 51.5893 47.4068 50.4484C48.5476 49.3076 50.0949 48.6667 51.7083 48.6667H61.028M63.875 36.5C63.875 40.0949 63.1669 43.6547 61.7912 46.976C60.4155 50.2972 58.3991 53.315 55.857 55.857C53.315 58.3991 50.2972 60.4155 46.976 61.7912C43.6547 63.1669 40.0949 63.875 36.5 63.875C32.9051 63.875 29.3453 63.1669 26.024 61.7912C22.7028 60.4155 19.685 58.3991 17.143 55.857C14.6009 53.315 12.5845 50.2972 11.2088 46.976C9.83308 43.6547 9.125 40.0949 9.125 36.5C9.125 29.2397 12.0091 22.2768 17.143 17.143C22.2768 12.0091 29.2397 9.125 36.5 9.125C43.7603 9.125 50.7232 12.0091 55.857 17.143C60.9909 22.2768 63.875 29.2397 63.875 36.5Z"
              stroke="black"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-civix-gold font-lato font-bold text-lg sm:text-xl md:text-2xl lg:text-4xl uppercase">
            CIVIX
          </span>
        </Link>

        {isAuth ? (
          <>
             <nav className="hidden lg:flex items-center gap-5">
      {links.map((link) => {
        const isActive = location.pathname === link.path;
        return (
          <Link
            key={link.path}
            to={link.path}
            className={`relative text-lg font-lato uppercase transition-colors ${
              isActive ? "text-[#4E342E]" : "text-[#504A4A] hover:text-civix-gold"
            }`}
          >
            {link.label}
            {/* Underline effect */}
            <span
              className={`absolute left-0 -bottom-1 h-0.5 bg-[#4E342E] transition-all duration-300 ${
                isActive ? "w-full" : "w-0 group-hover:w-full"
              }`}
            ></span>
          </Link>
        );
      })}
    </nav>

            <div className="flex items-center gap-3 sm:gap-4 lg:gap-8">
              {/* Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <User className="w-5 h-5 text-[#504A4A]" />
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-[#504A4A]">
                      {userData ? truncateText(getDisplayName(userData.name), 15) : 'Loading...'}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {userData ? userData.role : ''}
                    </div>
                  </div>
                  {isLoadingUser && (
                    <LoadingSpinner size="sm" className="ml-2" />
                  )}
                  <svg 
                    className={`w-4 h-4 text-[#504A4A] transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-3 sm:p-4">
                      {/* User Info Header */}
                      <div className="flex items-center gap-3 mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          {isLoadingUser ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                            {userData?.name || 'Loading...'}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            {userData?.email || 'Loading...'}
                          </p>
                        </div>
                      </div>

                      {/* User Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-700">Role:</span>
                          <span className="text-sm text-gray-900 capitalize">
                            {userData?.role || 'Loading...'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium text-gray-700">Location:</span>
                          <span className="text-sm text-gray-900 truncate max-w-32">
                            {userData?.location || 'Loading...'}
                          </span>
                        </div>
                      </div>

                      {/* Sign Out Button */}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm sm:text-base"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-[#504A4A]" />
                ) : (
                  <Menu className="w-6 h-6 text-[#504A4A]" />
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-8">
            <Link
              to="/signin"
              className="text-[#504A4A] font-lato text-sm sm:text-base md:text-lg uppercase hover:text-civix-gold transition-colors"
            >
              SIGN IN
            </Link>
            <Link
              to="/signup"
              className="text-civix-gold font-lato font-bold text-sm sm:text-base md:text-lg uppercase hover:opacity-80 transition-opacity"
            >
              GET STARTED
            </Link>
          </div>
        )}
      </div>
      
      {/* Mobile menu dropdown */}
      {isAuth && isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#504A4A] bg-white">
          
          <nav className="px-4 py-4 space-y-3">
            <Link
              to="/home"
              className="block text-[#504A4A] font-lato text-lg uppercase hover:text-civix-gold transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              HOME
            </Link>
            <Link
              to="/how-it-works"
              className="block text-[#504A4A] font-lato text-lg uppercase hover:text-civix-gold transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              HOW IT WORKS
            </Link>
            <Link
              to="/petitions"
              className="block text-[#504A4A] font-lato text-lg uppercase hover:text-civix-gold transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              PETITIONS
            </Link>
            <Link
              to="/polls"
              className="block text-[#504A4A] font-lato text-lg uppercase hover:text-civix-gold transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              POLLS
            </Link>
            <Link
              to="/reports"
              className="block text-[#504A4A] font-lato text-lg uppercase hover:text-civix-gold transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              REPORTS
            </Link>
            
            {/* Mobile Sign Out */}
            <button
              onClick={() => {
                handleSignOut();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors mt-4"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Sign Out</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}