import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";
import { markOrderPaid, restoreOrderStock } from "@/services/order.service";
import { PaymentStatus, OrderStatus } from "@prisma/client";

function getClient() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) return null;
  return new MercadoPagoConfig({ accessToken: token });
}

function appBaseUrl() {
  return getSiteUrl();
}

function isPublicHttps(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1";
  } catch {
    return false;
  }
}

/** URL pública HTTPS exigida pelo Mercado Pago para back_urls / auto_return. */
function publicReturnOrigin() {
  const configured = process.env.MERCADOPAGO_RETURN_URL?.trim();
  if (configured && isPublicHttps(configured)) return configured.replace(/\/$/, "");
  const appUrl = appBaseUrl();
  if (isPublicHttps(appUrl)) return appUrl.replace(/\/$/, "");
  return "https://vesta-moda-2-0.vercel.app";
}

function buildBackUrls(orderId: string) {
  const appUrl = appBaseUrl().replace(/\/$/, "");

  // Em produção HTTPS, volta direto para a página do pedido.
  if (isPublicHttps(appUrl)) {
    const base = `${appUrl}/pedido/${orderId}`;
    return {
      success: `${base}?result=success`,
      failure: `${base}?result=failure`,
      pending: `${base}?result=pending`,
      notificationUrl: `${appUrl}/api/webhooks/mercadopago`,
    };
  }

  // Em localhost o MP bloqueia o retorno. Usamos bridge HTTPS na Vercel
  // que redireciona automaticamente de volta para http://localhost:3000.
  const bridge = publicReturnOrigin();
  const home = encodeURIComponent(appUrl);
  return {
    success: `${bridge}/api/payments/mp-return?result=success&home=${home}`,
    failure: `${bridge}/api/payments/mp-return?result=failure&home=${home}`,
    pending: `${bridge}/api/payments/mp-return?result=pending&home=${home}`,
    notificationUrl: undefined as string | undefined,
  };
}

/** Em localhost ou com MERCADOPAGO_SANDBOX=true, usa o Checkout de teste. */
export function isMercadoPagoSandbox() {
  if (process.env.MERCADOPAGO_SANDBOX === "true") return true;
  if (process.env.MERCADOPAGO_SANDBOX === "false") return false;
  return !isPublicHttps(appBaseUrl());
}

export function mercadoPagoErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
    const err = error as {
      message?: string;
      cause?: Array<{ description?: string; message?: string; code?: string | number }>;
    };
    const cause = err.cause?.[0]?.description ?? err.cause?.[0]?.message;
    const raw = cause || err.message || "";
    const lower = raw.toLowerCase();

    if (
      lower.includes("unauthorized use of live credentials") ||
      lower.includes("uma das partes é de teste") ||
      lower.includes("uma das partes e de teste")
    ) {
      return (
        "A conta de teste do Mercado Pago não tem permissão para cobrar cartão pela API " +
        "(Checkout Transparente). Em localhost use MERCADOPAGO_LOCAL_MOCK=true, " +
        "ou em produção use as Credenciais de produção da conta real da loja."
      );
    }
    if (cause) return cause;
    if (err.message) return err.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível iniciar o pagamento no Mercado Pago.";
}

export function isMercadoPagoConfigured() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim());
}

export async function createPaymentPreference(orderId: string) {
  const client = getClient();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true },
  });
  if (!order) throw new Error("Pedido não encontrado.");

  if (!client) {
    return {
      checkoutUrl: `/pedido/${order.id}?result=pending-payment`,
      preferenceId: null as string | null,
    };
  }

  const sandbox = isMercadoPagoSandbox();
  const appUrl = appBaseUrl();
  const localMock =
    sandbox &&
    process.env.MERCADOPAGO_LOCAL_MOCK === "true" &&
    (appUrl.includes("localhost") || appUrl.includes("127.0.0.1"));

  // Local + mock: marca como pago sem abrir o Checkout Pro.
  if (localMock) {
    return {
      checkoutUrl: `/api/payments/local-approve?orderId=${order.id}`,
      preferenceId: null as string | null,
    };
  }

  // Checkout Transparente (cartão na própria loja, sem login no MP).
  // Preferido: funciona com credenciais de teste sem conta compradora.
  const useTransparent =
    process.env.MERCADOPAGO_CHECKOUT !== "pro" &&
    Boolean(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim() || process.env.MERCADOPAGO_PUBLIC_KEY?.trim());

  if (useTransparent) {
    return {
      checkoutUrl: `/pedido/${order.id}/pagar`,
      preferenceId: null as string | null,
    };
  }

  const back = buildBackUrls(order.id);

  const preference = new Preference(client);
  const created = await preference.create({
    body: {
      external_reference: order.id,
      items: [
        {
          id: order.id,
          title: `Pedido ${order.number}`,
          quantity: 1,
          unit_price: Math.max(order.totalCents / 100, 1),
          currency_id: "BRL",
        },
      ],
      payer: {
        name: order.customerName,
        email: order.email,
        // CPF real em preferência de conta teste costuma quebrar o Checkout Pro.
        ...(sandbox || !order.cpf
          ? {}
          : {
              identification: {
                type: "CPF" as const,
                number: order.cpf.replace(/\D/g, ""),
              },
            }),
      },
      back_urls: {
        success: back.success,
        failure: back.failure,
        pending: back.pending,
      },
      // Redireciona sozinho após aprovar (até ~40s). Também mostra "Voltar ao site".
      auto_return: "approved",
      ...(back.notificationUrl ? { notification_url: back.notificationUrl } : {}),
      statement_descriptor: "VESTAMODA",
    },
  });

  await prisma.payment.update({
    where: { orderId: order.id },
    data: { preferenceId: created.id },
  });

  // Com conta TESTUSER, use init_point (www). O sandbox_init_point costuma
  // abrir "Ops, ocorreu um erro". O modo teste vem das credenciais + comprador de teste.
  return {
    checkoutUrl: created.init_point ?? created.sandbox_init_point ?? `/pedido/${order.id}`,
    preferenceId: created.id ?? null,
  };
}

