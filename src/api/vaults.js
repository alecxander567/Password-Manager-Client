import axiosInstance from "./axios";

// Vaults
export const listVaults = () => {
  return axiosInstance.get("/api/vaults/");
};

export const createVault = (data) => {
  return axiosInstance.post("/api/vaults/", data);
};

export const getVaultDetail = (vaultId) => {
  return axiosInstance.get(`/api/vaults/${vaultId}/`);
};

export const unlockVault = (vaultId, masterPassword) => {
  return axiosInstance.post(`/api/vaults/${vaultId}/unlock/`, {
    master_password: masterPassword,
  });
};

// Accounts
export const listAccounts = (vaultId) => {
  return axiosInstance.get(`/api/vaults/${vaultId}/accounts/`);
};

export const createAccount = (vaultId, data) => {
  return axiosInstance.post(`/api/vaults/${vaultId}/accounts/`, data);
};

export const getAccountDetail = (vaultId, accountId) => {
  return axiosInstance.get(`/api/vaults/${vaultId}/accounts/${accountId}/`);
};

export const updateAccount = (vaultId, accountId, data) => {
  return axiosInstance.put(
    `/api/vaults/${vaultId}/accounts/${accountId}/update/`,
    data,
  );
};

export const deleteAccount = (vaultId, accountId) => {
  return axiosInstance.delete(
    `/api/vaults/${vaultId}/accounts/${accountId}/delete/`,
  );
};

// WebAuthn
export const webauthnRegisterOptions = (vaultId) => {
  return axiosInstance.post(
    `/api/vaults/${vaultId}/webauthn/register/options/`,
  );
};

export const webauthnRegisterVerify = (vaultId, data) => {
  return axiosInstance.post(
    `/api/vaults/${vaultId}/webauthn/register/verify/`,
    data,
  );
};

export const webauthnAuthOptions = (vaultId) => {
  return axiosInstance.post(
    `/api/vaults/${vaultId}/webauthn/authenticate/options/`,
  );
};

export const webauthnAuthVerify = (vaultId, data) => {
  return axiosInstance.post(
    `/api/vaults/${vaultId}/webauthn/authenticate/verify/`,
    data,
  );
};
