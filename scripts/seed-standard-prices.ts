
import { db } from "../src/lib/db";
import { standardPriceList } from "../src/lib/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Seeding standard price list...");

  // Default Ledger ID 1 for now, or fetch all ledgers
  const ledgers = await db.query.ledgers.findMany();
  
  if (ledgers.length === 0) {
      console.error("No ledgers found. Cannot seed.");
      return;
  }

  const commonServices = [
    {
        serviceName: "Oil Change (Standard)",
        description: "Standard oil change up to 5L, including filter replacement.",
        baseLaborHours: 0.5,
        hourlyRate: 120.00,
        requiredParts: JSON.stringify(["Oil Filter", "5W-30 Oil"]),
    },
    {
        serviceName: "Oil Change (Synthetic)",
        description: "Full synthetic oil change up to 5L, including filter replacement.",
        baseLaborHours: 0.5,
        hourlyRate: 120.00,
        requiredParts: JSON.stringify(["Oil Filter", "0W-20 Synthetic Oil"]),
    },
    {
        serviceName: "Brake Pad Replacement (Front)",
        description: "Replace front brake pads and inspect rotors.",
        baseLaborHours: 1.5,
        hourlyRate: 120.00,
        requiredParts: JSON.stringify(["Front Brake Pads"]),
    },
    {
        serviceName: "Brake Pad Replacement (Rear)",
        description: "Replace rear brake pads and inspect rotors.",
        baseLaborHours: 1.5,
        hourlyRate: 120.00,
        requiredParts: JSON.stringify(["Rear Brake Pads"]),
    },
    {
        serviceName: "Brake Rotor & Pad Replacement (Front)",
        description: "Replace front brake pads and rotors.",
        baseLaborHours: 2.0,
        hourlyRate: 120.00,
        requiredParts: JSON.stringify(["Front Brake Pads", "Front Brake Rotors"]),
    },
    {
        serviceName: "General Diagnostic",
        description: "Initial diagnostic scan and inspection.",
        baseLaborHours: 1.0,
        hourlyRate: 140.00,
        requiredParts: JSON.stringify([]),
    },
    {
        serviceName: "WOF Inspection",
        description: "Warrant of Fitness inspection.",
        baseLaborHours: 0.75,
        hourlyRate: 90.00, // Often fixed price, but modeled here as labor
        requiredParts: JSON.stringify([]),
    }
  ];

  for (const ledger of ledgers) {
      console.log(`Seeding for Ledger: ${ledger.name} (${ledger.id})`);
      
      for (const service of commonServices) {
          // Check if exists
          const existing = await db.query.standardPriceList.findFirst({
              where: (table, { and, eq }) => and(
                  eq(table.ledgerId, ledger.id),
                  eq(table.serviceName, service.serviceName)
              )
          });

          if (!existing) {
              await db.insert(standardPriceList).values({
                  ledgerId: ledger.id,
                  ...service
              });
              console.log(`  + Added ${service.serviceName}`);
          } else {
              console.log(`  . Skipped ${service.serviceName} (already exists)`);
          }
      }
  }

  console.log("Seeding complete.");
}

main().catch(console.error);
