import { useState } from "react";
import { changePassword } from "../api/auth";

export const usePasswordChange = () => {
  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    new_password2: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccess("");
    setLoading(true);

    try {
      const res = await changePassword(form);
      const accessToken = res.data.access || res.data.access_token;
      const refreshToken = res.data.refresh || res.data.refresh_token;

      if (accessToken) localStorage.setItem("access_token", accessToken);
      if (refreshToken) localStorage.setItem("refresh_token", refreshToken);

      setSuccess("Password changed successfully!");
      setForm({ old_password: "", new_password: "", new_password2: "" });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const mapped = {};
        for (const [key, msgs] of Object.entries(data)) {
          mapped[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        }
        setErrors(mapped);
      } else {
        setErrors({ non_field: "Failed to change password." });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ old_password: "", new_password: "", new_password2: "" });
    setErrors({});
    setSuccess("");
  };

  return {
    form,
    loading,
    errors,
    success,
    handleChange,
    handleSubmit,
    resetForm,
  };
};
