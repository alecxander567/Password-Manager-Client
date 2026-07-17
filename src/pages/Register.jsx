import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiLock, FiUser, FiMail, FiInfo } from "react-icons/fi";
import { useAuth } from "../hooks/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    bio: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const mapped = {};
        for (const [key, msgs] of Object.entries(data)) {
          mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        }
        setErrors(mapped);
      } else {
        setErrors({ non_field: "Registration failed. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left – branding */}
      <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 via-gray-950 to-black p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
        <div className="relative z-10 text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-600/20 border border-cyan-800/50 flex items-center justify-center">
              <FiLock className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">VaultPass</h1>
          <p className="text-gray-400 text-lg max-w-sm">
            Create your vault and start managing your passwords securely.
          </p>
        </div>
      </div>

      {/* Right – form */}
      <div className="flex items-center justify-center bg-gray-950 p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="md:hidden text-center mb-8">
            <div className="mb-2 flex justify-center">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-800/50 flex items-center justify-center">
                <FiLock className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">VaultPass</h1>
          </div>

          <h2 className="text-2xl font-semibold text-white mb-1">
            Create your account
          </h2>
          <p className="text-gray-400 mb-8 text-sm">
            Fill in the details below to get started
          </p>

          {errors.non_field && (
            <div className="mb-6 p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-300 text-sm">
              {errors.non_field}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <FiUser className="w-3.5 h-3.5 text-gray-400" />
                  Username
                </div>
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2.5 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition ${
                  errors.username ? "border-red-700" : "border-gray-800"
                }`}
                placeholder="johndoe"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-400">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <FiMail className="w-3.5 h-3.5 text-gray-400" />
                  Email
                </div>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2.5 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition ${
                  errors.email ? "border-red-700" : "border-gray-800"
                }`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <FiLock className="w-3.5 h-3.5 text-gray-400" />
                  Password
                </div>
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2.5 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition ${
                  errors.password ? "border-red-700" : "border-gray-800"
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <FiLock className="w-3.5 h-3.5 text-gray-400" />
                  Confirm Password
                </div>
              </label>
              <input
                type="password"
                name="password2"
                value={form.password2}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2.5 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition ${
                  errors.password2 ? "border-red-700" : "border-gray-800"
                }`}
                placeholder="••••••••"
              />
              {errors.password2 && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.password2}
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <FiInfo className="w-3.5 h-3.5 text-gray-400" />
                  Bio{" "}
                  <span className="text-gray-500 font-normal">(optional)</span>
                </div>
              </label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition resize-none"
                placeholder="A short bio about yourself"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition cursor-pointer"
            >
              {submitting ? "Creating account …" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-cyan-400 hover:text-cyan-300 transition"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}