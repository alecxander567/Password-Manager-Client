import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/AuthProvider";
import { VaultSessionProvider } from "./hooks/VaultSessionProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Vaults from "./pages/Vaults";
import CreateVault from "./pages/CreateVault";
import UnlockVault from "./pages/UnlockVault";
import VaultAccounts from "./pages/VaultAccounts";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VaultSessionProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vaults"
            element={
              <ProtectedRoute>
                <Vaults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vaults/new"
            element={
              <ProtectedRoute>
                <CreateVault />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vaults/:vaultId/unlock"
            element={
              <ProtectedRoute>
                <UnlockVault />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vaults/:vaultId/accounts"
            element={
              <ProtectedRoute>
                <VaultAccounts />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/vaults" replace />} />
          </Routes>
        </VaultSessionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
