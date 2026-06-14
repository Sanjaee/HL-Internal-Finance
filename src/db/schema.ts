import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  date,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums
export const productTypeEnum = pgEnum("product_type", ["LM", "BR"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["PIUTANG", "LUNAS"]);
export const bonusLedgerTypeEnum = pgEnum("bonus_ledger_type", ["EARNED", "CONSUMED"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerCode: varchar("customer_code", { length: 30 }).unique(),
  name: varchar("name", { length: 200 }).notNull(),
  bonusThreshold: decimal("bonus_threshold", { precision: 18, scale: 2 }).notNull(),
  accumulatedBonusOmzet: decimal("accumulated_bonus_omzet", { precision: 18, scale: 2 }).default("0"),
  grantedBonusCount: integer("granted_bonus_count").default(0),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  uniqueIndex("customers_code_idx").on(table.customerCode),
  index("customers_name_idx").on(table.name),
]);

// Customer Discount Groups table
export const customerDiscountGroups = pgTable("customer_discount_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  productType: productTypeEnum("product_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("customer_discount_groups_customer_id_idx").on(table.customerId),
]);

// Customer Discount Details table
export const customerDiscountDetails = pgTable("customer_discount_details", {
  id: uuid("id").defaultRandom().primaryKey(),
  discountGroupId: uuid("discount_group_id")
    .notNull()
    .references(() => customerDiscountGroups.id),
  sequenceNo: integer("sequence_no").notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("customer_discount_details_group_id_idx").on(table.discountGroupId),
]);

// Products table
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  productCode: varchar("product_code", { length: 30 }).unique(),
  name: varchar("name", { length: 200 }).notNull(),
  productType: productTypeEnum("product_type").notNull(),
  costPrice: decimal("cost_price", { precision: 18, scale: 2 }).notNull(),
  basePrice: decimal("base_price", { precision: 18, scale: 2 }).notNull(),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  uniqueIndex("products_code_idx").on(table.productCode),
  index("products_type_idx").on(table.productType),
  index("products_name_idx").on(table.name),
]);

// Transactions table
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  bonNumber: varchar("bon_number", { length: 100 }).notNull().unique(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  transactionDate: date("transaction_date").notNull(),
  paymentDate: timestamp("payment_date"),
  description: text("description"),
  shippingCost: decimal("shipping_cost", { precision: 18, scale: 2 }).default("0"),
  isBonusTransaction: boolean("is_bonus_transaction").default(false),
  status: transactionStatusEnum("status").default("PIUTANG"),
  subtotalOmzet: decimal("subtotal_omzet", { precision: 18, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 18, scale: 2 }).default("0"),
  totalProfit: decimal("total_profit", { precision: 18, scale: 2 }).default("0"),
  createdBy: uuid("created_by")
    .references(() => users.id),
  updatedBy: uuid("updated_by")
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("transactions_bon_number_idx").on(table.bonNumber),
  index("transactions_customer_id_idx").on(table.customerId),
  index("transactions_date_idx").on(table.transactionDate),
  index("transactions_status_idx").on(table.status),
]);

// Transaction Items table
export const transactionItems = pgTable("transaction_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionId: uuid("transaction_id")
    .notNull()
    .references(() => transactions.id),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  productNameSnapshot: varchar("product_name_snapshot", { length: 200 }),
  productType: productTypeEnum("product_type"),
  quantity: integer("quantity").notNull(),
  basePrice: decimal("base_price", { precision: 18, scale: 2 }),
  costPrice: decimal("cost_price", { precision: 18, scale: 2 }),
  discountPercentageEffective: decimal("discount_percentage_effective", { precision: 8, scale: 4 }),
  discountedUnitPrice: decimal("discounted_unit_price", { precision: 18, scale: 2 }),
  lineOmzet: decimal("line_omzet", { precision: 18, scale: 2 }),
  lineProfit: decimal("line_profit", { precision: 18, scale: 2 }),
  isBonusItem: boolean("is_bonus_item").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("transaction_items_transaction_id_idx").on(table.transactionId),
  index("transaction_items_product_id_idx").on(table.productId),
]);

// Transaction Item Discount Snapshots table
export const transactionItemDiscountSnapshots = pgTable("transaction_item_discount_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionItemId: uuid("transaction_item_id")
    .notNull()
    .references(() => transactionItems.id),
  sequenceNo: integer("sequence_no").notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull(),
}, (table) => [
  index("ti_discount_snapshots_item_id_idx").on(table.transactionItemId),
]);

// Customer Bonus Ledgers table
export const customerBonusLedgers = pgTable("customer_bonus_ledgers", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  transactionId: uuid("transaction_id")
    .references(() => transactions.id),
  ledgerType: bonusLedgerTypeEnum("ledger_type").notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  notes: varchar("notes", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("customer_bonus_ledgers_customer_id_idx").on(table.customerId),
  index("customer_bonus_ledgers_transaction_id_idx").on(table.transactionId),
]);

// Bonus Redemptions table
export const bonusRedemptions = pgTable("bonus_redemptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  transactionId: uuid("transaction_id")
    .notNull()
    .references(() => transactions.id),
  bonusCount: integer("bonus_count").notNull(),
  thresholdAmount: decimal("threshold_amount", { precision: 18, scale: 2 }).notNull(),
  consumedAmount: decimal("consumed_amount", { precision: 18, scale: 2 }).notNull(),
  remainingAmount: decimal("remaining_amount", { precision: 18, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("bonus_redemptions_customer_id_idx").on(table.customerId),
  index("bonus_redemptions_transaction_id_idx").on(table.transactionId),
]);
