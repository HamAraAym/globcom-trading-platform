"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function globalSearch(query: string) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  if (!query || query.length < 2) return [];

  // Search all 3 primary tables simultaneously for maximum speed
  const [clients, demands, supplies] = await Promise.all([
    prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { company: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ]
      },
      take: 5, // Limit to top 5 hits to keep the palette clean
    }),
    prisma.demand.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { specs: { contains: query, mode: "insensitive" } },
        ]
      },
      take: 5,
    }),
    prisma.supply.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { location: { contains: query, mode: "insensitive" } },
        ]
      },
      take: 5,
    })
  ]);

  // Normalize the data into a single, easy-to-render format
  const results = [
    ...clients.map(c => ({ 
      id: c.id, 
      type: "CLIENT", 
      title: c.company || c.name, 
      subtitle: c.email, 
      link: `/crm/${c.id}` 
    })),
    ...demands.map(d => ({ 
      id: d.id, 
      type: "DEMAND", 
      title: d.title, 
      subtitle: `${new Intl.NumberFormat().format(d.quantity)} ${d.quantityUnit} • ${d.status.replace("_", " ")}`, 
      link: `/demands` 
    })),
    ...supplies.map(s => ({ 
      id: s.id, 
      type: "SUPPLY", 
      title: s.title, 
      subtitle: `${new Intl.NumberFormat().format(s.quantity)} ${s.quantityUnit} • ${s.status.replace("_", " ")}`, 
      link: `/supplies` 
    })),
  ];

  return results;
}