import React, { useEffect, useState, useRef } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { Plus, Edit2, Trash2, Upload } from "lucide-react";

interface Album {
  id: number;
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
}

const Albums: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const { hasPermission } = useAuth();
  const [editing, setEditing] = useState<Partial<Album> | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAlbums = async () => {
    try {
      const res = await api.get("/albums");
      setAlbums(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure?")) return;
    await api.delete(`/albums/${id}`);
    fetchAlbums();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await api.post("/albums/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEditing({ ...editing, coverUrl: res.data.url });
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing?.id) {
      await api.patch(`/albums/${editing.id}`, editing);
    } else {
      await api.post("/albums", editing);
    }
    setEditing(null);
    fetchAlbums();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white transition-colors">
          Albums
        </h1>
        {hasPermission("write:albums") && (
          <button
            id="add-album-button"
            onClick={() =>
              setEditing({
                title: "",
                artist: "",
                year: new Date().getFullYear(),
                coverUrl: "",
              })
            }
            className="bg-primary text-white px-4 py-2 rounded-custom flex items-center hover:opacity-90 transition shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Album
          </button>
        )}
      </div>

      {editing && (
        <div
          id="album-modal"
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 p-6 rounded-custom shadow-lg w-full max-w-md transition-colors"
          >
            <h2
              id="modal-title"
              className="text-xl font-bold mb-4 dark:text-white"
            >
              {editing.id ? "Edit" : "Add"} Album
            </h2>
            <div className="space-y-4">
              <input
                id="album-title"
                className="w-full p-2 border dark:border-gray-700 rounded-custom dark:bg-gray-900 dark:text-white"
                placeholder="Title"
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
                required
              />
              <input
                id="album-artist"
                className="w-full p-2 border dark:border-gray-700 rounded-custom dark:bg-gray-900 dark:text-white"
                placeholder="Artist"
                value={editing.artist}
                onChange={(e) =>
                  setEditing({ ...editing, artist: e.target.value })
                }
                required
              />
              <input
                id="album-year"
                type="number"
                className="w-full p-2 border dark:border-gray-700 rounded-custom dark:bg-gray-900 dark:text-white"
                placeholder="Year"
                value={editing.year}
                onChange={(e) =>
                  setEditing({ ...editing, year: +e.target.value })
                }
              />
              <input
                id="album-cover"
                className="w-full p-2 border dark:border-gray-700 rounded-custom dark:bg-gray-900 dark:text-white"
                placeholder="Cover URL"
                value={editing.coverUrl}
                onChange={(e) =>
                  setEditing({ ...editing, coverUrl: e.target.value })
                }
              />
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Image"}
                </button>
                {editing.coverUrl && (
                  <span className="text-xs text-green-500 truncate max-w-[150px]">
                    Image uploaded!
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-2">
              <button
                id="cancel-album-button"
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400"
              >
                Cancel
              </button>
              <button
                id="save-album-button"
                className="px-4 py-2 bg-primary text-white rounded-custom hover:opacity-90 transition shadow-sm"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div
        id="albums-grid"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {albums.map((album) => (
          <div
            key={album.id}
            data-testid={`album-card-${album.id}`}
            className="bg-white dark:bg-gray-800 p-4 rounded-custom shadow flex flex-col album-card transition-colors border dark:border-gray-700"
          >
            {album.coverUrl && (
              <img
                src={album.coverUrl}
                alt={album.title}
                className="w-full h-48 object-cover rounded-custom mb-4 shadow-sm"
              />
            )}
            <h3 className="font-bold text-lg dark:text-white">{album.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {album.artist} ({album.year})
            </p>
            <div className="flex justify-end mt-4 space-x-2">
              {hasPermission("write:albums") && (
                <>
                  <button
                    id={`edit-album-${album.id}`}
                    onClick={() => setEditing(album)}
                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded edit-album-btn transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    id={`delete-album-${album.id}`}
                    onClick={() => handleDelete(album.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded delete-album-btn transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Albums;
