import axiosInstance from "./axios";

export const registerUser = (userData) => {
  return axiosInstance.post("/api/users/register/", userData);
};

export const loginUser = (credentials) => {
  return axiosInstance.post("/api/users/login/", credentials);
};

export const logoutUser = () => {
  return axiosInstance.post("/api/users/logout/", {
    refresh: localStorage.getItem("refresh_token"),
  });
};

export const refreshToken = (refresh) => {
  return axiosInstance.post("/api/users/token/refresh/", { refresh });
};

export const getUserProfile = () => {
  return axiosInstance.get("/api/users/profile/");
};

export const updateUserProfile = (formData) => {
  return axiosInstance.patch("/api/users/profile/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const changePassword = (data) => {
  return axiosInstance.post("/api/users/change-password/", data);
};

export const deleteAccount = () => {
  return axiosInstance.delete("/api/users/delete-account/");
};