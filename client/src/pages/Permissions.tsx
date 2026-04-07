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
  Table,
  Portal,
  Field,
  VStack,
  HStack,
} from "@chakra-ui/react";

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
    <Box>
      <Flex justify="space-between" align="center" mb="6">
        <Heading size="lg">Permissions Management</Heading>
        {hasPermission("manage:roles") && (
          <Button colorPalette="green" onClick={() => setEditing({ name: "" })}>
            <Plus size={16} style={{ marginRight: "8px" }} /> Add Permission
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
                {editing.id ? "Edit" : "Add"} Permission
              </Heading>
              <VStack gap="4" align="stretch">
                <Field.Root>
                  <Field.Label>Permission Name</Field.Label>
                  <Input
                    placeholder="Permission Name (e.g. read:albums)"
                    value={editing.name || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                    required
                  />
                </Field.Root>
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
                        onClick={() => handleDelete(perm.id)}
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

export default PermissionsPage;
