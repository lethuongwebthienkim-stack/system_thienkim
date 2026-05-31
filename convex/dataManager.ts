import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { listSeedableModuleKeys } from "./seeders";
import type { TableNames } from "./_generated/dataModel";
import { SEED_MODULE_METADATA } from "../lib/modules/seed-registry";

// ============================================================
// DATA MANAGER - Quản lý clear data cho hệ thống
// NOTE: Seed logic đã được migrate sang seedManager.ts
// Best practices: Batch processing, async operations, safe deletion
// ============================================================

// === CONSTANTS ===
const MAX_COUNT_LIMIT = 1000; // Max records to count (show "1000+" if exceeded)
const BATCH_DELETE_LIMIT = 500; // Records per delete batch to avoid timeout

const EXTRA_TABLES: TableNames[] = [
  "moduleFields",
  "moduleFeatures",
  "moduleSettings",
  "convexDashboard",
  "activityLogs",
  "menuItems",
  "homeComponents",
  "images",
] as TableNames[];

// Danh sách các bảng trong hệ thống
const ALL_TABLES = Array.from(new Set([
  ...listSeedableModuleKeys(),
  ...EXTRA_TABLES,
])) as TableNames[];

type TableName = TableNames;
type FieldIssue = {
  count: number;
  field: string;
  sampleIds: string[];
};
type ContractStatus = "critical" | "empty" | "ok" | "warning";
type DataContract = {
  label: string;
  optional?: readonly string[];
  recommended?: readonly string[];
  required: readonly string[];
  table: TableName;
  deprecated?: readonly string[];
};

const SYSTEM_DOC_FIELDS = new Set(["_creationTime", "_id"]);
const CONTRACT_SAMPLE_LIMIT_DEFAULT = 100;
const CONTRACT_SAMPLE_LIMIT_MAX = 500;

