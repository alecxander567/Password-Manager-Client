// api/dashboard.js
import axiosInstance from "./axios";

export const getDashboardStats = () => {
  return axiosInstance.get("/api/vaults/dashboard/stats/");
};
