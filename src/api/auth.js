import axiosInstance from "./axios";

export const registerUser = (userData) => {
  return axiosInstance.post("/api/users/register/", userData);
};

export const loginUser = (credentials) => {
  return axiosInstance.post("/api/users/login/", credentials);
};

export const logoutUser = () => {
  const refreshToken = localStorage.getItem("refresh_token");
  return axiosInstance.post("/api/users/logout/", { refresh: refreshToken });
};

export const refreshToken = (refresh) => {
  return axiosInstance.post("/api/users/token/refresh/", { refresh });
};

export const getUserProfile = () => {
  return axiosInstance.get("/api/users/profile/");
};

export const updateUserProfile = (data) => {
  return axiosInstance.patch("/api/users/profile/", data);
};

export const changePassword = (data) => {
  return axiosInstance.post("/api/users/change-password/", data);
};

export const deleteAccount = (refreshToken) => {
  return axiosInstance.delete("/api/users/delete-account/", {
    data: { refresh: refreshToken },
  });
};
