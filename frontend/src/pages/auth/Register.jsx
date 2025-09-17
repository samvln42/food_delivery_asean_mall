import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Loading from "../../components/common/Loading";
import Header from "../../components/common/Header";
import BottomNavigation from "../../components/common/BottomNavigation";
import { useLanguage } from "../../contexts/LanguageContext";
import { appSettingsService } from "../../services/api";

const Register = () => {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuth();
  const { translate } = useLanguage();
  const [appSettings, setAppSettings] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    role: "customer",
    agreeToTerms: false,
  });

  const [passwordError, setPasswordError] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const roleDropdownRef = useRef(null);

  // Fetch app settings
  useEffect(() => {
    const fetchAppSettings = async () => {
      try {
        const response = await appSettingsService.getPublic({
          _t: new Date().getTime(),
        });
        setAppSettings(response.data);
      } catch (error) {
        console.error("Error fetching app settings:", error);
      }
    };

    fetchAppSettings();
  }, []);

  // Close role dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setIsRoleOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear errors when user starts typing
    if (error) {
      clearError();
    }
    if (passwordError) {
      setPasswordError("");
    }
  };

  const validatePasswords = () => {
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    if (formData.password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswords()) {
      return;
    }

    if (!formData.agreeToTerms) {
      alert("Please agree to the terms and conditions");
      return;
    }

    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      confirm_password: formData.confirmPassword,
      phone_number: formData.phone,
      address: formData.address,
      role: formData.role,
    });

    if (result.success) {
      navigate("/verify-email", {
        state: {
          email: formData.email,
          message:
            "Registration successful! Please check your email for verification code.",
        },
      });
    }
  };

  if (showSuccessMessage) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8 pt-20">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
                <span className="text-2xl">✅</span>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900">
                Registration Successful
              </h2>
              <p className="mt-2 text-center text-sm text-secondary-600">
                Verification email has been sent to {formData.email} <br />
                Please check your email to verify your account
              </p>
              <div className="mt-4">
                <Loading size="small" text="Loading..." />
              </div>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8 pt-20">
        <div className="max-w-md w-full space-y-8 overflow-hidden">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
              <span className="text-2xl">
                {" "}
                {appSettings?.logo_url ? (
                  <img
                    src={appSettings.logo_url}
                    alt={appSettings.app_name}
                    className="h-10 w-auto"
                  />
                ) : (
                  <span className="text-2xl"> 🍕</span>
                )}
              </span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900">
              {translate("common.register")}
            </h2>
            <p className="mt-2 text-center text-sm text-secondary-600">
              {translate("auth.or")}{" "}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                {translate("common.login")}
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-secondary-700"
                >
                  {translate("auth.username")} *
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder={translate("auth.username")}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-secondary-700"
                >
                  {translate("auth.email")} *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder={translate("auth.email")}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-secondary-700"
                >
                  {translate("auth.password")} *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder={translate("auth.password")}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-secondary-700"
                >
                  {translate("auth.confirm_password")} *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder={translate("auth.confirm_password")}
                />
                {passwordError && (
                  <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-secondary-700"
                >
                  {translate("auth.phone")}
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder={translate("auth.phone")}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-secondary-700"
                >
                  {translate("auth.address")}
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  className="input-field mt-1"
                  placeholder={translate("auth.address")}
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-secondary-700"
                >
                  {translate("auth.role")}
                </label>
                <div className="relative" ref={roleDropdownRef}>
                  <button
                    id="role"
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isRoleOpen}
                    onClick={() => setIsRoleOpen((prev) => !prev)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg bg-white text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-8"
                  >
                    {formData.role === "general_restaurant"
                      ? translate("auth.restaurant")
                      : translate("auth.customer")}
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>

                  {isRoleOpen && (
                    <ul
                      role="listbox"
                      className="absolute z-20 mt-1 left-0 right-0 max-h-48 overflow-auto bg-white border border-secondary-200 rounded-lg shadow-lg"
                    >
                      <li>
                        <button
                          type="button"
                          role="option"
                          aria-selected={formData.role === "customer"}
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, role: "customer" }));
                            setIsRoleOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm ${formData.role === "customer" ? "bg-primary-50 text-primary-700" : "text-secondary-700 hover:bg-secondary-50"}`}
                        >
                          {translate("auth.customer")}
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          role="option"
                          aria-selected={formData.role === "general_restaurant"}
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, role: "general_restaurant" }));
                            setIsRoleOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm ${formData.role === "general_restaurant" ? "bg-primary-50 text-primary-700" : "text-secondary-700 hover:bg-secondary-50"}`}
                        >
                          {translate("auth.restaurant")}
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <label
                htmlFor="agreeToTerms"
                className="ml-2 block text-sm text-secondary-900"
              >
                {translate("auth.agree_terms")}{" "}
                <Link
                  to="/terms"
                  className="text-primary-600 hover:text-primary-500"
                >
                  {translate("auth.terms")}
                </Link>{" "}
                {translate("auth.and")}{" "}
                <Link
                  to="/privacy"
                  className="text-primary-600 hover:text-primary-500"
                >
                  {translate("auth.privacy")}
                </Link>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loading size="small" text="" />
                ) : (
                  translate("common.register")
                )}
              </button>
            </div>

            <div className="mt-6">
            {/* <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-secondary-50 text-secondary-500">
                  {translate("auth.or")}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-secondary-300 rounded-lg shadow-sm bg-white text-sm font-medium text-secondary-500 hover:bg-secondary-50"
              >
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="ml-2">{translate("auth.sign_up_with_google")}</span>
              </button>
            </div> */}
          </div>
          </form>
        </div>
      </div>
      <BottomNavigation />
    </>
  );
};

export default Register;
