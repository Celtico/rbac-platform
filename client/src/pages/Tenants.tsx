import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext.ts";
import { Plus, Edit2, Trash2, Building2 } from "lucide-react";
import {
  Box,
  Button,
  Dialog,
  EmptyState,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Table,
  VStack,
  Field,
  Text,
  Badge,
} from "@chakra-ui/react";
import { toaster } from "../components/ui/toaster";

interface Tenant {
  id: number;
  name: string;
  odooUrl: string;
  odooDb: string;
  odooUser: string;
  createdAt: string;
}

interface TenantForm {
  id?: number;
  name: string;
  odooUrl: string;
  odooDb: string;
  odooUser: string;
  odooPassword: string;
}

const emptyForm = (): TenantForm => ({
  name: "",
  odooUrl: "",
  odooDb: "",
  odooUser: "",
  odooPassword: "",
});

const TenantsPage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const { hasPermission } = useAuth();
  const [editing, setEditing] = useState<TenantForm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get("/tenants");
      setTenants(res.data);
    } catch {
      toaster.create({ type: "error", title: "Error carregant tenants" });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const payload: Record<string, string> = {
      name: editing.name,
      odooUrl: editing.odooUrl,
      odooDb: editing.odooDb,
      odooUser: editing.odooUser,
    };
    if (editing.odooPassword) payload.odooPassword = editing.odooPassword;

    try {
      if (editing.id) {
        await api.patch(`/tenants/${editing.id}`, payload);
        toaster.create({ type: "success", title: "Tenant actualitzat" });
      } else {
        await api.post("/tenants", payload);
        toaster.create({ type: "success", title: "Tenant creat" });
      }
      setEditing(null);
      fetchData();
    } catch {
      toaster.create({ type: "error", title: "Error desant tenant" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/tenants/${deleteTarget.id}`);
      toaster.create({ type: "success", title: `"${deleteTarget.name}" eliminat` });
      fetchData();
    } catch {
      toaster.create({ type: "error", title: "Error eliminant tenant" });
    } finally {
      setDeleteTarget(null);
    }
  };

  const canManage = hasPermission("manage:tenants");

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="6" wrap="wrap" gap="4">
        <Heading size="lg">Tenants</Heading>
        {canManage && (
          <Button colorPalette="green" onClick={() => setEditing(emptyForm())} size="sm">
            <Plus size={16} />
            <Box as="span" display={{ base: "none", sm: "inline" }} ml="2">
              Nou Tenant
            </Box>
          </Button>
        )}
      </Flex>

      <Box bg="bg.panel" rounded="md" shadow="sm" overflowX="auto" borderWidth="1px">
        <Table.Root>
          <Table.Header bg="bg.muted">
            <Table.Row>
              <Table.ColumnHeader>Nom</Table.ColumnHeader>
              <Table.ColumnHeader>URL Odoo</Table.ColumnHeader>
              <Table.ColumnHeader>Base de dades</Table.ColumnHeader>
              <Table.ColumnHeader>Usuari</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Accions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {tenants.map((t) => (
              <Table.Row key={t.id} _hover={{ bg: "bg.muted/50" }}>
                <Table.Cell fontWeight="medium">
                  <HStack gap="2">
                    <Building2 size={16} />
                    <Text>{t.name}</Text>
                  </HStack>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="subtle" colorPalette="blue" fontSize="xs">
                    {t.odooUrl}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{t.odooDb}</Table.Cell>
                <Table.Cell>{t.odooUser}</Table.Cell>
                <Table.Cell textAlign="right">
                  {canManage && (
                    <HStack gap="2" justify="flex-end">
                      <IconButton
                        aria-label="Editar tenant"
                        variant="ghost"
                        colorPalette="blue"
                        size="sm"
                        onClick={() =>
                          setEditing({
                            id: t.id,
                            name: t.name,
                            odooUrl: t.odooUrl,
                            odooDb: t.odooDb,
                            odooUser: t.odooUser,
                            odooPassword: "",
                          })
                        }
                      >
                        <Edit2 size={14} />
                      </IconButton>
                      <IconButton
                        aria-label="Eliminar tenant"
                        variant="ghost"
                        colorPalette="red"
                        size="sm"
                        onClick={() => setDeleteTarget(t)}
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
        {tenants.length === 0 && (
          <EmptyState.Root py="12">
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Building2 size={32} />
              </EmptyState.Indicator>
              <EmptyState.Title>Cap tenant</EmptyState.Title>
              <EmptyState.Description>
                Crea el primer tenant per connectar Odoo.
              </EmptyState.Description>
            </EmptyState.Content>
          </EmptyState.Root>
        )}
      </Box>

      {/* Create / Edit modal */}
      <Dialog.Root open={!!editing} onOpenChange={({ open }) => { if (!open) setEditing(null); }}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{editing?.id ? "Editar" : "Nou"} Tenant</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <form id="tenant-form" onSubmit={handleSubmit}>
                <VStack gap="4" align="stretch">
                  <Field.Root>
                    <Field.Label>Nom</Field.Label>
                    <Input
                      placeholder="Acme Corp"
                      value={editing?.name ?? ""}
                      onChange={(e) => setEditing((p) => p && { ...p, name: e.target.value })}
                      required
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>URL d'Odoo</Field.Label>
                    <Input
                      placeholder="http://localhost:8069"
                      value={editing?.odooUrl ?? ""}
                      onChange={(e) => setEditing((p) => p && { ...p, odooUrl: e.target.value })}
                      required
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Base de dades</Field.Label>
                    <Input
                      placeholder="odoo_demo"
                      value={editing?.odooDb ?? ""}
                      onChange={(e) => setEditing((p) => p && { ...p, odooDb: e.target.value })}
                      required
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Usuari Odoo</Field.Label>
                    <Input
                      placeholder="admin"
                      value={editing?.odooUser ?? ""}
                      onChange={(e) => setEditing((p) => p && { ...p, odooUser: e.target.value })}
                      required
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>
                      {editing?.id ? "Contrasenya (deixa buit per no canviar)" : "Contrasenya"}
                    </Field.Label>
                    <Input
                      type="password"
                      placeholder={editing?.id ? "••••••••" : "admin"}
                      value={editing?.odooPassword ?? ""}
                      onChange={(e) => setEditing((p) => p && { ...p, odooPassword: e.target.value })}
                      required={!editing?.id}
                    />
                  </Field.Root>
                </VStack>
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel·lar
              </Button>
              <Button type="submit" form="tenant-form" colorPalette="blue" loading={saving}>
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
              <Dialog.Title>Eliminar Tenant</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              Segur que vols eliminar el tenant{" "}
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

export default TenantsPage;