export async function handleMercadoPagoNotification(paymentId: string) {
  const client = getClient();
  if (!client) return;

  const api = new Payment(client);
  const payment = await api.get({ id: paymentId });
  const orderId = payment.external_reference;
  if (!orderId) return;

  const status = payment.status;
  if (status === "approved") {
    await markOrderPaid(orderId, String(payment.id), payment);
    return;
  }
  if (status === "rejected" || status === "cancelled" || status === "refunded") {
    await restoreOrderStock(
      orderId,
      status === "refunded" ? PaymentStatus.REFUNDED : PaymentStatus.REJECTED,
    );
  }
}

/** Cria pagamento com cartão (Checkout Transparente / Card Payment Brick). */
export async function createCardPayment(input: {
  orderId: string;
  token: string;
  paymentMethodId: string;
  installments: number;
  issuerId?: string | number | null;
  payerEmail?: string | null;
  payerIdentification?: { type?: string | null; number?: string | null } | null;
}) {
  const client = getClient();
  if (!client) throw new Error("Mercado Pago não configurado.");

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { payment: true },
  });
  if (!order) throw new Error("Pedido não encontrado.");
  if (order.status === OrderStatus.CANCELLED) {
    throw new Error("Este pedido foi cancelado. Faça um novo checkout.");
  }
  if (order.payment?.status === PaymentStatus.APPROVED) {
    return {
      status: "approved",
      statusDetail: "already_approved",
      paymentId: order.payment.providerPaymentId,
    };
  }

  const sandbox = isMercadoPagoSandbox();
  const email = (input.payerEmail || order.email).trim();
  const docFromBrick = input.payerIdentification?.number?.replace(/\D/g, "") || "";
  const docFromOrder = order.cpf?.replace(/\D/g, "") || "";
  // Em sandbox o MP exige CPF de teste 12345678909 para aprovar com nome APRO.
  const docNumber = sandbox
    ? docFromBrick || "12345678909"
    : docFromBrick || docFromOrder;
  const docType = (input.payerIdentification?.type || "CPF").toUpperCase();

  const issuerRaw = input.issuerId;
  const issuerId =
    issuerRaw !== undefined && issuerRaw !== null && String(issuerRaw).trim() !== ""
      ? Number(issuerRaw)
      : null;

  const amount = Math.max(order.totalCents / 100, 1);
  const paymentApi = new Payment(client);
  const created = await paymentApi.create({
    body: {
      transaction_amount: amount,
      token: input.token,
      description: `Pedido ${order.number}`,
      installments: Number(input.installments) || 1,
      payment_method_id: input.paymentMethodId,
      ...(issuerId && Number.isFinite(issuerId) ? { issuer_id: issuerId } : {}),
      external_reference: order.id,
      statement_descriptor: "VESTAMODA",
      payer: {
        email,
        ...(docNumber
          ? {
              identification: {
                type: docType,
                number: docNumber,
              },
            }
          : {}),
      },
    },
    requestOptions: {
      idempotencyKey: `${order.id}-${input.token.slice(0, 24)}`,
    },
  });

  const status = String(created.status ?? "");
  if (status === "approved") {
    await markOrderPaid(order.id, String(created.id), created);
  } else {
    // Mantém o pedido aberto para nova tentativa no Brick (não cancela estoque).
    await prisma.payment.update({
      where: { orderId: order.id },
      data: {
        status:
          status === "rejected" || status === "cancelled"
            ? PaymentStatus.REJECTED
            : PaymentStatus.PENDING,
        providerPaymentId: created.id ? String(created.id) : undefined,
        rawPayload: created as object,
      },
    });
  }

  return {
    status,
    statusDetail: created.status_detail,
    paymentId: created.id ? String(created.id) : null,
  };
}

/** Sincroniza o pedido na volta do Checkout Pro (funciona sem webhook, inclusive no localhost). */
export async function syncOrderFromMercadoPagoReturn(input: {
  orderId: string;
  paymentId?: string | null;
  collectionStatus?: string | null;
}) {
  const paymentId = input.paymentId?.trim();
  if (paymentId && paymentId !== "null") {
    await handleMercadoPagoNotification(paymentId);
    return;
  }

  const status = input.collectionStatus?.toLowerCase();
  if (status === "rejected" || status === "cancelled") {
    await restoreOrderStock(input.orderId, PaymentStatus.REJECTED);
  }
}
