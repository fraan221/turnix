"use client";

import * as React from "react";
import { Plus, Trash2, Tag, HelpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteCashflowCategory, createCashflowCategory } from "@/actions/cashflow.actions";

interface Category {
  id: string;
  name: string;
}

interface CategoryManagerProps {
  categories: Category[];
  onRefresh: () => void;
}

export default function CategoryManager({
  categories,
  onRefresh,
}: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const [deletePendingId, setDeletePendingId] = React.useState<string | null>(null);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || isPending) return;

    startTransition(async () => {
      const res = await createCashflowCategory({ name: newCategoryName });
      if (res.success) {
        toast.success(res.success);
        setNewCategoryName("");
        onRefresh();
      } else {
        toast.error(res.error || "No se pudo crear la categoría.");
      }
    });
  };

  const handleDeleteCategory = async (id: string) => {
    if (deletePendingId) return;
    setDeletePendingId(id);

    try {
      const res = await deleteCashflowCategory(id);
      if (res.success) {
        toast.success(res.success);
        onRefresh();
      } else {
        toast.error(res.error || "No se pudo eliminar la categoría.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al intentar eliminar la categoría.");
    } finally {
      setDeletePendingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* CREAR CATEGORIA */}
      <Card className="md:col-span-1 h-fit">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <span>Crear Categoría</span>
          </CardTitle>
          <CardDescription>
            Agregá categorías personalizadas para clasificar tus movimientos de caja.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nombre de Categoría</Label>
              <Input
                id="category-name"
                placeholder="Ej. Artículos de barbería, Café, Publicidad"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={isPending}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isPending || !newCategoryName.trim()}
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Crear Categoría
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* LISTADO DE CATEGORIAS */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            <span>Categorías Activas</span>
          </CardTitle>
          <CardDescription>
            Listado de categorías disponibles. Solo podés eliminar aquellas que no tengan movimientos asociados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-lg">
              <HelpCircle className="w-8 h-8 text-muted-foreground mb-2" />
              <h4 className="font-medium text-muted-foreground">No hay categorías</h4>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/10 transition-colors"
                >
                  <span className="font-medium text-sm flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    {cat.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteCategory(cat.id)}
                    disabled={deletePendingId === cat.id}
                  >
                    {deletePendingId === cat.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
