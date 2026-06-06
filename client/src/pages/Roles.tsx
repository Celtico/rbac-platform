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
import { useTheme } from "../context/ThemeContext";

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
  const { mode } = useTheme();
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
      toaster.create({ type: "error", title: "Error carregant rols" });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/roles/${deleteTarget.id}`);
      toaster.create({ type: "success", title: `"${deleteTarget.name}" eliminat` });
      fetchData();
    } catch {
      toaster.create({ type: "error", title: "Error eliminant el rol" });
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
        toaster.create({ type: "success", title: "Rol actualitzat" });
      } else {
        await api.post("/roles", payload);
        toaster.create({ type: "success", title: "Rol creat" });
      }
      setEditing(null);
      fetchData();
    } catch {
      toaster.create({ type: "error", title: "Error desant el rol" });
    } finally {
      setSaving(false);
    }
  };

  const headerBg = mode === "light" ? "gray.50" : "gray.800";
  const borderColor = mode === "light" ? "gray.200" : "gray.700";

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="8" wrap="wrap" gap="4">
        <HStack gap="3">
          <Heading size="xl">Gestió de Rols</Heading>
          <Badge colorPalette="purple" variant="subtle" borderRadius="full" px="2">
            {roles.length}
          </Badge>
        </HStack>
        {hasPermission("manage:roles") && (
          <Button
            colorPalette="purple"
            onClick={() => setEditing({ name: "", permissionIds: [] })}
            size="sm"
          >
            <Plus size={16} />
            <Box as="span" display={{ base: "none", sm: "inline" }} ml="2">
              Nou Rol
            </Box>
          </Button>
        )}
      </Flex>

      <Box
        bg="bg.panel"
        rounded="xl"
        shadow="sm"
        overflowX="auto"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row bg={headerBg}>
              <Table.ColumnHeader
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wide"
                color="fg.muted"
                fontWeight="semibold"
                py="3"
                w="12"
                pl="4"
              >
                #
              </Table.ColumnHeader>
              <Table.ColumnHeader
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wide"
                color="fg.muted"
                fontWeight="semibold"
                py="3"
              >
                Nom del Rol
              </Table.ColumnHeader>
              <Table.ColumnHeader
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wide"
                color="fg.muted"
                fontWeight="semibold"
                py="3"
              >
                Permisos
              </Table.ColumnHeader>
              <Table.ColumnHeader
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wide"
                color="fg.muted"
                fontWeight="semibold"
                py="3"
                textAlign="right"
                pr="4"
              >
                Accions
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {roles.map((role) => (
              <Table.Row
                key={role.id}
                _hover={{ bg: mode === "light" ? "gray.50" : "gray.700/40" }}
                transition="background 0.15s"
              >
                <Table.Cell pl="4" color="fg.muted" fontSize="xs" w="12">
                  {role.id}
                </Table.Cell>
                <Table.Cell py="3">
                  <HStack gap="2">
                    <Shield size={14} color="#9333ea" />
                    <Text fontWeight="semibold" fontSize="sm">{role.name}</Text>
                  </HStack>
                </Table.Cell>
                <Table.Cell py="3">
                  <Flex gap="1.5" flexWrap="wrap">
                    {role.permissions.map((p) => (
                      <Badge
                        key={p.id}
                        colorPalette="purple"
                        variant="outline"
                        size="sm"
                        fontFamily="mono"
                        fontSize="xs"
                      >
                        {p.name}
                      </Badge>
                    ))}
                    {role.permissions.length === 0 && (
                      <Text fontSize="xs" color="fg.muted">Sense permisos</Text>
                    )}
                  </Flex>
                </Table.Cell>
                <Table.Cell textAlign="right" pr="4" py="3">
                  {hasPermission("manage:roles") && (
                    <HStack gap="1" justify="flex-end">
                      <IconButton
                        aria-label="Editar rol"
                        variant="ghost"
                        colorPalette="blue"
                        size="xs"
                        onClick={() =>
                          setEditing({
                            ...role,
                            permissionIds: role.permissions.map((p) => p.id),
                          })
                        }
                      >
                        <Edit2 size={13} />
                      </IconButton>
                      <IconButton
                        aria-label="Eliminar rol"
                        variant="ghost"
                        colorPalette="red"
                        size="xs"
                        onClick={() => setDeleteTarget(role)}
                      >
                        <Trash2 size={13} />
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
              <EmptyState.Title>Cap rol</EmptyState.Title>
              <EmptyState.Description>
                Crea el primer rol per gestionar els permisos.
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
              <Dialog.Title>{editing?.id ? "Editar" : "Nou"} Rol</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <form id="role-form" onSubmit={handleSubmit}>
                <VStack gap="4" align="stretch">
                  <Field.Root>
                    <Field.Label>Nom del Rol</Field.Label>
                    <Input
                      placeholder="Nom del rol"
                      value={editing?.name || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, name: e.target.value })
                      }
                      required
                    />
                  </Field.Root>

                  <Box>
                    <Text fontWeight="medium" mb="2" fontSize="sm">
                      Permisos
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
                          <Checkbox.Label fontSize="sm" fontFamily="mono">{perm.name}</Checkbox.Label>
                        </Checkbox.Root>
                      ))}
                    </Stack>
                  </Box>
                </VStack>
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel·lar
              </Button>
              <Button
                type="submit"
                form="role-form"
                colorPalette="purple"
                loading={saving}
              >
                Desar
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
              <Dialog.Title>Eliminar Rol</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              Segur que vols eliminar el rol{" "}
              <strong>{deleteTarget?.name}</strong>? Aquesta acció no es pot desfer.
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel·lar
              </Button>
              <Button colorPalette="red" onClick={handleDelete} ml="2">
                Eliminar
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};

export default RolesPage;
