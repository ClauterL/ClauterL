import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@sigforge.dev";
  const passwordHash = await argon2.hash("demo-password");

  const org = await prisma.org.upsert({
    where: { slug: "demo" },
    update: {},
    create: { name: "Demo Org", slug: "demo" },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name: "Demo User" },
  });

  await prisma.membership.upsert({
    where: { orgId_userId: { orgId: org.id, userId: user.id } },
    update: {},
    create: { orgId: org.id, userId: user.id, role: "OWNER" },
  });

  const sig1Fields = {
    fullName: "Ada Lovelace",
    jobTitle: "Chief Analytical Officer",
    company: "Difference Engine Co.",
    phone: "+44 20 7946 0000",
    email: "ada@example.com",
    website: "https://example.com",
    address: "London, UK",
    tagline: "Notes on the Analytical Engine",
    brandColor: "#0F62FE",
    logoAssetKey: "",
    photoAssetKey: "",
    animation: "fade-loop",
    iconLinks: [
      { icon: "linkedin", url: "https://linkedin.com/in/ada" },
      { icon: "twitter", url: "https://twitter.com/ada" },
      { icon: "website", url: "https://example.com" },
    ],
  };

  const sig2Fields = {
    ...sig1Fields,
    fullName: "Alan Turing",
    jobTitle: "Head of Computability",
    email: "alan@example.com",
    tagline: "On Computable Numbers",
    animation: "pulse",
  };

  await prisma.signature.upsert({
    where: { publicSlug: "demo-ada" },
    update: {},
    create: {
      orgId: org.id,
      createdById: user.id,
      name: "Ada — Classic",
      template: "classic",
      publicSlug: "demo-ada",
      fieldsJson: sig1Fields,
    },
  });

  await prisma.signature.upsert({
    where: { publicSlug: "demo-alan" },
    update: {},
    create: {
      orgId: org.id,
      createdById: user.id,
      name: "Alan — Modern",
      template: "modern",
      publicSlug: "demo-alan",
      fieldsJson: sig2Fields,
    },
  });

  console.log("Seed complete.");
  console.log(`Login: ${email} / demo-password`);
  console.log(`Org: ${org.slug}  publicSlugs: demo-ada, demo-alan`);
  void nanoid;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
