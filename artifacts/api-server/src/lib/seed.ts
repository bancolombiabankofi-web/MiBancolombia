import { eq } from "drizzle-orm";
import { db, usersTable, accountsTable, transactionsTable, appSettingsTable } from "@workspace/db";
import { logger } from "./logger";

const ADMIN_USER = {
  id: "admin-root",
  documentType: "CC",
  documentNumber: "1083838423",
  countryResidence: "CO",
  countryBirth: "CO",
  currencyCode: "COP",
  currencySymbol: "$",
  firstName: "Administrador",
  secondName: "",
  lastName: "Bancolombia",
  secondLastName: "",
  birthDate: "01/01/1990",
  email: "admin@bancolombia.com.co",
  phone: "3000000000",
  pin: "1234",
  isAdmin: true,
  status: "active",
};

const SAMPLE_USER = {
  id: "usr_alejandra_001",
  documentType: "CC",
  documentNumber: "1234567890",
  countryResidence: "CO",
  countryBirth: "CO",
  currencyCode: "COP",
  currencySymbol: "$",
  firstName: "Alejandra",
  secondName: "",
  lastName: "García",
  secondLastName: "",
  birthDate: "15/06/1995",
  email: "alejandra@bancolombia.com.co",
  phone: "3001234567",
  pin: "1234",
  isAdmin: false,
  status: "active",
};

const SAMPLE_ACCOUNTS = [
  {
    id: "acc_alejandra_1",
    userId: "usr_alejandra_001",
    type: "savings",
    number: "****5678",
    balance: 2654112,
    currency: "Peso colombiano",
    currencyCode: "COP",
    currencySymbol: "$",
    name: "Cuenta de Ahorros",
    status: "active",
  },
  {
    id: "acc_alejandra_2",
    userId: "usr_alejandra_001",
    type: "checking",
    number: "****9012",
    balance: 450000,
    currency: "Peso colombiano",
    currencyCode: "COP",
    currencySymbol: "$",
    name: "Cuenta Corriente",
    status: "active",
  },
];

const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split("T")[0];

const SAMPLE_TRANSACTIONS = [
  { id: "tx_s1", userId: "usr_alejandra_001", date: today, description: "Transferencia recibida - Carlos M.", amount: 500000, type: "credit", category: "Transferencias", accountId: "acc_alejandra_1", status: "completed" },
  { id: "tx_s2", userId: "usr_alejandra_001", date: today, description: "Pago Factura ETB", amount: 120000, type: "debit", category: "Servicios", accountId: "acc_alejandra_1", status: "completed" },
  { id: "tx_s3", userId: "usr_alejandra_001", date: yesterday, description: "Recarga Claro", amount: 30000, type: "debit", category: "Recargas", accountId: "acc_alejandra_1", status: "completed" },
  { id: "tx_s4", userId: "usr_alejandra_001", date: yesterday, description: "Nómina Empresa SAS", amount: 3500000, type: "credit", category: "Nómina", accountId: "acc_alejandra_1", status: "completed" },
  { id: "tx_s5", userId: "usr_alejandra_001", date: twoDaysAgo, description: "Supermercado Éxito", amount: 85000, type: "debit", category: "Compras", accountId: "acc_alejandra_1", status: "completed" },
];

export async function seedDatabase() {
  try {
    // Upsert admin (always keep credentials in sync)
    await db.insert(usersTable).values(ADMIN_USER).onConflictDoUpdate({
      target: usersTable.id,
      set: { pin: ADMIN_USER.pin, firstName: ADMIN_USER.firstName, status: ADMIN_USER.status },
    });

    // Seed sample user if not exists
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, SAMPLE_USER.id));
    if (!existing) {
      await db.insert(usersTable).values(SAMPLE_USER);
      await db.insert(accountsTable).values(SAMPLE_ACCOUNTS);
      await db.insert(transactionsTable).values(SAMPLE_TRANSACTIONS);
      logger.info("Seeded sample user and data");
    }

    // Seed default settings
    await db.insert(appSettingsTable).values({ key: "supportPhone", value: "573132095988" }).onConflictDoNothing();

    logger.info("Database seed complete");
  } catch (err) {
    logger.error({ err }, "Database seed failed");
  }
}
