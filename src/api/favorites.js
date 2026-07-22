import axiosInstance from "./axios";

export const getFavorites = () => {
  return axiosInstance.get("/api/favorites/");
};

export const addFavorite = (vaultPk) => {
  return axiosInstance.post(`/api/favorites/${vaultPk}/`);
};

export const removeFavorite = (vaultPk) => {
  return axiosInstance.delete(`/api/favorites/${vaultPk}/`);
};