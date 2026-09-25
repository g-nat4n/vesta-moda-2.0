import nodemailer from "nodemailer";
import { formatBRL } from "@/lib/format";
import { getSiteUrl } from "@/lib/site-url";
import { createOrderAccessToken, ORDER_ACCESS_TTL_EMAIL } from "@/lib/order-access";

function smtpUser() {
  return process.env.SMTP_USER?.trim() || "";
}

function smtpPass() {
  return process.env.SMTP_PASS?.trim() || "";
}

export function isMailConfigured() {
  return Boolean(smtpUser() && smtpPass());
}

function transport() {
  const user = smtpUser();
  const pass = smtpPass();
  if (!user || !pass) return null;

  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const gmail = /@gmail\.com$/i.test(user) || host === "smtp.gmail.com";

  // SMTP_HOST às vezes vem preenchido com o e-mail por engano — trata como Gmail.
  if (gmail || (host && host.includes("@"))) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
  });
}

export async function sendMail(to: string, subject: string, html: string) {
  const user = smtpUser();
  const from = process.env.SMTP_FROM?.trim() || `Vesta Moda <${user}>`;
  const mailer = transport();
  if (!mailer) {
    throw new Error("Envio de e-mail não configurado.");
  }

  await mailer.sendMail({ from, to, subject, html });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absoluteUrl(site: string, pathOrUrl?: string | null) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl.startsWith("//")) return `https:${pathOrUrl}`;
  return `${site}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

type OrderPaidMail = {
  email: string;
  customerName: string;
  number: string;
  id: string;
  totalCents: number;
  shippingLabel: string;
  items: Array<{
    name: string;
    brand?: string;
    slug?: string;
    size: string;
    priceCents: number;
    quantity: number;
    imageUrl?: string | null;
  }>;
};

/** Confirmação de compra após pagamento aprovado. */
export async function sendOrderPaidEmail(order: OrderPaidMail) {
  if (!isMailConfigured()) {
    console.warn("[vesta] e-mail de compra não enviado: SMTP não configurado.");
    return false;
  }

  const site = getSiteUrl().replace(/\/$/, "");
  const access = createOrderAccessToken(order.id, ORDER_ACCESS_TTL_EMAIL);
  // claim troca o token da query por cookie HttpOnly (menos vazamento via Referer).
  const orderUrl = `${site}/api/orders/${order.id}/claim?access=${encodeURIComponent(access)}`;
  const accountUrl = `${site}/minha-conta`;
  const shopUrl = `${site}/produtos`;
  const homeUrl = site;
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim();
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_URL?.trim();

  const itemRows = order.items
    .map((item) => {
      const img = absoluteUrl(site, item.imageUrl);
      const productUrl = item.slug ? `${site}/produto/${item.slug}` : orderUrl;
      const thumb = img
        ? `<a href="${productUrl}" style="display:block;width:72px;height:90px;overflow:hidden;background:#f3efe8">
            <img src="${escapeHtml(img)}" alt="${escapeHtml(item.name)}" width="72" height="90" style="display:block;width:72px;height:90px;object-fit:cover;border:0" />
          </a>`
        : `<div style="width:72px;height:90px;background:#f3efe8"></div>`;

      return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid #e8e2d8;vertical-align:top">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="72" style="vertical-align:top">${thumb}</td>
              <td style="padding-left:14px;vertical-align:top">
                <a href="${productUrl}" style="color:#1a1a1a;text-decoration:none;font-size:15px;font-weight:600">
                  ${escapeHtml(item.name)}
                </a>
                ${item.brand ? `<div style="color:#7a7268;font-size:12px;margin-top:4px">${escapeHtml(item.brand)}</div>` : ""}
                <div style="color:#7a7268;font-size:12px;margin-top:4px">Tam. ${escapeHtml(item.size)} · Qtd. ${item.quantity}</div>
              </td>
              <td align="right" style="vertical-align:top;white-space:nowrap;font-size:14px;color:#1a1a1a;padding-left:10px">
                ${formatBRL(item.priceCents * item.quantity)}
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join("");

  const socialLinks = [
    instagram
      ? `<a href="${escapeHtml(instagram)}" style="color:#6b2c3e;text-decoration:none;margin-right:16px">Instagram</a>`
      : "",
    whatsapp
      ? `<a href="${escapeHtml(whatsapp)}" style="color:#6b2c3e;text-decoration:none">WhatsApp</a>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#f7f3ee;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f7f3ee;padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e8e2d8">
          <tr>
            <td style="padding:28px 28px 18px;border-bottom:1px solid #e8e2d8;text-align:center">
              <a href="${homeUrl}" style="text-decoration:none;color:#1a1a1a;letter-spacing:0.28em;font-size:18px;font-weight:700">VESTA</a>
              <div style="margin-top:8px;font-size:12px;color:#7a7268;letter-spacing:0.08em">COMPRA CONFIRMADA</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px">
              <p style="margin:0 0 12px;font-size:16px;line-height:1.5">Olá, ${escapeHtml(order.customerName)}.</p>
              <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#4a453f">
                Recebemos o pagamento do pedido <strong style="color:#1a1a1a">${escapeHtml(order.number)}</strong>.
                O atelier já pode preparar o envio ou a retirada.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${itemRows}
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:18px">
                <tr>
                  <td style="font-size:13px;color:#7a7268;padding:4px 0">Frete · ${escapeHtml(order.shippingLabel)}</td>
                </tr>
                <tr>
                  <td style="font-size:16px;padding:8px 0 0;border-top:1px solid #e8e2d8">
                    <strong>Total ${formatBRL(order.totalCents)}</strong>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:28px">
                <tr>
                  <td align="center" style="padding-bottom:10px">
                    <a href="${orderUrl}" style="display:inline-block;background:#6b2c3e;color:#ffffff;text-decoration:none;padding:12px 22px;font-size:13px;letter-spacing:0.06em">
                      Acompanhar pedido
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:8px">
                    <a href="${accountUrl}" style="color:#6b2c3e;text-decoration:underline;font-size:13px">Ver no meu perfil</a>
                    <span style="color:#c4bbb0;padding:0 8px">·</span>
                    <a href="${shopUrl}" style="color:#6b2c3e;text-decoration:underline;font-size:13px">Continuar na loja</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:4px">
                    <a href="${homeUrl}" style="color:#7a7268;text-decoration:none;font-size:12px">${escapeHtml(homeUrl.replace(/^https?:\/\//, ""))}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 28px;border-top:1px solid #e8e2d8;text-align:center;font-size:12px;color:#7a7268;line-height:1.7">
              ${socialLinks ? `<div style="margin-bottom:8px">${socialLinks}</div>` : ""}
              <div>Vesta Moda · Vista o que representa você.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendMail(order.email, `Compra confirmada · Pedido ${order.number}`, html);
  return true;
}

/** Aviso de cancelamento da compra (com ou sem estorno). */
export async function sendOrderCancelledEmail(order: {
  email: string;
  customerName: string;
  number: string;
  id: string;
  totalCents: number;
  refunded?: boolean;
}) {
  if (!isMailConfigured()) {
    console.warn("[vesta] e-mail de cancelamento não enviado: SMTP não configurado.");
    return false;
  }

  const site = getSiteUrl().replace(/\/$/, "");
  const access = createOrderAccessToken(order.id, ORDER_ACCESS_TTL_EMAIL);
  const orderUrl = `${site}/api/orders/${order.id}/claim?access=${encodeURIComponent(access)}`;
  const shopUrl = `${site}/produtos`;
  const refunded = Boolean(order.refunded);

  await sendMail(
    order.email,
    `Pedido cancelado · ${order.number}`,
    `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#f7f3ee;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a">
  <table role="presentation" width="100%" style="background:#f7f3ee;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e8e2d8">
        <tr>
          <td style="padding:28px;text-align:center;border-bottom:1px solid #e8e2d8">
            <a href="${site}" style="text-decoration:none;color:#1a1a1a;letter-spacing:0.28em;font-size:18px;font-weight:700">VESTA</a>
            <div style="margin-top:8px;font-size:12px;color:#7a7268;letter-spacing:0.08em">PEDIDO CANCELADO</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;font-size:14px;line-height:1.6">
            <p style="margin:0 0 12px">Olá, ${escapeHtml(order.customerName)}.</p>
            <p style="margin:0 0 12px;color:#4a453f">
              Confirmamos o cancelamento do pedido <strong>${escapeHtml(order.number)}</strong>.
            </p>
            ${
              refunded
                ? `<p style="margin:0 0 12px;color:#4a453f">
                    O valor de <strong>${formatBRL(order.totalCents)}</strong> será estornado
                    conforme o prazo do seu cartão ou meio de pagamento.
                  </p>`
                : `<p style="margin:0 0 12px;color:#4a453f">
                    Como o pagamento não havia sido concluído, nenhuma cobrança permanece ativa.
                  </p>`
            }
            <p style="margin:0 0 12px;color:#4a453f">
              Se quiser, explore de novo a curadoria quando fizer sentido.
            </p>
            <p style="margin:22px 0 0;text-align:center">
              <a href="${orderUrl}" style="display:inline-block;background:#6b2c3e;color:#fff;text-decoration:none;padding:12px 22px;font-size:13px">Ver pedido</a>
            </p>
            <p style="margin:14px 0 0;text-align:center">
              <a href="${shopUrl}" style="color:#6b2c3e;font-size:13px">Voltar à curadoria</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  );
  return true;
}

/** @deprecated use sendOrderCancelledEmail */
export async function sendOrderRefundedEmail(order: {
  email: string;
  customerName: string;
  number: string;
  id: string;
  totalCents: number;
}) {
  return sendOrderCancelledEmail({ ...order, refunded: true });
}
