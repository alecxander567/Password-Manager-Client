import { useState } from "react";
import { getFavorites, addFavorite, removeFavorite } from "../api/favorites";

export function normalizeFavoriteId(id) {
  if (id && typeof id === "object") {
    return normalizeFavoriteId(id.id ?? id.pk);
  }

  return id === null || id === undefined ? null : String(id);
}

function getFavoriteRecords(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.favorites)) return data.favorites;
  return [];
}

export default function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteError, setFavoriteError] = useState("");

  async function loadFavorites() {
    try {
      const res = await getFavorites();
      const ids = new Set(
        getFavoriteRecords(res.data)
          .map((favorite) => {
            if (favorite && typeof favorite === "object") {
              return normalizeFavoriteId(
                favorite.vault ?? favorite.vault_id ?? favorite.id,
              );
            }
            return normalizeFavoriteId(favorite);
          })
          .filter(Boolean),
      );
      setFavoriteIds(ids);
      return { ids, data: res.data };
    } catch {
      setFavoriteIds(new Set());
      return { ids: new Set(), data: [] };
    }
  }

  async function toggleFavorite(vaultId) {
    const normalizedVaultId = normalizeFavoriteId(vaultId);
    const isCurrentlyFavorited = favoriteIds.has(normalizedVaultId);
    setFavoriteLoading(true);
    setFavoriteError("");

    // Optimistic update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyFavorited) {
        next.delete(normalizedVaultId);
      } else {
        next.add(normalizedVaultId);
      }
      return next;
    });

    try {
      if (isCurrentlyFavorited) {
        await removeFavorite(vaultId);
      } else {
        await addFavorite(vaultId);
      }
      return isCurrentlyFavorited ? "removed" : "added";
    } catch {
      setFavoriteError("Failed to update favorites.");
      // Revert by reloading
      loadFavorites();
      return null;
    } finally {
      setFavoriteLoading(false);
    }
  }

  return {
    favoriteIds,
    favoriteLoading,
    favoriteError,
    loadFavorites,
    toggleFavorite,
  };
}
