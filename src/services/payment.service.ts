import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";
import { markOrderPaid, restoreOrderStock } from "@/services/order.service";
import { PaymentStatus } from "@prisma/client";

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
  return "https://vesta-moda.vercel.app";
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
      cause?: Array<{ description?: string; message?: string }>;
    };
    const cause = err.cause?.[0]?.description ?? err.cause?.[0]?.message;
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
