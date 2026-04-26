import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext.ts";
import { Plus, Edit2, Trash2, Key } from "lucide-react";
import {
  Box,
  Button,
  Dialog,
  EmptyState,
  Flex,
  Heading,
  IconButton,
  Input,
  Table,
  Field,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { toaster } from "../components/ui/toaster";

interface Permission {
  id: number;
  name: string;
}

const PermissionsPage: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const { hasPermission } = useAuth();
  const [editing, setEditing] = useState<Partial<Permission> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPermissions = async () => {
    try {
      const res = await api.get("/permissions");
      setPermissions(res.data);
    } catch (err) {
      console.error(err);
      toaster.create({ type: "error", title: "Failed to load permissions" });
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/permissions/${deleteTarget.id}`);
      toaster.create({ type: "success", title: `"${deleteTarget.name}" deleted` });
      fetchPermissions();
    } catch {
      toaster.create({ type: "error", title: "Failed to delete permission" });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing?.id) {
        await api.patch(`/permissions/${editing.id}`, editing);
        toaster.create({ type: "success", title: "Permission updated" });
      } else {
        await api.post("/permissions", editing);
        toaster.create({ type: "success", title: "Permission created" });
      }
      setEditing(null);
      fetchPermissions();
    } catch {
      toaster.create({ type: "error", title: "Failed to save permission" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="6" wrap="wrap" gap="4">
        <Heading size="lg">Permissions Management</Heading>
        {hasPermission("manage:roles") && (
          <Button
            colorPalette="green"
            onClick={() => setEditing({ name: "" })}
            size="sm"
          >
            <Plus size={16} />
            <Box as="span" display={{ base: "none", sm: "inline" }} ml="2">
              Add Permission
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
              <Table.ColumnHeader>Permission Name</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {permissions.map((perm) => (
              <Table.Row key={perm.id} _hover={{ bg: "bg.muted/50" }}>
                <Table.Cell fontWeight="medium">{perm.name}</Table.Cell>
                <Table.Cell textAlign="right">
                  {hasPermission("manage:roles") && (
                    <HStack gap="2" justify="flex-end">
                      <IconButton
                        aria-label="Edit permission"
                        variant="ghost"
                        colorPalette="blue"
                        size="sm"
                        onClick={() => setEditing(perm)}
                      >
                        <Edit2 size={14} />
                      </IconButton>
                      <IconButton
                        aria-label="Delete permission"
                        variant="ghost"
                        colorPalette="red"
                        size="sm"
                        onClick={() => setDeleteTarget(perm)}
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
        {permissions.length === 0 && (
          <EmptyState.Root py="12">
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Key size={32} />
              </EmptyState.Indicator>
              <EmptyState.Title>No permissions yet</EmptyState.Title>
              <EmptyState.Description>
                Add your first permission to start controlling access.
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
              <Dialog.Title>
                {editing?.id ? "Edit" : "Add"} Permission
              </Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <form id="permission-form" onSubmit={handleSubmit}>
                <VStack gap="4" align="stretch">
                  <Field.Root>
                    <Field.Label>Permission Name</Field.Label>
                    <Input
                      placeholder="Permission Name (e.g. read:albums)"
                      value={editing?.name || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, name: e.target.value })
                      }
                      required
                    />
                  </Field.Root>
                </VStack>
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="permission-form"
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
              <Dialog.Title>Delete Permission</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? Roles using this permission
              will lose access.
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

export default PermissionsPage;
