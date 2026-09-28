import { onlyDigits } from "@/lib/utils";
import type { ShippingQuote } from "@/types";

export type AddressLookup = {
  zip: string;
  street: string;
  district: string;
  city: string;
  state: string;
};

const CORREIOS_SERVICES = [
  { id: "pac", code: "03298", label: "PAC" },
  { id: "sedex", code: "03220", label: "SEDEX" },
] as const;

let cachedToken: { value: string; expiresAt: number } | null = null;

function correiosBaseUrl() {
  return process.env.CORREIOS_SANDBOX === "true"
    ? "https://apihom.correios.com.br"
    : "https://api.correios.com.br";
}

function parseReaisToCents(value: string | number | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 100);
  }
  if (!value) return null;
  const normalized = String(value).trim().replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

export async function lookupCep(zip: string): Promise<AddressLookup> {
  const cep = onlyDigits(zip);
  if (cep.length !== 8) {
    throw new Error("CEP inválido.");
  }

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    next: { revalidate: 86400 },
  });
  if (!response.ok) {
    throw new Error("Não foi possível consultar o CEP.");
  }

  const data = (await response.json()) as {
    erro?: boolean;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };

  if (data.erro) {
    throw new Error("CEP não encontrado.");
  }

  return {
    zip: cep,
    street: data.logradouro ?? "",
    district: data.bairro ?? "",
    city: data.localidade ?? "",
    state: data.uf ?? "",
  };
}

export async function quoteShipping(zip: string): Promise<ShippingQuote[]> {
  const cep = onlyDigits(zip);
  if (cep.length !== 8) {
    throw new Error("Informe um CEP válido.");
  }

  const correios = await quoteCorreios(cep);
  const origin = onlyDigits(process.env.SHIPPING_ORIGIN_CEP ?? "");
  const pickupPrefix = (
    process.env.PICKUP_CEP_PREFIX?.replace(/\D/g, "") || origin.slice(0, 5)
  ).slice(0, 5);
  // Com frete real dos Correios, retirada grátis só na área da loja.
  // Sem Correios, a retirada continua disponível para não travar a venda.
  const pickupAllowed =
    correios.length === 0 || pickupPrefix.length < 2 || cep.startsWith(pickupPrefix);

  const quotes: ShippingQuote[] = [];
  if (pickupAllowed) {
    quotes.push({
      id: "pickup",
      carrier: "Vesta",
      service: "pickup",
      label: "Retirada combinada, sem frete",
      priceCents: 0,
      days: 2,
      source: "pickup",
    });
  }

  return [...quotes, ...correios];
}

async function getCorreiosToken() {
  const user = process.env.CORREIOS_API_USER?.trim();
  const password = process.env.CORREIOS_API_PASSWORD?.trim();
  const card = process.env.CORREIOS_CARTAO_POSTAGEM?.trim();
  if (!user || !password || !card) return null;

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const body: Record<string, string | number> = { numero: card };
  if (process.env.CORREIOS_CONTRATO?.trim()) {
    body.contrato = process.env.CORREIOS_CONTRATO.trim();
  }
  if (process.env.CORREIOS_DR?.trim()) {
    body.dr = Number(process.env.CORREIOS_DR);
  }

  const response = await fetch(`${correiosBaseUrl()}/token/v1/autentica/cartaopostagem`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    cachedToken = null;
    return null;
  }

  const data = (await response.json()) as { token?: string; expiraEm?: string };
  if (!data.token) return null;

  const expiresAt = data.expiraEm ? Date.parse(data.expiraEm) : Date.now() + 20 * 60 * 60 * 1000;
  cachedToken = { value: data.token, expiresAt: Number.isFinite(expiresAt) ? expiresAt : Date.now() + 20 * 60 * 60 * 1000 };
  return data.token;
}

async function quoteCorreios(destinationZip: string): Promise<ShippingQuote[]> {
  const token = await getCorreiosToken();
  const origin = onlyDigits(process.env.SHIPPING_ORIGIN_CEP ?? "");
  if (!token || origin.length !== 8) return [];

  const weight = process.env.SHIPPING_WEIGHT_GRAMS ?? "800";
  const quotes: ShippingQuote[] = [];

  await Promise.all(
    CORREIOS_SERVICES.map(async (service) => {
      const [priceRes, prazoRes] = await Promise.all([
        fetch(
          `${correiosBaseUrl()}/preco/v1/nacional/${service.code}?cepOrigem=${origin}&cepDestino=${destinationZip}&psObjeto=${weight}&tpObjeto=2&comprimento=32&largura=24&altura=8`,
          {
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        ),
        fetch(
          `${correiosBaseUrl()}/prazo/v1/nacional/${service.code}?cepOrigem=${origin}&cepDestino=${destinationZip}`,
          {
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        ),
      ]);

      if (!priceRes.ok) return;

      const price = (await priceRes.json()) as { pcFinal?: string | number; msgs?: unknown };
      const priceCents = parseReaisToCents(price.pcFinal);
      if (!priceCents) return;

      let days = 0;
      if (prazoRes.ok) {
        const prazo = (await prazoRes.json()) as { prazoEntrega?: number };
        days = Number(prazo.prazoEntrega) || 0;
      }

      quotes.push({
        id: service.id,
        carrier: "Correios",
        service: service.label,
        label: days
          ? `Correios · ${service.label} · ${days} dia${days === 1 ? "" : "s"}`
          : `Correios · ${service.label}`,
        priceCents,
        days,
        source: "correios",
      });
    }),
  );

  return quotes;
}
