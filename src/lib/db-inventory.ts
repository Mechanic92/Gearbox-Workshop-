import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, and, like, lt, desc } from 'drizzle-orm';

/**
 * Inventory Management Data Access Layer
 * Handles parts, suppliers, stock movements, and purchase orders
 */

// ============================================================================
// SUPPLIERS
// ============================================================================

export async function createSupplier(input: any) {
  const [result] = await db.insert(schema.suppliers).values(input).returning({ id: schema.suppliers.id });
  return result.id;
}

export async function getSuppliersByLedger(ledgerId: number) {
  return db.query.suppliers.findMany({
    where: and(
      eq(schema.suppliers.ledgerId, ledgerId),
      eq(schema.suppliers.isActive, true)
    ),
    orderBy: [schema.suppliers.name],
  });
}

export async function getSupplierById(id: number) {
  return db.query.suppliers.findFirst({ where: eq(schema.suppliers.id, id) });
}

export async function updateSupplier(id: number, input: any) {
  await db.update(schema.suppliers).set(input).where(eq(schema.suppliers.id, id));
}

// ============================================================================
// PART CATEGORIES
// ============================================================================

export async function createPartCategory(input: any) {
  const [result] = await db.insert(schema.partCategories).values(input).returning({ id: schema.partCategories.id });
  return result.id;
}

export async function getPartCategoriesByLedger(ledgerId: number) {
  return db.query.partCategories.findMany({
    where: eq(schema.partCategories.ledgerId, ledgerId),
    orderBy: [schema.partCategories.name],
  });
}

// ============================================================================
// PARTS
// ============================================================================

export async function createPart(input: any) {
  const [result] = await db.insert(schema.parts).values(input).returning({ id: schema.parts.id });
  return result.id;
}

export async function getPartsByLedger(ledgerId: number) {
  return db.query.parts.findMany({
    where: and(
      eq(schema.parts.ledgerId, ledgerId),
      eq(schema.parts.isActive, true)
    ),
    orderBy: [schema.parts.name],
  });
}

export async function getPartById(id: number) {
  return db.query.parts.findFirst({ where: eq(schema.parts.id, id) });
}

export async function updatePart(id: number, input: any) {
  await db.update(schema.parts).set(input).where(eq(schema.parts.id, id));
}

export async function searchParts(ledgerId: number, query: string) {
  return db.query.parts.findMany({
    where: and(
      eq(schema.parts.ledgerId, ledgerId),
      eq(schema.parts.isActive, true),
      like(schema.parts.name, `%${query}%`)
    ),
    limit: 50,
  });
}

export async function getLowStockParts(ledgerId: number) {
  // Parts where stockQuantity <= minStockLevel
  const parts = await db.query.parts.findMany({
    where: and(
      eq(schema.parts.ledgerId, ledgerId),
      eq(schema.parts.isActive, true)
    ),
  });
  
  return parts.filter(p => p.stockQuantity <= p.minStockLevel);
}

// ============================================================================
// STOCK MOVEMENTS
// ============================================================================

export async function createStockMovement(input: any) {
  const [result] = await db.insert(schema.stockMovements).values(input).returning({ id: schema.stockMovements.id });
  
  // Update part stock quantity
  const part = await getPartById(input.partId);
  if (part) {
    const newQuantity = part.stockQuantity + input.quantity;
    await updatePart(input.partId, { stockQuantity: newQuantity });
  }
  
  return result.id;
}

export async function getStockMovementsByPart(partId: number, limit: number = 50) {
  return db.query.stockMovements.findMany({
    where: eq(schema.stockMovements.partId, partId),
    orderBy: [desc(schema.stockMovements.createdAt)],
    limit,
  });
}

export async function getStockMovementsByLedger(ledgerId: number, limit: number = 100) {
  return db.query.stockMovements.findMany({
    where: eq(schema.stockMovements.ledgerId, ledgerId),
    orderBy: [desc(schema.stockMovements.createdAt)],
    limit,
  });
}

// ============================================================================
// PURCHASE ORDERS
// ============================================================================

export async function createPurchaseOrder(input: any) {
  const { items, ...poData } = input;
  const [result] = await db.insert(schema.purchaseOrders).values(poData).returning({ id: schema.purchaseOrders.id });
  const poId = result.id;
  
  if (items && items.length) {
    await db.insert(schema.purchaseOrderItems).values(
      items.map((item: any) => ({ ...item, purchaseOrderId: poId }))
    );
  }
  
  return poId;
}

export async function getPurchaseOrdersByLedger(ledgerId: number) {
  return db.query.purchaseOrders.findMany({
    where: eq(schema.purchaseOrders.ledgerId, ledgerId),
    orderBy: [desc(schema.purchaseOrders.createdAt)],
  });
}

export async function getPurchaseOrderById(id: number) {
  return db.query.purchaseOrders.findFirst({
    where: eq(schema.purchaseOrders.id, id),
    with: {
      items: true,
    } as any,
  });
}

