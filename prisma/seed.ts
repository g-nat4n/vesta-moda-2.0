import { PrismaClient, ProductCondition, ProductStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { FEATURED_PIECES } from "../src/lib/brand";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "altere-esta-senha", 12);

  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL ?? "admin@vestamoda.com" },
    update: { role: Role.ADMIN, passwordHash },
    create: {
      name: "Atelier Vesta",
      email: process.env.ADMIN_EMAIL ?? "admin@vestamoda.com",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const categories = await Promise.all(
    [
      {
        name: "Blazers",
        slug: "blazers",
        description: "Ombro, estrutura e presença.",
        imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=80",
        sortOrder: 1,
      },
      {
        name: "Casacos",
        slug: "casacos",
        description: "Camadas com peso e caimento.",
        imageUrl: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80",
        sortOrder: 2,
      },
      {
        name: "Camisas",
        slug: "camisas",
        description: "Trama limpa, colarinho e caimento.",
        imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80",
        sortOrder: 3,
      },
      {
        name: "Vestidos",
        slug: "vestidos",
        description: "Silhuetas com presença, do cotidiano à noite.",
        imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=80",
        sortOrder: 4,
      },
      {
        name: "Sapatos",
        slug: "sapatos",
        description: "Social, casual e o detalhe que apoia o look.",
        imageUrl: "/curadoria/pexels-photo-298863.jpg",
        sortOrder: 5,
      },
      {
        name: "Bolsas",
        slug: "bolsas",
        description: "Couro, estrutura e o detalhe que fecha o look.",
        imageUrl: "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=1200",
        sortOrder: 6,
      },
      {
        name: "Calças e saias",
        slug: "calcas-e-saias",
        description: "Proporção e movimento.",
        imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80",
        sortOrder: 7,
      },
      {
        name: "Acessórios",
        slug: "acessorios",
        description: "Lenços e o detalhe que completa.",
        imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
        sortOrder: 8,
      },
      {
        name: "Garimpos",
        slug: "garimpos",
        description: "Achados com marca do tempo e caráter.",
        imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
        sortOrder: 9,
      },
      {
        name: "Blazers e casacos",
        slug: "blazers-e-casacos",
        description: "Estrutura, ombro e tecido com peso.",
        imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=80",
        sortOrder: 10,
      },
    ].map((category) =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: category,
      }),
    ),
  );

  const cat = Object.fromEntries(categories.map((item) => [item.slug, item]));

  const look = await prisma.look.upsert({
    where: { slug: "noite-quente" },
    update: {},
    create: {
      name: "Noite quente",
      slug: "noite-quente",
      description: "Um vestido, um casaco leve e um acessório de couro.",
      imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515e0c785?auto=format&fit=crop&w=1200&q=80",
    },
  });

  await prisma.coupon.upsert({
    where: { code: "VESTA10" },
    update: { active: true, percentOff: 10 },
    create: { code: "VESTA10", percentOff: 10, active: true },
  });

  await prisma.testimonial.deleteMany();
  await prisma.testimonial.createMany({
    data: [
      {
        author: "Helena M.",
        role: "Cliente Vesta",
        quote: "A peça chegou com o caimento que a foto prometia — e com a ficha honesta. Raro.",
        sortOrder: 1,
      },
      {
        author: "Rafael C.",
        role: "Cliente Vesta",
        quote: "Comprei um blazer único. A sensação é de loja de curadoria, não de estoque infinito.",
        sortOrder: 2,
      },
    ],
  });

  const products = [
    {
      name: "Vestido Crepe Ember",
      slug: "vestido-crepe-ember",
      description: "Crepe fluido, alças finas e comprimento midi. Ideal para noite baixa ou um jantar sem ensaio.",
      story: "Entrou na Vesta com etiqueta de boutique paulistana dos anos 2000 ainda costurada por dentro.",
      brand: "Arquivo",
      size: "M",
      color: "Terracota",
      condition: ProductCondition.EXCELLENT,
      priceCents: 42000,
      categoryId: cat["vestidos"].id,
      lookId: look.id,
      featured: true,
      material: "Crepe",
      measurements: { bust: "90 cm", waist: "74 cm", length: "118 cm" },
      images: [
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Blazer Lã Harbor",
      slug: "blazer-la-harbor",
      description: "Ombro marcado, dois botões e lining intacto. Peso de inverno urbano.",
      brand: "Harbor Atelier",
      size: "M",
      color: "Camelo",
      condition: ProductCondition.VERY_GOOD,
      priceCents: 56000,
      categoryId: cat["blazers-e-casacos"].id,
      featured: true,
      material: "Lã mista",
      measurements: { shoulder: "41 cm", bust: "96 cm", length: "72 cm" },
      images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      name: "Camisa Poplin Marfim",
      slug: "camisa-poplin-marfim",
      description: "Algodão poplin, colarinho clássico e punho com botão. Base para qualquer composição.",
      brand: "Maison Linen",
      size: "P",
      color: "Marfim",
      condition: ProductCondition.NEW_WITH_TAG,
      priceCents: 21900,
      categoryId: cat["camisas"].id,
      lookId: look.id,
      featured: true,
      material: "Algodão",
      measurements: { bust: "92 cm", shoulder: "38 cm", length: "68 cm" },
      images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      name: "Calça Tailored Musgo",
      slug: "calca-tailored-musgo",
      description: "Cintura alta, prega simples e barra original. Cor musgo que dialoga com ouro e burgundy.",
      brand: "Atelier Norte",
      size: "38",
      color: "Musgo",
      condition: ProductCondition.EXCELLENT,
      priceCents: 31000,
      categoryId: cat["calcas-e-saias"].id,
      featured: true,
      material: "Alfaiataria",
      measurements: { waist: "76 cm", hip: "100 cm", length: "104 cm" },
      images: ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      name: "Bolsa Couro Cuoio",
      slug: "bolsa-couro-cuoio",
      description: "Couro estruturado, alça curta e ferragens em tom antigo. Sinais leves de uso no fundo.",
      brand: "Cuoio",
      size: "Único",
      color: "Caramelo",
      condition: ProductCondition.VERY_GOOD,
      priceCents: 48000,
      categoryId: cat["acessorios"].id,
      lookId: look.id,
      featured: true,
      material: "Couro",
      story: "Couro italiano com marcas honestas de uso, fotografadas no fundo da peça.",
      images: [
        "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/28773220/pexels-photo-28773220.png?auto=compress&cs=tinysrgb&w=1200",
      ],
    },
    {
      name: "Trench Arquivo 92",
      slug: "trench-arquivo-92",
      description: "Gabardine clássica, cinto original e botões completos. Um garimpo de corte militar suave.",
      brand: "Arquivo",
      size: "G",
      color: "Areia",
      condition: ProductCondition.VINTAGE,
      priceCents: 69000,
      categoryId: cat["garimpos"].id,
      featured: true,
      material: "Gabardine",
      measurements: { bust: "108 cm", length: "112 cm" },
      images: ["https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      name: "Saia Pregas Âmbar",
      slug: "saia-pregas-ambar",
      description: "Pregas permanentes e cós forrado. Movimento para o dia, presença para o fim de tarde.",
      brand: "Âmbar",
      size: "M",
      color: "Âmbar",
      condition: ProductCondition.EXCELLENT,
      priceCents: 24000,
      categoryId: cat["calcas-e-saias"].id,
      story: "Pregas originais, cós forrado e um tom âmbar que pede camisa simples.",
      images: ["https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      name: "Lenço Seda Meridiano",
      slug: "lenco-seda-meridiano",
      description: "Seda com desenho geométrico discreto. Pode ir no pescoço, na bolsa ou no cabelo.",
      brand: "Meridiano",
      size: "Único",
      color: "Dourado",
      condition: ProductCondition.EXCELLENT,
      priceCents: 16000,
      categoryId: cat["acessorios"].id,
      story: "Seda leve, 70×70 cm, sem puxados visíveis.",
      images: ["https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=1200&q=80", "https://images.pexels.com/photos/5709661/pexels-photo-5709661.jpeg?auto=compress&cs=tinysrgb&w=800"],
    },
    {
      name: "Casaco Lã Ember",
      slug: "casaco-la-ember",
      description: "Lã pesada, gola xale e bolsos embutidos. Um casaco de cidade fria.",
      brand: "Ember Wool",
      size: "M",
      color: "Vinho",
      condition: ProductCondition.VERY_GOOD,
      priceCents: 78000,
      categoryId: cat["blazers-e-casacos"].id,
      story: "Lã pesada de inverno, gola xale e forro intacto.",
      images: ["https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      name: "Vestido Slip Noir",
      slug: "vestido-slip-noir",
      description: "Acetinado, decote em V e fenda lateral discreta. Peça única no acervo.",
      brand: "Nocturne",
      size: "P",
      color: "Preto",
      condition: ProductCondition.EXCELLENT,
      priceCents: 39000,
      categoryId: cat["vestidos"].id,
      featured: true,
      story: "Acetinado preto, fenda discreta, uma unidade no acervo.",
      images: ["https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      name: "Camisa Listrada Porto",
      slug: "camisa-listrada-porto",
      description: "Listra fina, algodão respirável e caimento oversized controlado.",
      brand: "Porto",
      size: "M",
      color: "Azul e branco",
      condition: ProductCondition.GOOD,
      priceCents: 18000,
      categoryId: cat["camisas"].id,
      story: "Algodão respirável, listra fina e caimento oversized controlado.",
      images: ["https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      name: "Jaqueta Denim Arquivo",
      slug: "jaqueta-denim-arquivo",
      description: "Jeans médio, lavagem original e botões de metal. Marca de uso no punho, fotografada.",
      brand: "Arquivo",
      size: "M",
      color: "Índigo",
      condition: ProductCondition.VINTAGE,
      priceCents: 27000,
      categoryId: cat["garimpos"].id,
      story: "Jeans médio, lavagem original e marca de uso no punho, fotografada.",
      images: ["https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      name: "Loafer Nilo",
      slug: "loafer-nilo",
      description: "Couro liso, palmilha original e salto baixo. Um social que também anda no casual.",
      story: "Entrou na Vesta com solado honesto e caixa ainda firme.",
      brand: "Nilo",
      size: "39",
      color: "Preto",
      condition: ProductCondition.VERY_GOOD,
      priceCents: 34000,
      categoryId: cat["sapatos"].id,
      material: "Couro",
      images: [
        "https://images.pexels.com/photos/298863/pexels-photo-298863.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Vestido Linho Duna",
      slug: "vestido-linho-duna",
      description: "Linho cru, alças médias e comprimento midi. Presença de verão sem ensaio.",
      story: "Tecido respirável, com caimento que pede pouco acessório.",
      brand: "Duna",
      size: "M",
      color: "Areia",
      condition: ProductCondition.EXCELLENT,
      priceCents: 36000,
      categoryId: cat["vestidos"].id,
      material: "Linho",
      measurements: { bust: "92 cm", waist: "76 cm", length: "114 cm" },
      images: [
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80",
        "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1200",
      ],
    },
    {
      name: "Cinto Fivela Nox",
      slug: "cinto-fivela-nox",
      description: "Couro fino, fivela dourada antiga e furo original. Fecha o look sem volume.",
      story: "Peça única, largura clássica, sem rachaduras visíveis.",
      brand: "Nox",
      size: "Único",
      color: "Preto",
      condition: ProductCondition.EXCELLENT,
      priceCents: 12000,
      categoryId: cat["acessorios"].id,
      material: "Couro",
      images: [
        "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Blusa Seda Névoa",
      slug: "blusa-seda-nevoa",
      description: "Seda lavada, gola laço e manga longa. Cai bem com calça de alfaiataria.",
      story: "Toque fresco, sem puxados na frente. Uma unidade.",
      brand: "Névoa",
      size: "P",
      color: "Off-white",
      condition: ProductCondition.NEW_WITH_TAG,
      priceCents: 25000,
      categoryId: cat["camisas"].id,
      material: "Seda",
      measurements: { bust: "90 cm", shoulder: "37 cm", length: "62 cm" },
      images: [
        "https://images.pexels.com/photos/22441297/pexels-photo-22441297.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80",
      ],
    },
  ];

  for (const item of products) {
    const { images, ...data } = item;
    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: { ...data, status: ProductStatus.AVAILABLE, stock: 1, uniquePiece: true },
      create: {
        ...data,
        status: ProductStatus.AVAILABLE,
        stock: 1,
        uniquePiece: true,
      },
    });
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: images.map((url, index) => ({
        productId: product.id,
        url,
        alt: `${data.name} — fotografia ${index + 1}`,
        kind: index === 0 ? "MAIN" : "DETAIL",
        sortOrder: index,
      })),
    });
  }

  for (const piece of FEATURED_PIECES) {
    const categoryId =
      cat[piece.categorySlug]?.id ??
      cat["blazers"]?.id ??
      cat["vestidos"]?.id ??
      categories[0]?.id;
    if (!categoryId) continue;

    const product = await prisma.product.upsert({
      where: { slug: piece.slug },
      update: {
        name: piece.name,
        description: piece.description,
        brand: piece.brand,
        size: piece.size,
        color: piece.color,
        condition: ProductCondition[piece.condition],
        priceCents: piece.priceCents,
        categoryId,
        featured: true,
        status: ProductStatus.AVAILABLE,
        stock: 1,
        uniquePiece: true,
      },
      create: {
        name: piece.name,
        slug: piece.slug,
        description: piece.description,
        brand: piece.brand,
        size: piece.size,
        color: piece.color,
        condition: ProductCondition[piece.condition],
        priceCents: piece.priceCents,
        categoryId,
        featured: true,
        status: ProductStatus.AVAILABLE,
        stock: 1,
        uniquePiece: true,
      },
    });
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    const imageUrls = piece.gallery?.length ? piece.gallery : [piece.image];
    await prisma.productImage.createMany({
      data: imageUrls.map((url, index) => ({
        productId: product.id,
        url,
        alt: piece.alt,
        kind: index === 0 ? "MAIN" : "DETAIL",
        sortOrder: index,
      })),
    });
  }

  await prisma.product.updateMany({
    where: { slug: { notIn: FEATURED_PIECES.map((piece) => piece.slug) } },
    data: { featured: false },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
