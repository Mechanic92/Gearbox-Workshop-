import { db } from './db';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

/**
 * Demo Data Generator
 * Creates realistic sample data for testing and demonstrations
 */

export async function generateDemoData() {
  console.log('🎭 Generating demo data...\n');

  try {
    // 0. Create default user if not exists
    console.log('👤 Checking for default user...');
    let user = await db.query.users.findFirst({ where: eq(schema.users.id, 1) });
    if (!user) {
      console.log('➕ Creating default user (ID 1)...');
      await db.insert(schema.users).values({
        id: 1,
        openId: 'demo-user-1',
        name: 'Demo User',
        email: 'demo@gearbox.app',
        loginMethod: 'manus',
        role: 'admin',
      });
      user = await db.query.users.findFirst({ where: eq(schema.users.id, 1) });
    }
    console.log('✅ Default user verified.\n');

    // 1. Create demo organization and ledger
    console.log('📊 Creating organization and ledger...');
    
    const [org] = (await db.insert(schema.organizations).values({
      ownerId: 1,
      name: 'Demo Auto Workshop',
      subscriptionTier: 'professional',
      subscriptionStatus: 'active',
    }).returning()) as any[];

    const [ledger] = (await db.insert(schema.ledgers).values({
      organizationId: org.id,
      name: 'Main Workshop',
      type: 'trades',
      gstRegistered: true,
      gstBasis: 'invoice',
      gstFilingFrequency: 'two_monthly',
    }).returning()) as any[];

    console.log(`✅ Created organization: ${org.name}`);
    console.log(`✅ Created ledger: ${ledger.name}\n`);

    // 2. Create demo customers
    console.log('👥 Creating customers...');
    
    const customers = [
      { name: 'John Smith', email: 'john.smith@email.com', phone: '+64211234567', mobile: '+64211234567' },
      { name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '+64212345678', mobile: '+64212345678' },
      { name: 'ABC Transport Ltd', email: 'fleet@abctransport.co.nz', phone: '+6493456789', mobile: '+64211111111' },
      { name: 'Mike Williams', email: 'mike.w@email.com', phone: '+64213456789', mobile: '+64213456789' },
      { name: 'City Couriers', email: 'admin@citycouriers.co.nz', phone: '+6494567890', mobile: '+64212222222' },
      { name: 'Lisa Chen', email: 'lisa.chen@email.com', phone: '+64214567890', mobile: '+64214567890' },
      { name: 'Tech Solutions Inc', email: 'fleet@techsolutions.co.nz', phone: '+6495678901', mobile: '+64213333333' },
      { name: 'David Brown', email: 'david.b@email.com', phone: '+64215678901', mobile: '+64215678901' },
    ];

    const createdCustomers = [];
    for (const customer of customers) {
      const [c] = (await db.insert(schema.customers).values({
        ledgerId: ledger.id,
        ...customer,
      }).returning()) as any[];
      createdCustomers.push(c);
    }

    console.log(`✅ Created ${createdCustomers.length} customers\n`);

    // 3. Create demo vehicles
    console.log('🚗 Creating vehicles...');
    
    const vehicles = [
      { customerId: createdCustomers[0].id, licensePlate: 'ABC123', make: 'Toyota', model: 'Corolla', year: 2019 },
      { customerId: createdCustomers[1].id, licensePlate: 'XYZ789', make: 'Honda', model: 'Civic', year: 2020 },
      { customerId: createdCustomers[2].id, licensePlate: 'FLT001', make: 'Ford', model: 'Transit', year: 2018 },
      { customerId: createdCustomers[2].id, licensePlate: 'FLT002', make: 'Ford', model: 'Transit', year: 2018 },
      { customerId: createdCustomers[3].id, licensePlate: 'DEF456', make: 'Mazda', model: 'CX-5', year: 2021 },
      { customerId: createdCustomers[4].id, licensePlate: 'COU001', make: 'Toyota', model: 'Hiace', year: 2017 },
      { customerId: createdCustomers[5].id, licensePlate: 'GHI789', make: 'Audi', model: 'A4', year: 2022 },
      { customerId: createdCustomers[6].id, licensePlate: 'TSI001', make: 'Nissan', model: 'Navara', year: 2019 },
    ];

    const createdVehicles = [];
    for (const vehicle of vehicles) {
      const [v] = (await db.insert(schema.vehicles).values({
        ledgerId: ledger.id,
        ...vehicle,
      }).returning()) as any[];
      createdVehicles.push(v);
    }

    console.log(`✅ Created ${createdVehicles.length} vehicles\n`);

    // 4. Create demo services
    console.log('🔧 Creating services...');
    
    const services = [
      { name: 'Oil Change', description: 'Full synthetic oil change', basePrice: 89.00, estimatedDuration: 30 },
      { name: 'WoF Inspection', description: 'Warrant of Fitness inspection', basePrice: 65.00, estimatedDuration: 45 },
      { name: 'Brake Service', description: 'Brake pad replacement and inspection', basePrice: 280.00, estimatedDuration: 90 },
      { name: 'Wheel Alignment', description: '4-wheel alignment', basePrice: 120.00, estimatedDuration: 60 },
      { name: 'Full Service', description: 'Comprehensive vehicle service', basePrice: 350.00, estimatedDuration: 120 },
      { name: 'Diagnostics', description: 'Computer diagnostics scan', basePrice: 95.00, estimatedDuration: 45 },
    ];

    const createdServices = [];
    for (const service of services) {
      const [s] = (await db.insert(schema.services).values({
        ledgerId: ledger.id,
        ...service,
      }).returning()) as any[];
      createdServices.push(s);
    }

    console.log(`✅ Created ${createdServices.length} services\n`);

    // 5. Create demo suppliers
    console.log('📦 Creating suppliers...');
    
    const suppliers = [
      { name: 'Repco Auto Parts', email: 'orders@repco.co.nz', phone: '+6495551234', paymentTerms: '30 days' },
      { name: 'Supercheap Auto', email: 'trade@supercheap.co.nz', phone: '+6495552345', paymentTerms: '14 days' },
      { name: 'BNT Auto Parts', email: 'sales@bnt.co.nz', phone: '+6495553456', paymentTerms: '30 days' },
      { name: 'Castrol Oil Distributor', email: 'orders@castrol.co.nz', phone: '+6495554567', paymentTerms: '30 days' },
    ];

    const createdSuppliers = [];
    for (const supplier of suppliers) {
      const [s] = (await db.insert(schema.suppliers).values({
        ledgerId: ledger.id,
        ...supplier,
      }).returning()) as any[];
      createdSuppliers.push(s);
    }

    console.log(`✅ Created ${createdSuppliers.length} suppliers\n`);

    // 6. Create demo part categories
    console.log('📂 Creating part categories...');
    
    const categories = [
      { name: 'Oils & Fluids' },
      { name: 'Filters' },
      { name: 'Brakes' },
      { name: 'Ignition' },
      { name: 'Suspension' },
      { name: 'Electrical' },
    ];

    const createdCategories = [];
    for (const category of categories) {
      const [c] = (await db.insert(schema.partCategories).values({
        ledgerId: ledger.id,
        ...category,
      }).returning()) as any[];
      createdCategories.push(c);
    }

    console.log(`✅ Created ${createdCategories.length} categories\n`);

    // 7. Create demo parts
    console.log('🔩 Creating parts...');
    
    const parts = [
      { partNumber: 'OIL-5W30-5L', name: 'Castrol Edge 5W-30 5L', categoryId: createdCategories[0].id, supplierId: createdSuppliers[3].id, costPrice: 42.50, sellPrice: 75.00, stockQuantity: 24, minStockLevel: 10 },
      { partNumber: 'OIL-10W40-5L', name: 'Castrol GTX 10W-40 5L', categoryId: createdCategories[0].id, supplierId: createdSuppliers[3].id, costPrice: 38.00, sellPrice: 68.00, stockQuantity: 18, minStockLevel: 10 },
      { partNumber: 'AIR-FLT-STD', name: 'Air Filter Standard', categoryId: createdCategories[1].id, supplierId: createdSuppliers[0].id, costPrice: 12.00, sellPrice: 28.00, stockQuantity: 45, minStockLevel: 20 },
      { partNumber: 'OIL-FLT-STD', name: 'Oil Filter Standard', categoryId: createdCategories[1].id, supplierId: createdSuppliers[0].id, costPrice: 8.50, sellPrice: 22.00, stockQuantity: 52, minStockLevel: 25 },
      { partNumber: 'BRK-PAD-FR', name: 'Brake Pads - Front', categoryId: createdCategories[2].id, supplierId: createdSuppliers[1].id, costPrice: 85.00, sellPrice: 150.00, stockQuantity: 8, minStockLevel: 12 },
      { partNumber: 'BRK-PAD-RR', name: 'Brake Pads - Rear', categoryId: createdCategories[2].id, supplierId: createdSuppliers[1].id, costPrice: 75.00, sellPrice: 135.00, stockQuantity: 6, minStockLevel: 12 },
      { partNumber: 'SPARK-PLG-4', name: 'Spark Plugs (Set of 4)', categoryId: createdCategories[3].id, supplierId: createdSuppliers[0].id, costPrice: 24.00, sellPrice: 55.00, stockQuantity: 32, minStockLevel: 15 },
      { partNumber: 'COOLANT-5L', name: 'Coolant 5L', categoryId: createdCategories[0].id, supplierId: createdSuppliers[2].id, costPrice: 18.00, sellPrice: 38.00, stockQuantity: 28, minStockLevel: 15 },
    ];

    const createdParts = [];
    for (const part of parts) {
      const [p] = (await db.insert(schema.parts).values({
        ledgerId: ledger.id,
        ...part,
      }).returning()) as any[];
      createdParts.push(p);
    }

    console.log(`✅ Created ${createdParts.length} parts\n`);

    // 8. Create demo jobs
    console.log('💼 Creating jobs...');
    
    const jobs = [
      { 
        customerId: createdCustomers[0].id, 
        vehicleId: createdVehicles[0].id, 
        jobNumber: 'JOB-001', 
        description: 'Full service and oil change', 
        status: 'completed' as const, 
        quotedPrice: 350.00, 
        finalPrice: 375.00,
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      { 
        customerId: createdCustomers[1].id, 
        vehicleId: createdVehicles[1].id, 
        jobNumber: 'JOB-002', 
        description: 'Brake pad replacement', 
        status: 'completed' as const, 
        quotedPrice: 280.00, 
        finalPrice: 295.00,
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      { 
        customerId: createdCustomers[2].id, 
        vehicleId: createdVehicles[2].id, 
        jobNumber: 'JOB-003', 
        description: 'WoF inspection and minor repairs', 
        status: 'in_progress' as const, 
        quotedPrice: 185.00,
        startedAt: new Date()
      },
      { 
        customerId: createdCustomers[3].id, 
        vehicleId: createdVehicles[4].id, 
        jobNumber: 'JOB-004', 
        description: 'Diagnostics and wheel alignment', 
        status: 'quoted' as const, 
        quotedPrice: 215.00
      },
    ];

    const createdJobs = [];
    for (const job of jobs) {
      const [j] = (await db.insert(schema.jobs).values({
        ledgerId: ledger.id,
        ...job,
      }).returning()) as any[];
      createdJobs.push(j);
    }

    console.log(`✅ Created ${createdJobs.length} jobs\n`);

    // 9. Create demo invoices for completed jobs
    console.log('📄 Creating invoices...');
    
    let invoiceCount = 0;
    for (const job of createdJobs) {
      if (job.status === 'completed' && job.finalPrice) {
        const subtotal = job.finalPrice / 1.15; // Remove GST
        const gstAmount = job.finalPrice - subtotal;
        
        await db.insert(schema.invoices).values({
          jobId: job.id,
          invoiceNumber: `INV-${String(invoiceCount + 1).padStart(4, '0')}`,
          invoiceDate: job.completedAt || new Date(),
          dueDate: new Date((job.completedAt?.getTime() || Date.now()) + 14 * 24 * 60 * 60 * 1000), // 14 days
          subtotal,
          gstAmount,
          totalAmount: job.finalPrice,
          status: invoiceCount === 0 ? 'paid' : 'sent',
          paidDate: invoiceCount === 0 ? job.completedAt : undefined,
        });
        
        invoiceCount++;
      }
    }

    console.log(`✅ Created ${invoiceCount} invoices\n`);

    // 10. Create demo bookings
    console.log('📅 Creating bookings...');
    
    const bookings = [
      {
        customerId: createdCustomers[4].id,
        serviceId: createdServices[4].id, // Full Service
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        duration: 120,
        status: 'confirmed' as const,
        customerName: createdCustomers[4].name,
        customerEmail: createdCustomers[4].email,
        customerPhone: createdCustomers[4].phone,
        vehicleInfo: JSON.stringify({ plate: 'COU001', make: 'Toyota', model: 'Hiace' }),
      },
      {
        customerId: createdCustomers[5].id,
        serviceId: createdServices[1].id, // WoF
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        duration: 45,
        status: 'pending' as const,
        customerName: createdCustomers[5].name,
        customerEmail: createdCustomers[5].email,
        customerPhone: createdCustomers[5].phone,
        vehicleInfo: JSON.stringify({ plate: 'GHI789', make: 'Audi', model: 'A4' }),
      },
    ];

    for (const booking of bookings) {
      await db.insert(schema.bookings).values({
        ledgerId: ledger.id,
        ...booking,
      });
    }

    console.log(`✅ Created ${bookings.length} bookings\n`);

    console.log('🎉 Demo data generation complete!\n');
    console.log('Summary:');
    console.log(`  - 1 organization`);
    console.log(`  - 1 ledger`);
    console.log(`  - ${createdCustomers.length} customers`);
    console.log(`  - ${createdVehicles.length} vehicles`);
    console.log(`  - ${createdServices.length} services`);
    console.log(`  - ${createdSuppliers.length} suppliers`);
    console.log(`  - ${createdCategories.length} part categories`);
    console.log(`  - ${createdParts.length} parts`);
    console.log(`  - ${createdJobs.length} jobs`);
    console.log(`  - ${invoiceCount} invoices`);
    console.log(`  - ${bookings.length} bookings`);
    console.log('');
    console.log('✅ You can now test the application with realistic data!');

  } catch (error) {
    console.error('❌ Error generating demo data:', error);
    throw error;
  }
}

// Run if called directly
const isDirectRun = process.argv[1]?.includes('generate-demo-data');
if (isDirectRun) {
  generateDemoData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
