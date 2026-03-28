import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { Plus, Edit2, Trash2 } from "lucide-react";

interface Permission {
  id: number;
  name: string;
}

const PermissionsPage: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const { hasPermission } = useAuth();
  const [editing, setEditing] = useState<Partial<Permission> | null>(null);

  const fetchPermissions = async () => {
    try {
      const res = await api.get("/permissions");
      setPermissions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure?")) return;
    await api.delete(`/permissions/${id}`);
    fetchPermissions();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing?.id) {
      await api.patch(`/permissions/${editing.id}`, editing);
    } else {
      await api.post("/permissions", editing);
    }
    setEditing(null);
    fetchPermissions();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white transition-colors">
          Permissions Management
        </h1>
        {hasPermission("manage:roles") && (
          <button
            onClick={() => setEditing({ name: "" })}
            className="bg-green-500 text-white px-4 py-2 rounded flex items-center hover:bg-green-600 transition shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Permission
          </button>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md transition-colors"
          >
            <h2 className="text-xl font-bold mb-4 dark:text-white">
              {editing.id ? "Edit" : "Add"} Permission
            </h2>
            <div className="space-y-4">
              <input
                className="w-full p-2 border dark:border-gray-700 rounded dark:bg-gray-900 dark:text-white"
                placeholder="Permission Name (e.g. read:albums)"
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                required
              />
            </div>
            <div className="flex justify-end mt-6 space-x-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden transition-colors">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Permission Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {permissions.map((perm) => (
              <tr
                key={perm.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-6 py-4 dark:text-gray-300 font-medium">
                  {perm.name}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {hasPermission("manage:roles") && (
                    <>
                      <button
                        onClick={() => setEditing(perm)}
                        className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(perm.id)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PermissionsPage;
