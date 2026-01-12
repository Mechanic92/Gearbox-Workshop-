CREATE TABLE `accounting_integrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ledgerId` integer NOT NULL,
	`provider` text NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text NOT NULL,
	`tokenExpiresAt` integer NOT NULL,
	`tenantId` text NOT NULL,
	`organizationName` text,
	`isActive` integer DEFAULT true NOT NULL,
	`lastSyncAt` integer,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`ledgerId`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `accounting_sync_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`integrationId` integer NOT NULL,
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`externalId` text,
	`syncDirection` text NOT NULL,
	`status` text NOT NULL,
	`errorMessage` text,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`integrationId`) REFERENCES `accounting_integrations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `billing_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organizationId` integer NOT NULL,
	`stripeInvoiceId` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'nzd' NOT NULL,
	`status` text NOT NULL,
	`invoiceUrl` text,
	`paidAt` integer,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ledgerId` integer NOT NULL,
	`customerId` integer,
	`serviceId` integer NOT NULL,
	`scheduledDate` integer NOT NULL,
	`duration` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`customerName` text NOT NULL,
	`customerEmail` text,
	`customerPhone` text,
	`vehicleInfo` text,
	`notes` text,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`ledgerId`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ledgerId` integer NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`mobile` text,
	`address` text,
	`city` text,
	`postcode` text,
	`notes` text,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`ledgerId`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dvi_comment_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sectionId` integer NOT NULL,
	`comment` text NOT NULL,
	`severity` text NOT NULL,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`sectionId`) REFERENCES `dvi_sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dvi_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`itemId` integer NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` text NOT NULL,
	`caption` text,
	`uploadedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`itemId`) REFERENCES `dvi_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dvi_inspections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ledgerId` integer NOT NULL,
	`jobId` integer,
	`vehicleId` integer,
	`templateId` integer NOT NULL,
	`inspectionNumber` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`shareToken` text,
	`shareExpiryDate` integer,
	`notes` text,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`completedAt` integer,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`ledgerId`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`templateId`) REFERENCES `dvi_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dvi_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inspectionId` integer NOT NULL,
	`sectionId` integer NOT NULL,
	`itemName` text NOT NULL,
	`status` text NOT NULL,
	`comment` text,
	`recommendedAction` text,
	`estimatedCost` real,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`inspectionId`) REFERENCES `dvi_inspections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sectionId`) REFERENCES `dvi_sections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dvi_sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`templateId` integer NOT NULL,
	`name` text NOT NULL,
	`order` integer NOT NULL,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`templateId`) REFERENCES `dvi_templates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dvi_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ledgerId` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`active` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`ledgerId`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoice_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ledgerId` integer NOT NULL,
	`companyName` text NOT NULL,
	`companyLogo` text,
	`companyAddress` text,
	`companyPhone` text,
	`companyEmail` text,
	`bankAccountName` text,
	`bankAccountNumber` text,
	`bankAccountSuffix` text,
	`paymentTermsDays` integer DEFAULT 30 NOT NULL,
	`invoiceFooter` text,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`ledgerId`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`jobId` integer NOT NULL,
	`invoiceNumber` text NOT NULL,
	`invoiceDate` integer NOT NULL,
	`dueDate` integer NOT NULL,
	`subtotal` real NOT NULL,
	`gstAmount` real NOT NULL,
	`totalAmount` real NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`paidDate` integer,
	`notes` text,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices_extended` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoiceId` integer NOT NULL,
	`customBrandingApplied` integer DEFAULT false NOT NULL,
	`emailSentDate` integer,
	`emailSentTo` text,
	`paymentReceivedDate` integer,
	`paymentMethod` text,
	`reminderSentCount` integer DEFAULT 0 NOT NULL,
	`lastReminderSentDate` integer,
	FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `jobCosts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`jobId` integer NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`quantity` real NOT NULL,
	`unitPrice` real NOT NULL,
	`totalCost` real NOT NULL,
	`supplierInvoiceNumber` text,
	`supplierName` text,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `job_parts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`jobId` integer NOT NULL,
	`partId` integer NOT NULL,
	`quantity` integer NOT NULL,
	`unitCost` real NOT NULL,
	`unitPrice` real NOT NULL,
	`totalCost` real NOT NULL,
	`totalPrice` real NOT NULL,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`partId`) REFERENCES `parts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ledgerId` integer NOT NULL,
	`customerId` integer,
	`vehicleId` integer,
	`jobNumber` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'quoted' NOT NULL,
	`quotedPrice` real NOT NULL,
	`finalPrice` real,
	`customerName` text,
	`customerPhone` text,
	`customerEmail` text,
	`startedAt` integer,
	`completedAt` integer,
	`notes` text,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`ledgerId`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ledgerAccess` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ledgerId` integer NOT NULL,
	`userId` integer NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`ledgerId`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ledgers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organizationId` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`gstRegistered` integer DEFAULT false NOT NULL,
	`gstBasis` text DEFAULT 'payments',
	`gstFilingFrequency` text DEFAULT 'two_monthly',
	`aimEnabled` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ownerId` integer NOT NULL,
	`name` text NOT NULL,
	`subscriptionTier` text DEFAULT 'starter' NOT NULL,
	`subscriptionStatus` text DEFAULT 'active' NOT NULL,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `part_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ledgerId` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`parentId` integer,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`ledgerId`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parentId`) REFERENCES `part_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `parts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ledgerId` integer NOT NULL,
	`partNumber` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`categoryId` integer,
	`supplierId` integer,
	`costPrice` real NOT NULL,
	`sellPrice` real NOT NULL,
	`stockQuantity` integer DEFAULT 0 NOT NULL,
	`minStockLevel` integer DEFAULT 0 NOT NULL,
	`maxStockLevel` integer,
	`unit` text DEFAULT 'each' NOT NULL,
	`location` text,
	`barcode` text,
	`imageUrl` text,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`ledgerId`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`categoryId`) REFERENCES `part_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchase_order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purchaseOrderId` integer NOT NULL,
	`partId` integer NOT NULL,
	`quantity` integer NOT NULL,
	`unitCost` real NOT NULL,
	`totalCost` real NOT NULL,
	`receivedQuantity` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`purchaseOrderId`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`partId`) REFERENCES `parts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ledgerId` integer NOT NULL,
	`supplierId` integer NOT NULL,
	`poNumber` text NOT NULL,
	`orderDate` integer NOT NULL,
	`expectedDeliveryDate` integer,
	`actualDeliveryDate` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`subtotal` real NOT NULL,
	`gstAmount` real NOT NULL,
	`totalAmount` real NOT NULL,
	`notes` text,
	`createdBy` integer,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`ledgerId`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quote_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quoteId` integer NOT NULL,
	`description` text NOT NULL,
	`quantity` real NOT NULL,
	`unitPrice` real NOT NULL,
	`totalPrice` real NOT NULL,
	`itemType` text NOT NULL,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`quoteId`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ledgerId` integer NOT NULL,
	`bookingId` integer,
	`jobId` integer,
	`quoteNumber` text NOT NULL,
	`customerId` integer NOT NULL,
	`subtotal` real NOT NULL,
	`gstAmount` real NOT NULL,
	`totalAmount` real NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`expiryDate` integer NOT NULL,
	`approvedDate` integer,
	`notes` text,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`ledgerId`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ledgerId` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`basePrice` real NOT NULL,
	`estimatedDuration` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`ledgerId`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ledgerId` integer NOT NULL,
	`partId` integer NOT NULL,
	`movementType` text NOT NULL,
	`quantity` integer NOT NULL,
	`unitCost` real,
	`referenceType` text,
	`referenceId` integer,
	`notes` text,
	`createdBy` integer,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`ledgerId`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`partId`) REFERENCES `parts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tier` text NOT NULL,
	`stripePriceIdMonthly` text NOT NULL,
	`stripePriceIdYearly` text NOT NULL,
	`priceMonthly` real NOT NULL,
	`priceYearly` real NOT NULL,
	`currency` text DEFAULT 'nzd' NOT NULL,
	`maxUsers` integer NOT NULL,
	`maxJobsPerMonth` integer NOT NULL,
	`maxStorageMb` integer NOT NULL,
	`features` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscription_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organizationId` integer NOT NULL,
	`billingPeriodStart` integer NOT NULL,
	`billingPeriodEnd` integer NOT NULL,
	`jobsCreated` integer DEFAULT 0 NOT NULL,
	`storageUsedMb` integer DEFAULT 0 NOT NULL,
	`activeUsers` integer DEFAULT 0 NOT NULL,
	`apiCalls` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organizationId` integer NOT NULL,
	`stripeCustomerId` text NOT NULL,
	`stripeSubscriptionId` text NOT NULL,
	`stripePriceId` text NOT NULL,
	`status` text NOT NULL,
	`currentPeriodStart` integer NOT NULL,
	`currentPeriodEnd` integer NOT NULL,
	`cancelAtPeriodEnd` integer DEFAULT false NOT NULL,
	`trialEnd` integer,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ledgerId` integer NOT NULL,
	`name` text NOT NULL,
	`contactPerson` text,
	`email` text,
	`phone` text,
	`address` text,
	`accountNumber` text,
	`paymentTerms` text,
	`notes` text,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`ledgerId`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`lastSignedIn` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ledgerId` integer NOT NULL,
	`customerId` integer,
	`licensePlate` text NOT NULL,
	`vin` text,
	`make` text,
	`model` text,
	`year` integer,
	`wofExpiry` integer,
	`regoExpiry` integer,
	`customerName` text,
	`customerPhone` text,
	`customerEmail` text,
	`notes` text,
	`createdAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
	FOREIGN KEY (`ledgerId`) REFERENCES `ledgers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `accounting_integration_ledger_idx` ON `accounting_integrations` (`ledgerId`);--> statement-breakpoint
