import type { Metadata } from "next";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export function createMetadata({
  title,
  description = APP_TAGLINE,
  path = "/",
  image,
  noIndex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${siteUrl}${path}`;
  const fullTitle = title === APP_NAME ? title : `${title} · ${APP_NAME}`;

  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: APP_NAME,
      locale: "pt_BR",
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export function productJsonLd(product: {
  name: string;
  description: string;
  slug: string;
  brand: string;
  priceCents: number;
  imageUrl?: string;
  available: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    image: product.imageUrl,
    url: `${siteUrl}/produto/${product.slug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (product.priceCents / 100).toFixed(2),
      availability: product.available
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
      url: `${siteUrl}/produto/${product.slug}`,
    },
  };
}