const DATA_CONTRACTS: DataContract[] = [
  {
    label: "System modules",
    optional: ["dependencies", "dependencyType", "updatedBy"],
    required: ["category", "description", "enabled", "icon", "isCore", "key", "name", "order"],
    table: "adminModules",
  },
  {
    label: "Module fields",
    optional: ["group", "linkedFeature"],
    required: ["enabled", "fieldKey", "isSystem", "moduleKey", "name", "order", "required", "type"],
    table: "moduleFields",
  },
  {
    label: "Module features",
    optional: ["description", "linkedFieldKey"],
    required: ["enabled", "featureKey", "moduleKey", "name"],
    table: "moduleFeatures",
  },
  {
    label: "Module settings",
    required: ["moduleKey", "settingKey", "value"],
    table: "moduleSettings",
  },
  {
    label: "Product categories",
    optional: [
      "description",
      "filterFooterContent",
      "image",
      "parentId",
      "productDetailFaqEnabled",
      "productDetailFaqItems",
      "productDetailFaqStyle",
      "productDetailSuffixContent",
    ],
    required: ["active", "name", "order", "slug"],
    table: "productCategories",
  },
  {
    label: "Products",
    optional: [
      "affiliateLink",
      "combos",
      "description",
      "digitalCredentialsTemplate",
      "digitalDeliveryType",
      "hasVariants",
      "htmlRender",
      "image",
      "imageStorageId",
      "imageStorageIds",
      "images",
      "markdownRender",
      "metaDescription",
      "metaTitle",
      "optionIds",
      "productType",
      "productTypeId",
      "renderType",
      "salePrice",
    ],
    recommended: ["effectivePrice"],
    required: ["categoryId", "name", "order", "price", "sales", "sku", "slug", "status", "stock"],
    table: "products",
  },
  {
    label: "Product variants",
    optional: ["allowBackorder", "barcode", "image", "images", "price", "salePrice", "stock"],
    required: ["optionValues", "order", "productId", "sku", "status"],
    table: "productVariants",
  },
  {
    label: "Product types",
    optional: ["description", "priceRanges"],
    required: ["active", "name", "order", "slug"],
    table: "productTypes",
  },
  {
    label: "Product attributes",
    optional: ["displayConfig", "iconPath", "isSpecialFilter"],
    required: ["code", "filterType", "inputType", "isFilterable", "name", "order", "slug"],
    table: "attributeGroups",
  },
  {
    label: "Attribute terms",
    optional: ["description", "iconType", "iconValue", "metadata"],
    required: ["active", "groupId", "name", "order", "slug"],
    table: "attributeTerms",
  },
  {
    label: "Post categories",
    optional: ["description", "parentId", "thumbnail"],
    required: ["active", "name", "order", "slug"],
    table: "postCategories",
  },
  {
    label: "Posts",
    optional: ["authorId", "authorName", "excerpt", "htmlRender", "markdownRender", "metaDescription", "metaTitle", "publishedAt", "renderType", "thumbnail", "thumbnailStorageId"],
    required: ["categoryId", "content", "order", "slug", "status", "title", "views"],
    table: "posts",
  },
  {
    label: "Images",
    optional: ["alt", "extension", "folder", "height", "isOrphan", "uploadedBy", "usageCheckedAt", "usageCount", "urlStorageKey", "usages", "width"],
    required: ["filename", "mimeType", "size", "storageId"],
    table: "images",
  },
  {
    label: "File references",
    optional: ["mediaId", "purpose"],
    required: ["createdAt", "ownerField", "ownerId", "ownerTable", "storageId", "updatedAt"],
    table: "fileReferences",
  },
  {
    label: "Menus",
    required: ["location", "name"],
    table: "menus",
  },
  {
    label: "Menu items",
    optional: ["icon", "openInNewTab", "parentId"],
    required: ["active", "depth", "label", "menuId", "order", "url"],
    table: "menuItems",
  },
  {
    label: "Home components",
    required: ["active", "config", "order", "title", "type"],
    table: "homeComponents",
  },
  {
    label: "Settings",
    required: ["group", "key", "value"],
    table: "settings",
  },
  {
    label: "Users",
    optional: ["avatar", "lastLogin", "passwordHash", "phone", "superAdminTrialCreatedAt", "superAdminTrialDurationDays", "superAdminTrialExpiresAt"],
    required: ["email", "name", "roleId", "status"],
    table: "users",
  },
  {
    label: "Roles",
    optional: ["color", "isSuperAdmin"],
    required: ["description", "isSystem", "name", "permissions"],
    table: "roles",
  },
  {
    label: "Customers",
    optional: ["address", "addressDetail", "addressFormat", "avatar", "city", "districtCode", "districtName", "notes", "passwordHash", "provinceCode", "provinceName", "wardCode", "wardName"],
    required: ["email", "name", "ordersCount", "phone", "status", "totalSpent"],
    table: "customers",
  },
  {
    label: "Service categories",
    optional: ["description", "parentId", "thumbnail"],
    required: ["active", "name", "order", "slug"],
    table: "serviceCategories",
  },
  {
    label: "Services",
    optional: [
      "bookingCapacityPerSlot",
      "bookingDurationMin",
      "bookingEnabled",
      "bookingSlotIntervalMin",
      "bookingSlotTemplateByWeekday",
      "bookingSlotTemplateDefault",
      "duration",
      "excerpt",
      "featured",
      "htmlRender",
      "markdownRender",
      "metaDescription",
      "metaTitle",
      "price",
      "publishedAt",
      "renderType",
      "thumbnail",
      "thumbnailStorageId",
    ],
    required: ["categoryId", "content", "order", "slug", "status", "title", "views"],
    table: "services",
  },
  {
    label: "Orders",
    optional: ["discountAmount", "isDigitalOrder", "note", "paymentMethod", "paymentStatus", "promotionCode", "promotionId", "shippingAddress", "shippingMethodId", "shippingMethodLabel", "trackingNumber"],
    required: ["customerId", "items", "orderNumber", "shippingFee", "status", "subtotal", "totalAmount"],
    table: "orders",
  },
  {
    label: "Carts",
    optional: ["customerId", "expiresAt", "note", "sessionId"],
    required: ["itemsCount", "status", "totalAmount"],
    table: "carts",
  },
  {
    label: "Cart items",
    optional: ["productImage", "variantId"],
    required: ["cartId", "price", "productId", "productName", "quantity", "subtotal"],
    table: "cartItems",
  },
  {
    label: "Wishlist",
    optional: ["note", "variantId"],
    required: ["customerId", "productId"],
    table: "wishlist",
  },
  {
    label: "Promotions",
    optional: [
      "applicableIds",
      "applicableTo",
      "budget",
      "budgetUsed",
      "code",
      "customerGroupIds",
      "customerTierIds",
      "customerType",
      "description",
      "discountConfig",
      "discountValue",
      "displayOnPage",
      "endDate",
      "excludeIds",
      "featured",
      "maxDiscountAmount",
      "minOrderAmount",
      "minOrderHistory",
      "minQuantity",
      "minTotalSpent",
      "priority",
      "recurringDays",
      "recurringHours",
      "scheduleType",
      "stackable",
      "startDate",
      "thumbnail",
      "usageLimit",
      "usagePerCustomer",
    ],
    required: ["discountType", "name", "order", "promotionType", "status", "usedCount"],
    table: "promotions",
  },
  {
    label: "Contact inquiries",
    optional: ["email", "handledAt", "handledBy", "phone"],
    required: ["createdAt", "message", "name", "sourcePath", "status", "subject", "updatedAt"],
    table: "contactInquiries",
  },
  {
    label: "Notifications",
    optional: ["scheduledAt", "sendEmail", "sentAt", "targetIds"],
    required: ["content", "order", "readCount", "status", "targetType", "title", "type"],
    table: "notifications",
  },
  {
    label: "Landing pages",
    optional: ["content", "faqItems", "heroImage", "order", "primaryIntent", "publishedAt", "relatedProductSlugs", "relatedServiceSlugs", "relatedSlugs"],
    required: ["landingType", "slug", "status", "summary", "title", "updatedAt"],
    table: "landingPages",
  },
];