export async function updatePurchaseOrderStatus(id: number, status: string) {
  await db.update(schema.purchaseOrders)
    .set({ status: status as any })
    .where(eq(schema.purchaseOrders.id, id));
}

export async function receivePurchaseOrder(poId: number, items: Array<{ itemId: number; receivedQuantity: number }>) {
  const po = await getPurchaseOrderById(poId);
  if (!po) throw new Error('Purchase order not found');
  
  for (const item of items) {
    // Update PO item received quantity
    await db.update(schema.purchaseOrderItems)
      .set({ receivedQuantity: item.receivedQuantity })
      .where(eq(schema.purchaseOrderItems.id, item.itemId));
    
    // Get the PO item to find the part
    const poItem = await db.query.purchaseOrderItems.findFirst({
      where: eq(schema.purchaseOrderItems.id, item.itemId),
    });
    
    if (poItem) {
      // Create stock movement
      await createStockMovement({
        ledgerId: po.ledgerId,
        partId: poItem.partId,
        movementType: 'purchase',
        quantity: item.receivedQuantity,
        unitCost: poItem.unitCost,
        referenceType: 'purchase_order',
        referenceId: poId,
        notes: `Received from PO #${po.poNumber}`,
      });
    }
  }
  
  // Update PO status to received
  await updatePurchaseOrderStatus(poId, 'received');
  await db.update(schema.purchaseOrders)
    .set({ actualDeliveryDate: new Date() })
    .where(eq(schema.purchaseOrders.id, poId));
}

// ============================================================================
// JOB PARTS
// ============================================================================

export async function addPartToJob(input: any) {
  const [result] = await db.insert(schema.jobParts).values(input).returning({ id: schema.jobParts.id });
  
  // Create stock movement (deduct from inventory)
  const part = await getPartById(input.partId);
  if (part) {
    await createStockMovement({
      ledgerId: part.ledgerId,
      partId: input.partId,
      movementType: 'sale',
      quantity: -input.quantity, // Negative for outgoing
      unitCost: input.unitCost,
      referenceType: 'job',
      referenceId: input.jobId,
      notes: `Used in job`,
    });
  }
  
  return result.id;
}

export async function getJobParts(jobId: number) {
  return db.query.jobParts.findMany({
    where: eq(schema.jobParts.jobId, jobId),
  });
}

export async function removePartFromJob(id: number) {
  // Get the job part first to reverse stock movement
  const jobPart = await db.query.jobParts.findFirst({
    where: eq(schema.jobParts.id, id),
  });
  
  if (jobPart) {
    const part = await getPartById(jobPart.partId);
    if (part) {
      // Reverse the stock movement
      await createStockMovement({
        ledgerId: part.ledgerId,
        partId: jobPart.partId,
        movementType: 'return',
        quantity: jobPart.quantity, // Positive to add back
        unitCost: jobPart.unitCost,
        referenceType: 'job',
        referenceId: jobPart.jobId,
        notes: `Returned from job`,
      });
    }
  }
  
  await db.delete(schema.jobParts).where(eq(schema.jobParts.id, id));
}

// ============================================================================
// INVENTORY ANALYTICS
// ============================================================================

export async function getInventoryValue(ledgerId: number) {
  const parts = await getPartsByLedger(ledgerId);
  
  const totalCostValue = parts.reduce((sum, p) => sum + (p.stockQuantity * p.costPrice), 0);
  const totalSellValue = parts.reduce((sum, p) => sum + (p.stockQuantity * p.sellPrice), 0);
  const potentialProfit = totalSellValue - totalCostValue;
  
  return {
    totalCostValue,
    totalSellValue,
    potentialProfit,
    totalParts: parts.length,
    totalUnits: parts.reduce((sum, p) => sum + p.stockQuantity, 0),
  };
}

export async function getTopSellingParts(ledgerId: number, limit: number = 10) {
  // Get all job parts for this ledger's jobs
  const movements = await db.query.stockMovements.findMany({
    where: and(
      eq(schema.stockMovements.ledgerId, ledgerId),
      eq(schema.stockMovements.movementType, 'sale')
    ),
    orderBy: [desc(schema.stockMovements.createdAt)],
    limit: 1000, // Last 1000 sales
  });
  
  // Group by part and count
  const partCounts = movements.reduce((acc: any, m) => {
    const partId = m.partId;
    acc[partId] = (acc[partId] || 0) + Math.abs(m.quantity);
    return acc;
  }, {});
  
  // Sort and get top parts
  const sorted = Object.entries(partCounts)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, limit);
  
  // Get part details
  const topParts = [];
  for (const [partId, quantity] of sorted) {
    const part = await getPartById(Number(partId));
    if (part) {
      topParts.push({ ...part, soldQuantity: quantity });
    }
  }
  
  return topParts;
}