CREATE INDEX `accounting_sync_integration_idx` ON `accounting_sync_log` (`integrationId`);--> statement-breakpoint
CREATE UNIQUE INDEX `billing_history_stripeInvoiceId_unique` ON `billing_history` (`stripeInvoiceId`);--> statement-breakpoint
CREATE INDEX `billing_org_idx` ON `billing_history` (`organizationId`);--> statement-breakpoint
CREATE INDEX `billing_stripe_invoice_idx` ON `billing_history` (`stripeInvoiceId`);--> statement-breakpoint
CREATE INDEX `booking_ledger_idx` ON `bookings` (`ledgerId`);--> statement-breakpoint
CREATE INDEX `booking_customer_idx` ON `bookings` (`customerId`);--> statement-breakpoint
CREATE INDEX `booking_date_idx` ON `bookings` (`scheduledDate`);--> statement-breakpoint
CREATE INDEX `booking_status_idx` ON `bookings` (`status`);--> statement-breakpoint
CREATE INDEX `customer_ledger_idx` ON `customers` (`ledgerId`);--> statement-breakpoint
CREATE INDEX `customer_name_idx` ON `customers` (`name`);--> statement-breakpoint
CREATE INDEX `customer_email_idx` ON `customers` (`email`);--> statement-breakpoint
CREATE INDEX `dvi_comment_section_idx` ON `dvi_comment_templates` (`sectionId`);--> statement-breakpoint
CREATE INDEX `dvi_image_item_idx` ON `dvi_images` (`itemId`);--> statement-breakpoint
CREATE INDEX `dvi_inspection_ledger_idx` ON `dvi_inspections` (`ledgerId`);--> statement-breakpoint
CREATE INDEX `dvi_inspection_job_idx` ON `dvi_inspections` (`jobId`);--> statement-breakpoint
CREATE INDEX `dvi_inspection_vehicle_idx` ON `dvi_inspections` (`vehicleId`);--> statement-breakpoint
CREATE INDEX `dvi_inspection_number_idx` ON `dvi_inspections` (`inspectionNumber`);--> statement-breakpoint
CREATE INDEX `dvi_inspection_token_idx` ON `dvi_inspections` (`shareToken`);--> statement-breakpoint
CREATE INDEX `dvi_item_inspection_idx` ON `dvi_items` (`inspectionId`);--> statement-breakpoint
CREATE INDEX `dvi_item_section_idx` ON `dvi_items` (`sectionId`);--> statement-breakpoint
CREATE INDEX `dvi_section_template_idx` ON `dvi_sections` (`templateId`);--> statement-breakpoint
CREATE INDEX `dvi_template_ledger_idx` ON `dvi_templates` (`ledgerId`);--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_settings_ledgerId_unique` ON `invoice_settings` (`ledgerId`);--> statement-breakpoint
CREATE INDEX `invoice_settings_ledger_idx` ON `invoice_settings` (`ledgerId`);--> statement-breakpoint
CREATE INDEX `invoice_job_idx` ON `invoices` (`jobId`);--> statement-breakpoint
CREATE INDEX `invoice_number_idx` ON `invoices` (`invoiceNumber`);--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_extended_invoiceId_unique` ON `invoices_extended` (`invoiceId`);--> statement-breakpoint
CREATE INDEX `invoice_extended_idx` ON `invoices_extended` (`invoiceId`);--> statement-breakpoint
CREATE INDEX `job_cost_job_idx` ON `jobCosts` (`jobId`);--> statement-breakpoint
CREATE INDEX `job_cost_type_idx` ON `jobCosts` (`type`);--> statement-breakpoint
CREATE INDEX `job_part_job_idx` ON `job_parts` (`jobId`);--> statement-breakpoint
CREATE INDEX `job_part_part_idx` ON `job_parts` (`partId`);--> statement-breakpoint
CREATE INDEX `job_ledger_idx` ON `jobs` (`ledgerId`);--> statement-breakpoint
CREATE INDEX `job_number_idx` ON `jobs` (`jobNumber`);--> statement-breakpoint
CREATE INDEX `job_status_idx` ON `jobs` (`status`);--> statement-breakpoint
CREATE INDEX `ledger_user_idx` ON `ledgerAccess` (`ledgerId`,`userId`);--> statement-breakpoint
CREATE INDEX `ledger_org_idx` ON `ledgers` (`organizationId`);--> statement-breakpoint
CREATE INDEX `org_owner_idx` ON `organizations` (`ownerId`);--> statement-breakpoint
CREATE INDEX `part_category_ledger_idx` ON `part_categories` (`ledgerId`);--> statement-breakpoint
CREATE INDEX `part_ledger_idx` ON `parts` (`ledgerId`);--> statement-breakpoint
CREATE INDEX `part_number_idx` ON `parts` (`partNumber`);--> statement-breakpoint
CREATE INDEX `part_category_idx` ON `parts` (`categoryId`);--> statement-breakpoint
CREATE INDEX `part_supplier_idx` ON `parts` (`supplierId`);--> statement-breakpoint
CREATE INDEX `po_item_po_idx` ON `purchase_order_items` (`purchaseOrderId`);--> statement-breakpoint
CREATE INDEX `po_item_part_idx` ON `purchase_order_items` (`partId`);--> statement-breakpoint
CREATE INDEX `po_ledger_idx` ON `purchase_orders` (`ledgerId`);--> statement-breakpoint
CREATE INDEX `po_supplier_idx` ON `purchase_orders` (`supplierId`);--> statement-breakpoint
CREATE INDEX `po_number_idx` ON `purchase_orders` (`poNumber`);--> statement-breakpoint
CREATE INDEX `quote_item_idx` ON `quote_items` (`quoteId`);--> statement-breakpoint
CREATE INDEX `quote_ledger_idx` ON `quotes` (`ledgerId`);--> statement-breakpoint
CREATE INDEX `quote_booking_idx` ON `quotes` (`bookingId`);--> statement-breakpoint
CREATE INDEX `quote_job_idx` ON `quotes` (`jobId`);--> statement-breakpoint
CREATE INDEX `quote_customer_idx` ON `quotes` (`customerId`);--> statement-breakpoint
CREATE INDEX `quote_number_idx` ON `quotes` (`quoteNumber`);--> statement-breakpoint
CREATE INDEX `quote_status_idx` ON `quotes` (`status`);--> statement-breakpoint
CREATE INDEX `service_ledger_idx` ON `services` (`ledgerId`);--> statement-breakpoint
CREATE INDEX `stock_movement_ledger_idx` ON `stock_movements` (`ledgerId`);--> statement-breakpoint
CREATE INDEX `stock_movement_part_idx` ON `stock_movements` (`partId`);--> statement-breakpoint
CREATE INDEX `stock_movement_created_idx` ON `stock_movements` (`createdAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_plans_tier_unique` ON `subscription_plans` (`tier`);--> statement-breakpoint
CREATE INDEX `usage_org_idx` ON `subscription_usage` (`organizationId`);--> statement-breakpoint
CREATE INDEX `usage_period_idx` ON `subscription_usage` (`billingPeriodStart`,`billingPeriodEnd`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_organizationId_unique` ON `subscriptions` (`organizationId`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_stripeSubscriptionId_unique` ON `subscriptions` (`stripeSubscriptionId`);--> statement-breakpoint
CREATE INDEX `subscription_org_idx` ON `subscriptions` (`organizationId`);--> statement-breakpoint
CREATE INDEX `subscription_stripe_sub_idx` ON `subscriptions` (`stripeSubscriptionId`);--> statement-breakpoint
CREATE INDEX `supplier_ledger_idx` ON `suppliers` (`ledgerId`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE INDEX `vehicle_ledger_idx` ON `vehicles` (`ledgerId`);--> statement-breakpoint
CREATE INDEX `vehicle_plate_idx` ON `vehicles` (`licensePlate`);