// === TABLE CATEGORIES ===
const TABLE_CATEGORIES: Record<string, string> = {
  activityLogs: "logs",
  convexDashboard: "system",
  homeComponents: "website",
  images: "media",
  menuItems: "website",
  menus: "website",
  moduleFeatures: "system",
  moduleFields: "system",
  moduleSettings: "system",
};

const SYSTEM_TABLES = new Set([
  ...Object.entries(SEED_MODULE_METADATA)
    .filter(([, meta]) => meta.category === "system")
    .map(([key]) => key),
  "moduleFields",
  "moduleFeatures",
  "moduleSettings",
  "convexDashboard",
]);

// ============================================================
// QUERIES - Đếm số lượng records trong các bảng
// ============================================================

export const getTableStats = query({
  args: {},
  handler: async (ctx) => {
    const results = await Promise.all(
      ALL_TABLES.map(async (table) => {
        const records = await ctx.db.query(table).take(MAX_COUNT_LIMIT);
        const metadataCategory = SEED_MODULE_METADATA[table]?.category;
        return {
          category: metadataCategory || TABLE_CATEGORIES[table] || "other",
          count: records.length,
          isApproximate: records.length === MAX_COUNT_LIMIT,
          table,
        };
      })
    );
    
    return results;
  },
  returns: v.array(v.object({
    category: v.string(),
    count: v.number(),
    isApproximate: v.boolean(),
    table: v.string(),
  })),
});

function addFieldIssue(map: Map<string, FieldIssue>, field: string, recordId: string) {
  const current = map.get(field) ?? { count: 0, field, sampleIds: [] };
  current.count += 1;
  if (current.sampleIds.length < 3) {
    current.sampleIds.push(recordId);
  }
  map.set(field, current);
}

function fieldIssuesToArray(map: Map<string, FieldIssue>) {
  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.field.localeCompare(b.field));
}

function getKnownContractFields(contract: DataContract) {
  return new Set([
    ...contract.required,
    ...(contract.recommended ?? []),
    ...(contract.optional ?? []),
    ...(contract.deprecated ?? []),
  ]);
}

