export const APP_NAME = "Vesta Moda Pre-Owned";
export const APP_TAGLINE = "Curadoria de peças especiais — a maior rede de compradores via celular.";

export const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/a-vesta", label: "A Vesta" },
  { href: "/produtos", label: "Curadoria" },
  { href: "/#categorias", label: "Categorias" },
  { href: "/diario", label: "Diário Vesta" },
  { href: "/contato", label: "Contato" },
] as const;

export const CONDITION_LABELS = {
  NEW_WITH_TAG: "Novo com etiqueta",
  EXCELLENT: "Excelente",
  VERY_GOOD: "Muito bom",
  GOOD: "Bom",
  VINTAGE: "Vintage",
} as const;

export const PRODUCT_STATUS_LABELS = {
  DRAFT: "Rascunho",
  AVAILABLE: "Disponível",
  RESERVED: "Reservado",
  SOLD: "Vendido",
  ARCHIVED: "Arquivado",
} as const;

export const ORDER_STATUS_LABELS = {
  PENDING: "Pendente",
  PAID: "Pago",
  PROCESSING: "Em preparação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
} as const;

export const PAYMENT_STATUS_LABELS = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  REFUNDED: "Reembolsado",
} as const;
