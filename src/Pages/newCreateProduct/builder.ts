import {
  ExistingImage,
  ProductCreateDTO,
  ProductDetailDTO,
  RolPrecio,
  TipoProductoInventario,
  UIMedia,
} from "./interfaces/DomainProdPressTypes";

/** Normaliza a string decimal (el server valida regex/positivo) */
export const toDecimal = (v: unknown, fallback = "0"): string => {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s === "" ? fallback : s;
};

const toNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const isFile = (m: UIMedia): m is File => m instanceof File;
export const isExisting = (m: UIMedia): m is ExistingImage =>
  !!(m as ExistingImage).url && !(m instanceof File);

/**
 * Builder de FormData para crear/editar producto (+presentaciones).
 * - Adjunta archivos nuevos SIEMPRE (producto y presentaciones).
 * - En edición, solo envía keep* cuando hay intención clara (no manda [] si había originales).
 */
/**
 * Builder de FormData para crear/editar producto.
 *
 * Ya NO envía:
 * - presentaciones
 * - tipoPresentacionId
 * - imágenes de presentaciones
 * - deletedPresentationIds
 * - keepPresentationImageIds
 *
 * Sí envía:
 * - tipoInventario
 * - visibleEnPos
 */
export function buildFormData(
  form: ProductCreateDTO,
  creadoPorId: number,
  opts?: { isEditing?: boolean; original?: ProductDetailDTO },
): FormData {
  const isEditing = !!opts?.isEditing;
  const original = opts?.original;

  const fd = new FormData();

  const tipoInventario =
    form.basicInfo.tipoInventario ?? TipoProductoInventario.PRODUCTO_VENTA;

  const visibleEnPos =
    tipoInventario === TipoProductoInventario.PRODUCTO_VENTA
      ? Boolean(form.basicInfo.visibleEnPos)
      : false;

  // ===== Campos planos del producto =====
  fd.append("nombre", form.basicInfo.nombre);
  fd.append("descripcion", form.description ?? "");
  fd.append("codigoProducto", form.basicInfo.codigoProducto);
  fd.append("codigoProveedor", form.basicInfo.codigoProveedor ?? "");
  fd.append("stockMinimo", String(form.basicInfo.stockMinimo ?? 0));

  fd.append(
    "precioCostoActual",
    toDecimal(form.basicInfo.precioCostoActual, "0"),
  );

  fd.append("creadoPorId", String(creadoPorId));

  // ===== NUEVO: clasificación inventario / POS =====
  fd.append("tipoInventario", tipoInventario);
  fd.append("visibleEnPos", String(visibleEnPos));

  // ===== Categorías =====
  fd.append(
    "categorias",
    JSON.stringify((form.basicInfo.categorias ?? []).map((c) => c.id)),
  );

  // ===== Precios del producto =====
  fd.append(
    "precioVenta",
    JSON.stringify(
      (form.prices ?? []).map((p) => ({
        rol: p.rol as RolPrecio,
        orden: Number(p.orden) || 1,
        precio: toDecimal(p.precio, "0"),
      })),
    ),
  );

  // ===== Imágenes nuevas del producto =====
  (form.images ?? [])
    .filter(isFile)
    .forEach((file) => fd.append("images", file));

  // ===== Extras de edición: mantener imágenes existentes =====
  if (isEditing && original) {
    const keepProductImageIds = (form.images ?? [])
      .filter(isExisting)
      .map((img) => toNum((img as ExistingImage).id))
      .filter((id): id is number => id !== null);

    const originalProductImageIds = (original.imagenesProducto ?? [])
      .map((img) => toNum(img.id))
      .filter((id): id is number => id !== null);

    const hadOriginalImages = originalProductImageIds.length > 0;
    const hasExplicitKeeps = keepProductImageIds.length > 0;

    /**
     * Regla:
     * - Si no había imágenes originales, mandar [] es seguro.
     * - Si había imágenes originales y el usuario mantiene algunas, mandamos keeps.
     * - Si había imágenes originales y keep queda vacío, NO mandamos nada para evitar borrado accidental.
     */
    if (!hadOriginalImages) {
      fd.append("keepProductImageIds", JSON.stringify([]));
    } else if (hasExplicitKeeps) {
      fd.append("keepProductImageIds", JSON.stringify(keepProductImageIds));
    }
  }

  return fd;
}

/** Utilidad para inspeccionar el FormData */
export function debugFormData(fd: FormData, label = "FORMDATA") {
  const out: Record<string, any[]> = {};
  for (const [k, v] of fd.entries()) {
    if (!out[k]) out[k] = [];
    out[k].push(
      v instanceof File ? `(File) ${v.name} (${v.type}, ${v.size}b)` : v,
    );
  }
  console.log(label, out);
}