export const scanDataContracts = query({
  args: {
    runId: v.optional(v.number()),
    sampleSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sampleSize = Math.min(args.sampleSize ?? CONTRACT_SAMPLE_LIMIT_DEFAULT, CONTRACT_SAMPLE_LIMIT_MAX);
    const tables = await Promise.all(
      DATA_CONTRACTS.map(async (contract) => {
        const records = await ctx.db.query(contract.table).take(sampleSize);
        const knownFields = getKnownContractFields(contract);
        const missingRequired = new Map<string, FieldIssue>();
        const missingRecommended = new Map<string, FieldIssue>();
        const extraFields = new Map<string, FieldIssue>();
        const deprecatedFields = new Map<string, FieldIssue>();

        for (const record of records) {
          const doc = record as Record<string, unknown>;
          const recordId = String(doc._id);

          for (const field of contract.required) {
            if (!(field in doc)) {
              addFieldIssue(missingRequired, field, recordId);
            }
          }

          for (const field of contract.recommended ?? []) {
            if (!(field in doc)) {
              addFieldIssue(missingRecommended, field, recordId);
            }
          }

          for (const field of contract.deprecated ?? []) {
            if (field in doc) {
              addFieldIssue(deprecatedFields, field, recordId);
            }
          }

          for (const field of Object.keys(doc)) {
            if (!SYSTEM_DOC_FIELDS.has(field) && !knownFields.has(field)) {
              addFieldIssue(extraFields, field, recordId);
            }
          }
        }

        const missingRequiredList = fieldIssuesToArray(missingRequired);
        const missingRecommendedList = fieldIssuesToArray(missingRecommended);
        const extraFieldsList = fieldIssuesToArray(extraFields);
        const deprecatedFieldsList = fieldIssuesToArray(deprecatedFields);
        const totalIssues =
          missingRequiredList.reduce((sum, issue) => sum + issue.count, 0) +
          missingRecommendedList.reduce((sum, issue) => sum + issue.count, 0) +
          extraFieldsList.reduce((sum, issue) => sum + issue.count, 0) +
          deprecatedFieldsList.reduce((sum, issue) => sum + issue.count, 0);
        const status: ContractStatus = records.length === 0
          ? "empty"
          : missingRequiredList.length > 0
            ? "critical"
            : totalIssues > 0
              ? "warning"
              : "ok";

        return {
          deprecatedFields: deprecatedFieldsList,
          extraFields: extraFieldsList,
          label: contract.label,
          missingRecommended: missingRecommendedList,
          missingRequired: missingRequiredList,
          scanned: records.length,
          status,
          table: contract.table,
          totalIssues,
        };
      })
    );

    return {
      runId: args.runId ?? 0,
      sampleSize,
      summary: {
        critical: tables.filter((table) => table.status === "critical").length,
        empty: tables.filter((table) => table.status === "empty").length,
        ok: tables.filter((table) => table.status === "ok").length,
        scannedRecords: tables.reduce((sum, table) => sum + table.scanned, 0),
        tables: tables.length,
        totalIssues: tables.reduce((sum, table) => sum + table.totalIssues, 0),
        warnings: tables.filter((table) => table.status === "warning").length,
      },
      tables,
    };
  },
  returns: v.object({
    runId: v.number(),
    sampleSize: v.number(),
    summary: v.object({
      critical: v.number(),
      empty: v.number(),
      ok: v.number(),
      scannedRecords: v.number(),
      tables: v.number(),
      totalIssues: v.number(),
      warnings: v.number(),
    }),
    tables: v.array(v.object({
      deprecatedFields: v.array(v.object({ count: v.number(), field: v.string(), sampleIds: v.array(v.string()) })),
      extraFields: v.array(v.object({ count: v.number(), field: v.string(), sampleIds: v.array(v.string()) })),
      label: v.string(),
      missingRecommended: v.array(v.object({ count: v.number(), field: v.string(), sampleIds: v.array(v.string()) })),
      missingRequired: v.array(v.object({ count: v.number(), field: v.string(), sampleIds: v.array(v.string()) })),
      scanned: v.number(),
      status: v.union(v.literal("critical"), v.literal("empty"), v.literal("ok"), v.literal("warning")),
      table: v.string(),
      totalIssues: v.number(),
    })),
  }),
});

// ============================================================
// CLEAR FUNCTIONS - Xóa data theo bảng hoặc category
// ============================================================

export const clearTable = mutation({
  args: { table: v.string() },
  handler: async (ctx, args) => {
    const tableName = args.table as TableName;
    if (!ALL_TABLES.includes(tableName)) {
      throw new Error(`Invalid table: ${args.table}`);
    }
    
    const records = await ctx.db.query(tableName).take(BATCH_DELETE_LIMIT);
    await Promise.all(records.map( async record => ctx.db.delete(record._id)));
    
    const remaining = await ctx.db.query(tableName).first();
    return { deleted: records.length, hasMore: remaining !== null };
  },
  returns: v.object({ deleted: v.number(), hasMore: v.boolean() }),
});

export const clearAllData = mutation({
  args: { 
    excludeSystem: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tablesToClear = args.excludeSystem 
      ? ALL_TABLES.filter(t => !SYSTEM_TABLES.has(t))
      : [...ALL_TABLES];
    
    const results: { table: string; deleted: number }[] = [];
    let totalDeleted = 0;
    let totalBatchSize = 0;
    
    for (const table of tablesToClear) {
      if (totalBatchSize >= BATCH_DELETE_LIMIT) {break;}
      
      const batchLimit = Math.min(BATCH_DELETE_LIMIT, BATCH_DELETE_LIMIT - totalBatchSize);
      const records = await ctx.db.query(table).take(batchLimit);
      
      await Promise.all(records.map( async record => ctx.db.delete(record._id)));
      
      if (records.length > 0) {
        results.push({ deleted: records.length, table });
        totalDeleted += records.length;
        totalBatchSize += records.length;
      }
    }
    
    let hasMore = false;
    for (const table of tablesToClear) {
      const remaining = await ctx.db.query(table).first();
      if (remaining) {
        hasMore = true;
        break;
      }
    }
    
    return { hasMore, tables: results, totalDeleted };
  },
  returns: v.object({ 
    hasMore: v.boolean(),
    tables: v.array(v.object({ deleted: v.number(), table: v.string() })),
    totalDeleted: v.number(),
  }),
});
