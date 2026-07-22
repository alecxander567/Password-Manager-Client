import { useState, useRef } from "react";
import { useAuth } from "../hooks/AuthContext";
import { updateUserProfile, changePassword, deleteAccount } from "../api/auth";
import { useNavigate } from "react-router-dom";
import CategoriesSection from "../components/CategoriesSection";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import {
  FiAlertTriangle,
  FiLogOut,
  FiCamera,
  FiSave,
  FiX,
} from "react-icons/fi";

export default function Dashboard() {
  const { user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", bio: "" });
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Password change state
  const [pwForm, setPwForm] = useState({
    old_password: "",
    new_password: "",
    new_password2: "",
  });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSuccess, setPwSuccess] = useState("");

  // Delete account
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Active section
  const [section, setSection] = useState("profile");

  const startEditing = () => {
    setEditForm({ username: user.username || "", bio: user.bio || "" });
    setEditing(true);
    setProfileError("");
    setProfileSuccess("");
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    const fd = new FormData();
    fd.append("username", editForm.username);
    fd.append("bio", editForm.bio);

    try {
      await updateUserProfile(fd);
      await refreshProfile();
      setProfileSuccess("Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const first = Object.values(data).flat()[0];
        setProfileError(first || "Failed to update profile.");
      } else {
        setProfileError("Failed to update profile.");
      }
    }
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("profile_picture", file);
    try {
      await updateUserProfile(fd);
      await refreshProfile();
      setProfileSuccess("Profile picture updated!");
    } catch {
      setProfileError("Failed to upload picture.");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwErrors({});
    setPwSuccess("");

    try {
      const res = await changePassword(pwForm);
      const accessToken = res.data.access || res.data.access_token;
      const refreshToken = res.data.refresh || res.data.refresh_token;
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      setPwSuccess("Password changed successfully!");
      setPwForm({ old_password: "", new_password: "", new_password2: "" });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const mapped = {};
        for (const [key, msgs] of Object.entries(data)) {
          mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        }
        setPwErrors(mapped);
      } else {
        setPwErrors({ non_field: "Failed to change password." });
      }
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      await logout();
      navigate("/login");
    } catch {
      setDeleting(false);
      setProfileError("Failed to delete account.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const defaultPic =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='40' fill='%23374151'/%3E%3Ctext x='40' y='44' text-anchor='middle' fill='%239ca3af' font-size='28' font-family='Arial' dy='.35em'%3E%3F%3C/text%3E%3C/svg%3E";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <TopBar maxWidth="max-w-6xl">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition cursor-pointer">
          <FiLogOut className="w-4 h-4" />
          Sign Out
        </button>
      </TopBar>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Welcome, {user?.username || "User"}
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage your account</p>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-8">
          {/* Sidebar nav */}
          <Sidebar activeSection={section} onSectionChange={setSection} />

          {/* Main content */}
          <div>
            {section === "profile" && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Profile</h2>
                  {!editing && (
                    <button
                      onClick={startEditing}
                      className="px-4 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition cursor-pointer">
                      Edit
                    </button>
                  )}
                </div>

                {/* Profile picture */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-800 ring-2 ring-gray-700">
                    <img
                      src={
                        user?.profile_picture ?
                          user.profile_picture.startsWith("http") ?
                            user.profile_picture
                          : `http://127.0.0.1:8000${user.profile_picture}`
                        : defaultPic
                      }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">
                      {user?.username}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="mt-2 flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition cursor-pointer">
                      <FiCamera className="w-3.5 h-3.5" />
                      Change picture
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePictureChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {profileError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-300 text-sm">
                    {profileError}
                  </div>
                )}
                {profileSuccess && (
                  <div className="mb-4 p-3 rounded-lg bg-green-900/40 border border-green-800 text-green-300 text-sm">
                    {profileSuccess}
                  </div>
                )}

                {editing ?
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={editForm.username}
                        onChange={handleEditChange}
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={editForm.bio}
                        onChange={handleEditChange}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition cursor-pointer">
                        <FiSave className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="flex items-center gap-2 px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition cursor-pointer">
                        <FiX className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </form>
                : <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                        Username
                      </p>
                      <p className="text-white mt-0.5">
                        {user?.username || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                        Email
                      </p>
                      <p className="text-white mt-0.5">{user?.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                        Bio
                      </p>
                      <p className="text-gray-300 mt-0.5 text-sm">
                        {user?.bio || "No bio set."}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                        Member since
                      </p>
                      <p className="text-gray-300 mt-0.5 text-sm">
                        {user?.created_at ?
                          new Date(user.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )
                        : "—"}
                      </p>
                    </div>
                  </div>
                }
              </div>
            )}

            {section === "categories" && (
              <CategoriesSection section={section} />
            )}

            {section === "security" && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">
                  Change Password
                </h2>

                {pwSuccess && (
                  <div className="mb-4 p-3 rounded-lg bg-green-900/40 border border-green-800 text-green-300 text-sm">
                    {pwSuccess}
                  </div>
                )}
                {pwErrors.non_field && (
                  <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-300 text-sm">
                    {pwErrors.non_field}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="old_password"
                      value={pwForm.old_password}
                      onChange={(e) =>
                        setPwForm((prev) => ({
                          ...prev,
                          old_password: e.target.value,
                        }))
                      }
                      required
                      className={`w-full px-4 py-2.5 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition ${
                        pwErrors.old_password ? "border-red-700" : (
                          "border-gray-700"
                        )
                      }`}
                    />
                    {pwErrors.old_password && (
                      <p className="mt-1 text-xs text-red-400">
                        {pwErrors.old_password}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="new_password"
                      value={pwForm.new_password}
                      onChange={(e) =>
                        setPwForm((prev) => ({
                          ...prev,
                          new_password: e.target.value,
                        }))
                      }
                      required
                      className={`w-full px-4 py-2.5 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition ${
                        pwErrors.new_password ? "border-red-700" : (
                          "border-gray-700"
                        )
                      }`}
                    />
                    {pwErrors.new_password && (
                      <p className="mt-1 text-xs text-red-400">
                        {pwErrors.new_password}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="new_password2"
                      value={pwForm.new_password2}
                      onChange={(e) =>
                        setPwForm((prev) => ({
                          ...prev,
                          new_password2: e.target.value,
                        }))
                      }
                      required
                      className={`w-full px-4 py-2.5 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition ${
                        pwErrors.new_password2 ? "border-red-700" : (
                          "border-gray-700"
                        )
                      }`}
                    />
                    {pwErrors.new_password2 && (
                      <p className="mt-1 text-xs text-red-400">
                        {pwErrors.new_password2}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition cursor-pointer">
                    Update Password
                  </button>
                </form>
              </div>
            )}

            {section === "danger" && (
              <div className="bg-gray-900 border border-red-900/50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-red-400 mb-2">
                  Danger Zone
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  Once you delete your account, there is no going back. Please
                  be certain.
                </p>

                {!confirmDelete ?
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-2 px-5 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition cursor-pointer">
                    <FiAlertTriangle className="w-4 h-4" />
                    Delete Account
                  </button>
                : <div className="space-y-4">
                    <p className="text-red-300 text-sm">
                      Are you absolutely sure? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="px-5 py-2 bg-red-700 hover:bg-red-600 disabled:bg-red-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition cursor-pointer">
                        {deleting ? "Deleting …" : "Yes, delete my account"}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  </div>
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
