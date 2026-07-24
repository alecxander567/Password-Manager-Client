import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiLock } from "react-icons/fi";
import { useAuth } from "../hooks/AuthContext";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const hasCleared = useRef(false); // Track if we've already cleared

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Clear any existing session ONLY ONCE when component mounts
  useEffect(() => {
    if (!hasCleared.current) {
      hasCleared.current = true;
      localStorage.clear();
      sessionStorage.clear();
    }
  }, []); // Empty dependency array = only runs once

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(form.email, form.password);
      // Don't navigate here - let the useEffect handle it
      // The redirect will happen when 'user' is set
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.error ||
        "Login failed. Please try again.";
      setError(msg);
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
            Your secure password manager. Keep your credentials safe and
            accessible.
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
            Welcome back
          </h2>
          <p className="text-gray-400 mb-8 text-sm">
            Sign in to access your vault
          </p>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition cursor-pointer">
              {submitting ? "Signing in …" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-cyan-400 hover:text-cyan-300 transition">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
