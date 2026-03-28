import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { Plus, Edit2, Trash2 } from "lucide-react";

interface User {
  id: number;
  username: string;
  roles: any[];
}

interface Role {
  id: number;
  name: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const { hasPermission } = useAuth();
  const [editing, setEditing] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      const [uRes, rRes] = await Promise.all([
        api.get("/users"),
        api.get("/roles"),
      ]);
      setUsers(uRes.data);
      setRoles(rRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure?")) return;
    await api.delete(`/users/${id}`);
    fetchData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      username: editing.username,
      roleIds: editing.roleIds || [],
    };
    if (editing.password) (payload as any).password = editing.password;

    if (editing.id) {
      await api.patch(`/users/${editing.id}`, payload);
    } else {
      await api.post("/users", payload);
    }
    setEditing(null);
    fetchData();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white transition-colors">
          Users Management
        </h1>
        {hasPermission("manage:users") && (
          <button
            onClick={() =>
              setEditing({ username: "", password: "", roleIds: [] })
            }
            className="bg-green-500 text-white px-4 py-2 rounded flex items-center hover:bg-green-600 transition shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add User
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
              {editing.id ? "Edit" : "Add"} User
            </h2>
            <div className="space-y-4">
              <input
                className="w-full p-2 border dark:border-gray-700 rounded dark:bg-gray-900 dark:text-white"
                placeholder="Username"
                value={editing.username}
                onChange={(e) =>
                  setEditing({ ...editing, username: e.target.value })
                }
                required
              />
              {!editing.id && (
                <input
                  type="password"
                  className="w-full p-2 border dark:border-gray-700 rounded dark:bg-gray-900 dark:text-white"
                  placeholder="Password"
                  value={editing.password}
                  onChange={(e) =>
                    setEditing({ ...editing, password: e.target.value })
                  }
                  required
                />
              )}
              {editing.id && (
                <input
                  type="password"
                  className="w-full p-2 border dark:border-gray-700 rounded dark:bg-gray-900 dark:text-white"
                  placeholder="New Password (optional)"
                  value={editing.password || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, password: e.target.value })
                  }
                />
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Roles
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto border dark:border-gray-700 p-2 rounded dark:bg-gray-900">
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center dark:text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={editing.roleIds?.includes(role.id)}
                        onChange={(e) => {
                          const ids = editing.roleIds || [];
                          if (e.target.checked) {
                            setEditing({
                              ...editing,
                              roleIds: [...ids, role.id],
                            });
                          } else {
                            setEditing({
                              ...editing,
                              roleIds: ids.filter(
                                (id: number) => id !== role.id
                              ),
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      {role.name}
                    </label>
                  ))}
                </div>
              </div>
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
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Roles
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-6 py-4 dark:text-gray-300">
                  {user.username}
                </td>
                <td className="px-6 py-4">
                  {user.roles.map((r) => (
                    <span
                      key={r.id}
                      className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded mr-1"
                    >
                      {r.name}
                    </span>
                  ))}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {hasPermission("manage:users") && (
                    <>
                      <button
                        onClick={() =>
                          setEditing({
                            ...user,
                            roleIds: user.roles.map((r) => r.id),
                          })
                        }
                        className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
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

export default UsersPage;
