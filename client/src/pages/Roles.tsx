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
  Field,
  Checkbox,
  VStack,
  HStack,
  Text,
} from "@chakra-ui/react";

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

  const fetchData = async () => {
    try {
      const [rRes, pRes] = await Promise.all([
        api.get("/roles"),
        api.get("/permissions"),
      ]);
      setRoles(rRes.data);
      setPermissions(pRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure?")) return;
    await api.delete(`/roles/${id}`);
    fetchData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: editing.name,
      permissionIds: editing.permissionIds || [],
    };

    if (editing.id) {
      await api.patch(`/roles/${editing.id}`, payload);
    } else {
      await api.post("/roles", payload);
    }
    setEditing(null);
    fetchData();
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="6">
        <Heading size="lg">Roles Management</Heading>
        {hasPermission("manage:roles") && (
          <Button
            colorPalette="green"
            onClick={() => setEditing({ name: "", permissionIds: [] })}
          >
            <Plus size={16} style={{ marginRight: "8px" }} /> Add Role
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
                {editing.id ? "Edit" : "Add"} Role
              </Heading>
              <VStack gap="4" align="stretch">
                <Field.Root>
                  <Field.Label>Role Name</Field.Label>
                  <Input
                    placeholder="Role Name"
                    value={editing.name}
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
                        checked={editing.permissionIds?.includes(perm.id)}
                        onCheckedChange={(details) => {
                          const ids = editing.permissionIds || [];
                          if (details.checked) {
                            setEditing({
                              ...editing,
                              permissionIds: [...ids, perm.id],
                            });
                          } else {
                            setEditing({
                              ...editing,
                              permissionIds: ids.filter(
                                (id: number) => id !== perm.id
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
                          {perm.name}
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
                        onClick={() => handleDelete(role.id)}
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

export default RolesPage;
