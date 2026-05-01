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
import { useTheme } from "../context/ThemeContext";

interface User {
  id: number;
  username: string;
  roles: { id: number; name: string }[];
}

interface Role {
  id: number;
  name: string;
}

function UserAvatar({ username }: { username: string }) {
  const initials = username.slice(0, 2).toUpperCase();
  const colors = ["purple", "blue", "teal", "green", "orange", "pink"];
  const color = colors[username.charCodeAt(0) % colors.length];
  return (
    <Flex
      w="7"
      h="7"
      rounded="full"
      bg={`${color}.100`}
      color={`${color}.700`}
      align="center"
      justify="center"
      fontSize="xs"
      fontWeight="bold"
      flexShrink={0}
    >
      {initials}
    </Flex>
  );
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const { hasPermission } = useAuth();
  const { mode } = useTheme();
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
      toaster.create({ type: "error", title: "Error carregant usuaris" });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      toaster.create({ type: "success", title: `"${deleteTarget.username}" eliminat` });
      fetchData();
    } catch {
      toaster.create({ type: "error", title: "Error eliminant l'usuari" });
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
        toaster.create({ type: "success", title: "Usuari actualitzat" });
      } else {
        await api.post("/users", payload);
        toaster.create({ type: "success", title: "Usuari creat" });
      }
      setEditing(null);
      fetchData();
    } catch {
      toaster.create({ type: "error", title: "Error desant l'usuari" });
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
          <Heading size="xl">Gestió d'Usuaris</Heading>
          <Badge colorPalette="purple" variant="subtle" borderRadius="full" px="2">
            {users.length}
          </Badge>
        </HStack>
        {hasPermission("manage:users") && (
          <Button
            colorPalette="purple"
            onClick={() => setEditing({ username: "", password: "", roleIds: [] })}
            size="sm"
          >
            <Plus size={16} />
            <Box as="span" display={{ base: "none", sm: "inline" }} ml="2">
              Nou Usuari
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
                Usuari
              </Table.ColumnHeader>
              <Table.ColumnHeader
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wide"
                color="fg.muted"
                fontWeight="semibold"
                py="3"
              >
                Rols
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
            {users.map((u) => (
              <Table.Row
                key={u.id}
                _hover={{ bg: mode === "light" ? "gray.50" : "gray.700/40" }}
                transition="background 0.15s"
              >
                <Table.Cell pl="4" color="fg.muted" fontSize="xs" w="12">
                  {u.id}
                </Table.Cell>
                <Table.Cell py="3">
                  <HStack gap="2.5">
                    <UserAvatar username={u.username} />
                    <Text fontWeight="medium" fontSize="sm">{u.username}</Text>
                  </HStack>
                </Table.Cell>
                <Table.Cell py="3">
                  <Flex gap="1.5" flexWrap="wrap">
                    {u.roles.map((r) => (
                      <Badge key={r.id} colorPalette="purple" variant="subtle" size="sm">
                        {r.name}
                      </Badge>
                    ))}
                    {u.roles.length === 0 && (
                      <Text fontSize="xs" color="fg.muted">Sense rols</Text>
                    )}
                  </Flex>
                </Table.Cell>
                <Table.Cell textAlign="right" pr="4" py="3">
                  {hasPermission("manage:users") && (
                    <HStack gap="1" justify="flex-end">
                      <IconButton
                        aria-label="Editar usuari"
                        variant="ghost"
                        colorPalette="blue"
                        size="xs"
                        onClick={() =>
                          setEditing({ ...u, roleIds: u.roles.map((r: any) => r.id) })
                        }
                      >
                        <Edit2 size={13} />
                      </IconButton>
                      <IconButton
                        aria-label="Eliminar usuari"
                        variant="ghost"
                        colorPalette="red"
                        size="xs"
                        onClick={() => setDeleteTarget(u)}
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
        {users.length === 0 && (
          <EmptyState.Root py="12">
            <EmptyState.Content>
              <EmptyState.Indicator>
                <UsersIcon size={32} />
              </EmptyState.Indicator>
              <EmptyState.Title>Cap usuari</EmptyState.Title>
              <EmptyState.Description>
                Afegeix el primer usuari per començar.
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
              <Dialog.Title>{editing?.id ? "Editar" : "Nou"} Usuari</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <form id="user-form" onSubmit={handleSubmit}>
                <VStack gap="4" align="stretch">
                  <Field.Root>
                    <Field.Label>Nom d'usuari</Field.Label>
                    <Input
                      placeholder="Nom d'usuari"
                      value={editing?.username || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, username: e.target.value })
                      }
                      required
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>
                      {editing?.id ? "Nova contrasenya (opcional)" : "Contrasenya"}
                    </Field.Label>
                    <Input
                      type="password"
                      placeholder={
                        editing?.id ? "Deixa buit per mantenir l'actual" : "Contrasenya"
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
                      Rols
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
                Cancel·lar
              </Button>
              <Button
                type="submit"
                form="user-form"
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
              <Dialog.Title>Eliminar Usuari</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              Segur que vols eliminar l'usuari{" "}
              <strong>{deleteTarget?.username}</strong>? Aquesta acció no es pot desfer.
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

export default UsersPage;
