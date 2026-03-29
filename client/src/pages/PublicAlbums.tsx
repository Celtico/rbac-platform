import React, { useEffect, useState } from "react";
import api from "../api";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";

interface Album {
  id: number;
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
}

const PublicAlbums: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const { mode, toggleMode } = useTheme();

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await api.get("/albums");
        setAlbums(res.data);
      } catch (err) {
        console.error("Error fetching public albums:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900 transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors text-gray-900 dark:text-gray-100">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            Music
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              aria-label="Toggle Theme"
            >
              {mode === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
            <Link
              to="/admin"
              className="flex items-center px-4 py-2 bg-primary text-white rounded-custom hover:opacity-90 transition font-medium shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" /> Admin Area
            </Link>
          </div>
        </header>

        {albums.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-custom shadow-sm border dark:border-gray-700">
            <p className="text-xl text-gray-500 dark:text-gray-400">
              No albums found in the collection.
            </p>
            <p className="mt-2 text-gray-400">
              Check if the backend is running and contains data.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {albums.map((album) => (
              <div
                key={album.id}
                className="bg-white dark:bg-gray-800 rounded-custom overflow-hidden shadow-lg transition-all hover:scale-105 border dark:border-gray-700"
              >
                <div className="h-64 overflow-hidden bg-gray-200 dark:bg-gray-700">
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Cover
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                    {album.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    {album.artist}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold">
                      {album.year}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicAlbums;
