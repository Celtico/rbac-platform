import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { Plus, Edit2, Trash2 } from "lucide-react";
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Input,
  Stack,
  Table,
  Badge,
  Portal,
  HStack,
  Field,
  Text,
  Checkbox,
  VStack,
} from "@chakra-ui/react";

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
    <Box>
      <Flex justify="space-between" align="center" mb="6">
        <Heading size="lg">Users Management</Heading>
        {hasPermission("manage:users") && (
          <Button
            colorPalette="green"
            onClick={() =>
              setEditing({ username: "", password: "", roleIds: [] })
            }
          >
            <Plus size={16} style={{ marginRight: "8px" }} /> Add User
          </Button>
        )}
      </Flex>

      {editing && (
        <Portal>
          <Box
            position="fixed"
            top="0"
            left="0"
            w="full"
            h="full"
            bg="blackAlpha.600"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p="4"
            zIndex="1000"
          >
            <Box
              as="form"
              onSubmit={handleSubmit}
              bg="bg.panel"
              p="6"
              rounded="md"
              shadow="lg"
              w="full"
              maxW="md"
            >
              <Heading size="md" mb="4">
                {editing.id ? "Edit" : "Add"} User
              </Heading>
              <VStack gap="4" align="stretch">
                <Field.Root>
                  <Field.Label>Username</Field.Label>
                  <Input
                    placeholder="Username"
                    value={editing.username}
                    onChange={(e) =>
                      setEditing({ ...editing, username: e.target.value })
                    }
                    required
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>
                    {editing.id ? "New Password (optional)" : "Password"}
                  </Field.Label>
                  <Input
                    type="password"
                    placeholder={
                      editing.id ? "Leave blank to keep current" : "Password"
                    }
                    value={editing.password || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, password: e.target.value })
                    }
                    required={!editing.id}
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
                        checked={editing.roleIds?.includes(role.id)}
                        onCheckedChange={(details) => {
                          const ids = editing.roleIds || [];
                          if (details.checked) {
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
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Label fontSize="sm">
                          {role.name}
                        </Checkbox.Label>
                      </Checkbox.Root>
                    ))}
                  </Stack>
                </Box>
              </VStack>

              <Flex justify="flex-end" mt="6" gap="2">
                <Button variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" colorPalette="blue">
                  Save
                </Button>
              </Flex>
            </Box>
          </Box>
        </Portal>
      )}

      <Box
        bg="bg.panel"
        rounded="md"
        shadow="sm"
        overflow="hidden"
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
                        onClick={() => handleDelete(u.id)}
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
      </Box>
    </Box>
  );
};

export default UsersPage;
