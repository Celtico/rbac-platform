import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext.ts";
import { Plus, Edit2, Trash2, Users as UsersIcon } from "lucide-react";
import {
  Box,
  Button,
  Dialog,
  EmptyState,
  Flex,
  Heading,
  IconButton,
  Input,
  Stack,
  Table,
  Badge,
  HStack,
  Field,
  Text,
  Checkbox,
  VStack,
} from "@chakra-ui/react";
import { toaster } from "../components/ui/toaster";

interface User {
  id: number;
  username: string;
  roles: { id: number; name: string }[];
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
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

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
      toaster.create({ type: "error", title: "Failed to load users" });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      toaster.create({ type: "success", title: `"${deleteTarget.username}" deleted` });
      fetchData();
    } catch {
      toaster.create({ type: "error", title: "Failed to delete user" });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      username: editing.username,
      roleIds: editing.roleIds || [],
    };
    if (editing.password) (payload as any).password = editing.password;

    try {
      if (editing.id) {
        await api.patch(`/users/${editing.id}`, payload);
        toaster.create({ type: "success", title: "User updated" });
      } else {
        await api.post("/users", payload);
        toaster.create({ type: "success", title: "User created" });
      }
      setEditing(null);
      fetchData();
    } catch {
      toaster.create({ type: "error", title: "Failed to save user" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="6" wrap="wrap" gap="4">
        <Heading size="lg">Users Management</Heading>
        {hasPermission("manage:users") && (
          <Button
            colorPalette="green"
            onClick={() =>
              setEditing({ username: "", password: "", roleIds: [] })
            }
            size="sm"
          >
            <Plus size={16} />
            <Box as="span" display={{ base: "none", sm: "inline" }} ml="2">
              Add User
            </Box>
          </Button>
        )}
      </Flex>

      <Box
        bg="bg.panel"
        rounded="md"
        shadow="sm"
        overflowX="auto"
        borderWidth="1px"
      >
        <Table.Root>
          <Table.Header bg="bg.muted">
            <Table.Row>
              <Table.ColumnHeader>Username</Table.ColumnHeader>
              <Table.ColumnHeader>Roles</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {users.map((u) => (
              <Table.Row key={u.id} _hover={{ bg: "bg.muted/50" }}>
                <Table.Cell fontWeight="medium">{u.username}</Table.Cell>
                <Table.Cell>
                  <Flex gap="1" flexWrap="wrap">
                    {u.roles.map((r) => (
                      <Badge key={r.id} colorPalette="blue" variant="subtle">
                        {r.name}
                      </Badge>
                    ))}
                  </Flex>
                </Table.Cell>
                <Table.Cell textAlign="right">
                  {hasPermission("manage:users") && (
                    <HStack gap="2" justify="flex-end">
                      <IconButton
                        aria-label="Edit user"
                        variant="ghost"
                        colorPalette="blue"
                        size="sm"
                        onClick={() =>
                          setEditing({
                            ...u,
                            roleIds: u.roles.map((r: any) => r.id),
                          })
                        }
                      >
                        <Edit2 size={14} />
                      </IconButton>
                      <IconButton
                        aria-label="Delete user"
                        variant="ghost"
                        colorPalette="red"
                        size="sm"
                        onClick={() => setDeleteTarget(u)}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </HStack>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
        {users.length === 0 && (
          <EmptyState.Root py="12">
            <EmptyState.Content>
              <EmptyState.Indicator>
                <UsersIcon size={32} />
              </EmptyState.Indicator>
              <EmptyState.Title>No users yet</EmptyState.Title>
              <EmptyState.Description>
                Add your first user to get started.
              </EmptyState.Description>
            </EmptyState.Content>
          </EmptyState.Root>
        )}
      </Box>

      {/* Edit / Create modal */}
      <Dialog.Root
        open={!!editing}
        onOpenChange={({ open }) => { if (!open) setEditing(null); }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{editing?.id ? "Edit" : "Add"} User</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <form id="user-form" onSubmit={handleSubmit}>
                <VStack gap="4" align="stretch">
                  <Field.Root>
                    <Field.Label>Username</Field.Label>
                    <Input
                      placeholder="Username"
                      value={editing?.username || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, username: e.target.value })
                      }
                      required
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>
                      {editing?.id ? "New Password (optional)" : "Password"}
                    </Field.Label>
                    <Input
                      type="password"
                      placeholder={
                        editing?.id ? "Leave blank to keep current" : "Password"
                      }
                      value={editing?.password || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, password: e.target.value })
                      }
                      required={!editing?.id}
                    />
                  </Field.Root>

                  <Box>
                    <Text fontWeight="medium" mb="2" fontSize="sm">
                      Roles
                    </Text>
                    <Stack
                      gap="2"
                      maxH="40"
                      overflowY="auto"
                      p="2"
                      borderWidth="1px"
                      rounded="md"
                    >
                      {roles.map((role) => (
                        <Checkbox.Root
                          key={role.id}
                          checked={editing?.roleIds?.includes(role.id)}
                          onCheckedChange={(details) => {
                            const ids = editing?.roleIds || [];
                            if (details.checked) {
                              setEditing({ ...editing, roleIds: [...ids, role.id] });
                            } else {
                              setEditing({
                                ...editing,
                                roleIds: ids.filter((id: number) => id !== role.id),
                              });
                            }
                          }}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          <Checkbox.Label fontSize="sm">{role.name}</Checkbox.Label>
                        </Checkbox.Root>
                      ))}
                    </Stack>
                  </Box>
                </VStack>
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="user-form"
                colorPalette="blue"
                loading={saving}
              >
                Save
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Delete confirmation */}
      <Dialog.Root
        open={!!deleteTarget}
        onOpenChange={({ open }) => { if (!open) setDeleteTarget(null); }}
        role="alertdialog"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Delete User</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              Are you sure you want to delete user{" "}
              <strong>{deleteTarget?.username}</strong>? This action cannot be undone.
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button colorPalette="red" onClick={handleDelete} ml="2">
                Delete
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};

export default UsersPage;
