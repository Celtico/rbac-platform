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
  Badge,
  Text,
} from "@chakra-ui/react";
import { toaster } from "../components/ui/toaster";
import { useTheme } from "../context/ThemeContext";

interface Permission {
  id: number;
  name: string;
}

function permissionCategory(name: string): { label: string; color: string } {
  if (name.startsWith("manage:")) return { label: "manage", color: "red" };
  if (name.startsWith("read:")) return { label: "read", color: "blue" };
  if (name.startsWith("write:")) return { label: "write", color: "orange" };
  if (name.startsWith("use:")) return { label: "use", color: "green" };
  return { label: "other", color: "gray" };
}

const PermissionsPage: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const { hasPermission } = useAuth();
  const { mode } = useTheme();
  const [editing, setEditing] = useState<Partial<Permission> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPermissions = async () => {
    try {
      const res = await api.get("/permissions");
      setPermissions(res.data);
    } catch (err) {
      console.error(err);
      toaster.create({ type: "error", title: "Error carregant permisos" });
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/permissions/${deleteTarget.id}`);
      toaster.create({ type: "success", title: `"${deleteTarget.name}" eliminat` });
      fetchPermissions();
    } catch {
      toaster.create({ type: "error", title: "Error eliminant el permís" });
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
        toaster.create({ type: "success", title: "Permís actualitzat" });
      } else {
        await api.post("/permissions", editing);
        toaster.create({ type: "success", title: "Permís creat" });
      }
      setEditing(null);
      fetchPermissions();
    } catch {
      toaster.create({ type: "error", title: "Error desant el permís" });
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
          <Heading size="xl">Gestió de Permisos</Heading>
          <Badge colorPalette="purple" variant="subtle" borderRadius="full" px="2">
            {permissions.length}
          </Badge>
        </HStack>
        {hasPermission("manage:roles") && (
          <Button
            colorPalette="purple"
            onClick={() => setEditing({ name: "" })}
            size="sm"
          >
            <Plus size={16} />
            <Box as="span" display={{ base: "none", sm: "inline" }} ml="2">
              Nou Permís
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
                Identificador
              </Table.ColumnHeader>
              <Table.ColumnHeader
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wide"
                color="fg.muted"
                fontWeight="semibold"
                py="3"
              >
                Tipus
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
            {permissions.map((perm) => {
              const cat = permissionCategory(perm.name);
              return (
                <Table.Row
                  key={perm.id}
                  _hover={{ bg: mode === "light" ? "gray.50" : "gray.700/40" }}
                  transition="background 0.15s"
                >
                  <Table.Cell pl="4" color="fg.muted" fontSize="xs" w="12">
                    {perm.id}
                  </Table.Cell>
                  <Table.Cell py="3">
                    <HStack gap="2">
                      <Key size={13} color="#9333ea" />
                      <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
                        {perm.name}
                      </Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell py="3">
                    <Badge colorPalette={cat.color} variant="subtle" size="sm">
                      {cat.label}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell textAlign="right" pr="4" py="3">
                    {hasPermission("manage:roles") && (
                      <HStack gap="1" justify="flex-end">
                        <IconButton
                          aria-label="Editar permís"
                          variant="ghost"
                          colorPalette="blue"
                          size="xs"
                          onClick={() => setEditing(perm)}
                        >
                          <Edit2 size={13} />
                        </IconButton>
                        <IconButton
                          aria-label="Eliminar permís"
                          variant="ghost"
                          colorPalette="red"
                          size="xs"
                          onClick={() => setDeleteTarget(perm)}
                        >
                          <Trash2 size={13} />
                        </IconButton>
                      </HStack>
                    )}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
        {permissions.length === 0 && (
          <EmptyState.Root py="12">
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Key size={32} />
              </EmptyState.Indicator>
              <EmptyState.Title>Cap permís</EmptyState.Title>
              <EmptyState.Description>
                Afegeix el primer permís per controlar l'accés.
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
                {editing?.id ? "Editar" : "Nou"} Permís
              </Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <form id="permission-form" onSubmit={handleSubmit}>
                <VStack gap="4" align="stretch">
                  <Field.Root>
                    <Field.Label>Identificador del Permís</Field.Label>
                    <Input
                      placeholder="p.ex. read:photos"
                      fontFamily="mono"
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
                Cancel·lar
              </Button>
              <Button
                type="submit"
                form="permission-form"
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
              <Dialog.Title>Eliminar Permís</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              Segur que vols eliminar{" "}
              <strong>{deleteTarget?.name}</strong>? Els rols que l'usen perdran l'accés.
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

export default PermissionsPage;
