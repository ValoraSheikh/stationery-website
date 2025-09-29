"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignUpPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = "Name is required (min 2 characters)";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!agreedToTerms) {
      newErrors.terms = "Please agree to the terms and conditions";
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validateForm();

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Trim inputs
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          (data && (data.message || data.error)) ||
          "Failed to create account. Please try again.";
        setErrors({ submit: String(message) });
        setIsLoading(false);
        return;
      }

      // registration successful
      // auto-login using credentials provider (no redirect)
      const signInResult = await signIn("credentials", {
        email: payload.email,
        password: payload.password,
        redirect: false,
        callbackUrl: "/"
      });

      console.log("😂😎", signInResult);
      

      // signIn can return undefined in some builds; guard it
      if (signInResult?.error) {
        setErrors({
          submit: "Account created but sign-in failed. Please try to sign in.",
        });
        setIsLoading(false);
        return;
      }

      // success - redirect to home (or dashboard)
      router.push("/");
    } catch (err) {
      console.error("Signup error:", err);
      setErrors({ submit: "Something went wrong. Please try again." });
      setIsLoading(false);
    }
  };

  const handleSocialSignUp = (provider: string) => {
    // for Google: signIn('google')
    // pass callbackUrl if you want to redirect after login
    signIn(provider.toLowerCase()); // provider should be "google"
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-gray-600 rounded-xl flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="7.5,4.21 12,6.81 16.5,4.21"></polyline>
                <polyline points="7.5,19.79 7.5,14.6 3,12"></polyline>
                <polyline points="21,12 16.5,14.6 16.5,19.79"></polyline>
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 font-inter">
              Create your account
            </h1>
            <p className="text-gray-600 font-inter">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-gray-600 hover:text-gray-700 font-bold transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2 font-inter"
              >
                Full name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg font-inter transition-all duration-200 text-black ${
                  errors.name
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:gray-gray-500 focus:ring-gray-500"
                } focus:ring-2 focus:ring-opacity-20 outline-none`}
                placeholder="Your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 font-inter">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2 font-inter"
              >
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg font-inter transition-all duration-200 text-black ${
                  errors.email
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:gray-gray-500 focus:ring-gray-500"
                } focus:ring-2 focus:ring-opacity-20 outline-none`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 font-inter">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2 font-inter"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg font-inter transition-all duration-200 text-black ${
                  errors.password
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                } focus:ring-2 focus:ring-opacity-20 outline-none`}
                placeholder="Create a password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 font-inter">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2 font-inter"
              >
                Confirm password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg font-inter transition-all duration-200 text-black ${
                  errors.confirmPassword
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                } focus:ring-2 focus:ring-opacity-20 outline-none`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 font-inter">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500 transition-all duration-200"
              />
              <label
                htmlFor="terms"
                className="ml-3 text-sm text-gray-600 font-inter"
              >
                I agree to the{" "}
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-700 transition-colors"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-700 transition-colors"
                >
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-600 font-inter">{errors.terms}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg transition-all duration-200 hover:from-gray-700 hover:to-gray-800 focus:ring-4 focus:ring-gray-500 focus:ring-opacity-20 outline-none disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] font-inter"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating account...
                </div>
              ) : (
                "Create account"
              )}
            </button>

            {errors.submit && (
              <p className="text-sm text-red-600 text-center font-inter">
                {errors.submit}
              </p>
            )}
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500 font-inter">
              Or continue with
            </span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Social Sign Up Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleSocialSignUp("google")}
              className="flex items-center justify-center px-4 w-full py-3 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 focus:ring-4 focus:ring-gray-200 focus:ring-opacity-50 outline-none transform hover:scale-[1.02] active:scale-[0.98] font-inter"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className=" lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-blue-600 flex items-center justify-center">
          <div className="text-center text-white p-12">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg
                viewBox="0 0 24 24"
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 3-3m2 5v-2a3 3 0 0 1 3-3m2-3a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM21 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-4">Join our community</h2>
            <p className="text-lg opacity-90 max-w-md mx-auto">
              Connect with like-minded people and start building amazing things
              together.
            </p>
            <div className="mt-12 grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-sm opacity-80">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">50+</div>
                <div className="text-sm opacity-80">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">99%</div>
                <div className="text-sm opacity-80">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>

        <Image
          src="https://plus.unsplash.com/premium_vector-1704897618835-2fd919a49ced?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8amV3ZWxyeXxlbnwwfHwwfHx8MA%3D%3D"
          alt="Sign Up Illustration"
          fill
          style={{ objectFit: "cover" }}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
