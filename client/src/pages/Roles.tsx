import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext.ts";
import { Plus, Edit2, Trash2, Shield } from "lucide-react";
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
  Field,
  Checkbox,
  VStack,
  HStack,
  Text,
} from "@chakra-ui/react";
import { toaster } from "../components/ui/toaster";

interface Role {
  id: number;
  name: string;
  permissions: { id: number; name: string }[];
}

interface Permission {
  id: number;
  name: string;
}

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const { hasPermission } = useAuth();
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [rRes, pRes] = await Promise.all([
        api.get("/roles"),
        api.get("/permissions"),
      ]);
      setRoles(rRes.data);
      setPermissions(pRes.data);
    } catch (err) {
      console.error("Error fetching roles/permissions:", err);
      toaster.create({ type: "error", title: "Failed to load roles" });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/roles/${deleteTarget.id}`);
      toaster.create({ type: "success", title: `"${deleteTarget.name}" deleted` });
      fetchData();
    } catch {
      toaster.create({ type: "error", title: "Failed to delete role" });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: editing.name,
      permissionIds: editing.permissionIds || [],
    };

    try {
      if (editing.id) {
        await api.patch(`/roles/${editing.id}`, payload);
        toaster.create({ type: "success", title: "Role updated" });
      } else {
        await api.post("/roles", payload);
        toaster.create({ type: "success", title: "Role created" });
      }
      setEditing(null);
      fetchData();
    } catch {
      toaster.create({ type: "error", title: "Failed to save role" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="6" wrap="wrap" gap="4">
        <Heading size="lg">Roles Management</Heading>
        {hasPermission("manage:roles") && (
          <Button
            colorPalette="green"
            onClick={() => setEditing({ name: "", permissionIds: [] })}
            size="sm"
          >
            <Plus size={16} />
            <Box as="span" display={{ base: "none", sm: "inline" }} ml="2">
              Add Role
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
              <Table.ColumnHeader>Role Name</Table.ColumnHeader>
              <Table.ColumnHeader>Permissions</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {roles.map((role) => (
              <Table.Row key={role.id} _hover={{ bg: "bg.muted/50" }}>
                <Table.Cell fontWeight="medium">{role.name}</Table.Cell>
                <Table.Cell>
                  <Flex gap="1" flexWrap="wrap">
                    {role.permissions.map((p) => (
                      <Badge key={p.id} colorPalette="purple" variant="subtle">
                        {p.name}
                      </Badge>
                    ))}
                  </Flex>
                </Table.Cell>
                <Table.Cell textAlign="right">
                  {hasPermission("manage:roles") && (
                    <HStack gap="2" justify="flex-end">
                      <IconButton
                        aria-label="Edit role"
                        variant="ghost"
                        colorPalette="blue"
                        size="sm"
                        onClick={() =>
                          setEditing({
                            ...role,
                            permissionIds: role.permissions.map((p) => p.id),
                          })
                        }
                      >
                        <Edit2 size={14} />
                      </IconButton>
                      <IconButton
                        aria-label="Delete role"
                        variant="ghost"
                        colorPalette="red"
                        size="sm"
                        onClick={() => setDeleteTarget(role)}
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
        {roles.length === 0 && (
          <EmptyState.Root py="12">
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Shield size={32} />
              </EmptyState.Indicator>
              <EmptyState.Title>No roles yet</EmptyState.Title>
              <EmptyState.Description>
                Create your first role to manage permissions.
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
              <Dialog.Title>{editing?.id ? "Edit" : "Add"} Role</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <form id="role-form" onSubmit={handleSubmit}>
                <VStack gap="4" align="stretch">
                  <Field.Root>
                    <Field.Label>Role Name</Field.Label>
                    <Input
                      placeholder="Role Name"
                      value={editing?.name || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, name: e.target.value })
                      }
                      required
                    />
                  </Field.Root>

                  <Box>
                    <Text fontWeight="medium" mb="2" fontSize="sm">
                      Permissions
                    </Text>
                    <Stack
                      gap="2"
                      maxH="48"
                      overflowY="auto"
                      p="2"
                      borderWidth="1px"
                      rounded="md"
                    >
                      {permissions.map((perm) => (
                        <Checkbox.Root
                          key={perm.id}
                          checked={editing?.permissionIds?.includes(perm.id)}
                          onCheckedChange={(details) => {
                            const ids = editing?.permissionIds || [];
                            if (details.checked) {
                              setEditing({ ...editing, permissionIds: [...ids, perm.id] });
                            } else {
                              setEditing({
                                ...editing,
                                permissionIds: ids.filter((id: number) => id !== perm.id),
                              });
                            }
                          }}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          <Checkbox.Label fontSize="sm">{perm.name}</Checkbox.Label>
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
                form="role-form"
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
              <Dialog.Title>Delete Role</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              Are you sure you want to delete role{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
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

export default RolesPage;
