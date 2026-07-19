import axiosInstance from "./axios";

export const getCategories = () => {
  return axiosInstance.get("/api/categories/");
};

export const createCategory = (categoryData) => {
  return axiosInstance.post("/api/categories/", categoryData);
};

export const getCategory = (id) => {
  return axiosInstance.get(`/api/categories/${id}/`);
};

export const updateCategory = (id, categoryData) => {
  return axiosInstance.put(`/api/categories/${id}/`, categoryData);
};

export const deleteCategory = (id) => {
  return axiosInstance.delete(`/api/categories/${id}/`);
};

export const seedCategories = () => {
  return axiosInstance.post("/api/categories/seed/");
};
