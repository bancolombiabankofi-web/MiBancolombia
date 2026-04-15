import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { DocType } from "@/constants/countries";
import { getCountryByCode } from "@/constants/countries";

export type ThemeMode = "system" | "light" | "dark";

export type RegisteredUser = {
  id: string;
  documentType: DocType;
  documentNumber: string;
  countryResidence: string;
  countryBirth: string;
  currencyCode: string;
  currencySymbol: string;
  firstName: string;
  secondName: string;
  lastName: string;
  secondLastName: string;
  birthDate: string;
  email: string;
  phone: string;
  pin: string;
  createdAt: string;
  isAdmin?: boolean;
  status?: "active" | "suspended" | "blocked";
  balance?: number;
};

export type Account = {
  id: string;
  userId?: string;
  type: "savings" | "checking" | "credit";
  number: string;
  balance: number;
  currency: string;
  currencyCode: string;
  currencySymbol: string;
  name: string;
  status?: "active" | "suspended" | "blocked";
};

export type Transaction = {
  id: string;
  userId?: string;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  category: string;
  accountId: string;
  status: "completed" | "pending";
};

export type Card = {
  id: string;
  type: "debit" | "credit";
  number: string;
  expiry: string;
  holder: string;
  brand: "visa" | "mastercard";
  balance: number;
  limit?: number;
  color: string;
  active: boolean;
};

export type AuditLog = {
  id: string;
  timestamp: string;
  adminId: string;
  action: string;
  targetUserId?: string;
  details: string;
};

type AppContextType = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  accounts: Account[];
  transactions: Transaction[];
  cards: Card[];
  userName: string;
  currentUser: RegisteredUser | null;
  login: (documentNumber: string, pin: string) => Promise<boolean>;
  logout: () => void;
  register: (data: Omit<RegisteredUser, "id" | "createdAt">) => Promise<void>;
  balanceVisible: boolean;
  toggleBalanceVisible: () => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  getAllUsers: () => Promise<RegisteredUser[]>;
  updateUser: (id: string, data: Partial<RegisteredUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getAllAccounts: () => Promise<Account[]>;
  updateAccount: (userId: string, accountId: string, data: Partial<Account>) => Promise<void>;
  getAllTransactions: () => Promise<Transaction[]>;
  addTransaction: (userId: string, tx: Omit<Transaction, "id">) => Promise<void>;
  getAuditLogs: () => Promise<AuditLog[]>;
  addAuditLog: (action: string, details: string, targetUserId?: string) => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEMO_ACCOUNTS: Account[] = [
  { id: "acc1", type: "savings",  number: "****4521", balance: 4850000, currency: "Peso colombiano", currencyCode: "COP", currencySymbol: "$", name: "Cuenta de Ahorros", status: "active" },
  { id: "acc2", type: "checking", number: "****8834", balance: 1250000, currency: "Peso colombiano", currencyCode: "COP", currencySymbol: "$", name: "Cuenta Corriente",  status: "active" },
];

const DEMO_TRANSACTIONS: Transaction[] = [
  { id: "t1", date: "2026-03-28", description: "Éxito Supermercado",     amount: -87500,   type: "debit",  category: "Compras",        accountId: "acc1", status: "completed" },
  { id: "t2", date: "2026-03-27", description: "Nómina Empresa ABC",     amount: 3500000,  type: "credit", category: "Ingresos",       accountId: "acc1", status: "completed" },
  { id: "t3", date: "2026-03-27", description: "Netflix",                amount: -52900,   type: "debit",  category: "Entretenimiento",accountId: "acc1", status: "completed" },
  { id: "t4", date: "2026-03-26", description: "Transferencia a Juan",   amount: -200000,  type: "debit",  category: "Transferencias", accountId: "acc1", status: "completed" },
  { id: "t5", date: "2026-03-26", description: "Recaudo EPM",            amount: -145000,  type: "debit",  category: "Servicios",      accountId: "acc1", status: "completed" },
  { id: "t6", date: "2026-03-25", description: "Rappi Colombia",         amount: -35900,   type: "debit",  category: "Alimentación",   accountId: "acc1", status: "completed" },
  { id: "t7", date: "2026-03-25", description: "Transferencia recibida", amount: 500000,   type: "credit", category: "Transferencias", accountId: "acc1", status: "completed" },
  { id: "t8", date: "2026-03-24", description: "Gasolina Shell",         amount: -120000,  type: "debit",  category: "Transporte",     accountId: "acc1", status: "completed" },
];

const DEMO_CARDS: Card[] = [
  { id: "card1", type: "debit",  number: "4521 **** **** 3842", expiry: "12/27", holder: "CARLOS HERNANDEZ", brand: "visa",       balance: 4850000, color: "#1C1C1E",  active: true },
  { id: "card2", type: "credit", number: "5412 **** **** 9076", expiry: "08/28", holder: "CARLOS HERNANDEZ", brand: "mastercard", balance: 1200000, limit: 5000000, color: "#FDDA24", active: true },
];

const ADMIN_USER: RegisteredUser = {
  id: "admin-root",
  documentType: "CC",
  documentNumber: "000000000",
  countryResidence: "CO",
  countryBirth: "CO",
  currencyCode: "COP",
  currencySymbol: "$",
  firstName: "Administrador",
  secondName: "",
  lastName: "Bancolombia",
  secondLastName: "",
  birthDate: "01/01/1990",
  email: "admin@bancolombia.com",
  phone: "3000000000",
  pin: "0000",
  createdAt: "2024-01-01T00:00:00.000Z",
  isAdmin: true,
  status: "active",
};

function zeroAccounts(user: RegisteredUser): Account[] {
  const c = getCountryByCode(user.countryResidence);
  return [
    {
      id: "acc1",
      userId: user.id,
      type: "savings",
      number: "****0001",
      balance: user.balance ?? 0,
      currency: c?.currency ?? "Peso colombiano",
      currencyCode: user.currencyCode ?? "COP",
      currencySymbol: user.currencySymbol ?? "$",
      name: "Cuenta de Ahorros",
      status: "active",
    },
  ];
}

function zeroCards(user: RegisteredUser): Card[] {
  return [
    {
      id: "card1",
      type: "debit",
      number: "**** **** **** ****",
      expiry: "--/--",
      holder: `${user.firstName} ${user.lastName}`.toUpperCase(),
      brand: "visa",
      balance: 0,
      color: "#1C1C1E",
      active: true,
    },
  ];
}

async function seedAdmin() {
  const usersJson = await AsyncStorage.getItem("registeredUsers");
  const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];
  const exists = users.find((u) => u.id === "admin-root");
  if (!exists) {
    await AsyncStorage.setItem("registeredUsers", JSON.stringify([ADMIN_USER, ...users]));
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(null);

  useEffect(() => {
    (async () => {
      await seedAdmin();
      const [auth, theme, userJson, adminFlag] = await Promise.all([
        AsyncStorage.getItem("auth"),
        AsyncStorage.getItem("themeMode"),
        AsyncStorage.getItem("currentUser"),
        AsyncStorage.getItem("isAdmin"),
      ]);
      if (theme) setThemeModeState(theme as ThemeMode);
      if (userJson) setCurrentUser(JSON.parse(userJson));
      if (auth === "true") setIsAuthenticated(true);
      if (adminFlag === "true") setIsAdmin(true);
    })();
  }, []);

  const login = useCallback(async (documentNumber: string, pin: string): Promise<boolean> => {
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];

    const matched = users.find(
      (u) => u.pin === pin && u.documentNumber === documentNumber
    );

    if (matched) {
      const adminFlag = matched.isAdmin === true;
      setIsAuthenticated(true);
      setIsAdmin(adminFlag);
      setCurrentUser(matched);
      await AsyncStorage.setItem("auth", "true");
      await AsyncStorage.setItem("isAdmin", adminFlag ? "true" : "false");
      await AsyncStorage.setItem("currentUser", JSON.stringify(matched));
      if (adminFlag) {
        await addAuditLog_internal(matched.id, "LOGIN", "Inicio de sesión administrativo");
      }
      return true;
    }

    if (pin === "1234") {
      setIsAuthenticated(true);
      setIsAdmin(false);
      setCurrentUser(null);
      await AsyncStorage.setItem("auth", "true");
      await AsyncStorage.setItem("isAdmin", "false");
      await AsyncStorage.removeItem("currentUser");
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setCurrentUser(null);
    AsyncStorage.removeItem("auth");
    AsyncStorage.removeItem("isAdmin");
    AsyncStorage.removeItem("currentUser");
  }, []);

  const register = useCallback(async (data: Omit<RegisteredUser, "id" | "createdAt">) => {
    const newUser: RegisteredUser = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isAdmin: false,
      status: "active",
      balance: 0,
    };
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];
    await AsyncStorage.setItem("registeredUsers", JSON.stringify([...users, newUser]));
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem("themeMode", mode);
  }, []);

  const toggleBalanceVisible = useCallback(() => setBalanceVisible((v) => !v), []);

  const getAllUsers = useCallback(async (): Promise<RegisteredUser[]> => {
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    return usersJson ? JSON.parse(usersJson) : [];
  }, []);

  const updateUser = useCallback(async (id: string, data: Partial<RegisteredUser>) => {
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];
    const updated = users.map((u) => (u.id === id ? { ...u, ...data } : u));
    await AsyncStorage.setItem("registeredUsers", JSON.stringify(updated));
    if (currentUser?.id === id) {
      const newUser = { ...currentUser, ...data };
      setCurrentUser(newUser);
      await AsyncStorage.setItem("currentUser", JSON.stringify(newUser));
    }
    await addAuditLog_internal(currentUser?.id ?? "admin", "UPDATE_USER", `Usuario ${id} actualizado: ${JSON.stringify(data)}`);
  }, [currentUser]);

  const deleteUser = useCallback(async (id: string) => {
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];
    const filtered = users.filter((u) => u.id !== id);
    await AsyncStorage.setItem("registeredUsers", JSON.stringify(filtered));
    await AsyncStorage.removeItem(`accounts_${id}`);
    await AsyncStorage.removeItem(`transactions_${id}`);
    await addAuditLog_internal(currentUser?.id ?? "admin", "DELETE_USER", `Usuario ${id} eliminado`);
  }, [currentUser]);

  const getAllAccounts = useCallback(async (): Promise<Account[]> => {
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];
    const all: Account[] = [];
    for (const u of users) {
      if (u.isAdmin) continue;
      const stored = await AsyncStorage.getItem(`accounts_${u.id}`);
      if (stored) {
        all.push(...JSON.parse(stored));
      } else {
        const acc = zeroAccounts(u);
        all.push(...acc);
      }
    }
    return all;
  }, []);

  const updateAccount = useCallback(async (userId: string, accountId: string, data: Partial<Account>) => {
    const stored = await AsyncStorage.getItem(`accounts_${userId}`);
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];
    const user = users.find((u) => u.id === userId);
    let accounts: Account[] = stored
      ? JSON.parse(stored)
      : user
      ? zeroAccounts(user)
      : [];
    accounts = accounts.map((a) => (a.id === accountId ? { ...a, ...data } : a));
    await AsyncStorage.setItem(`accounts_${userId}`, JSON.stringify(accounts));
    if (data.balance !== undefined && user) {
      const updated = users.map((u) => (u.id === userId ? { ...u, balance: data.balance } : u));
      await AsyncStorage.setItem("registeredUsers", JSON.stringify(updated));
    }
    await addAuditLog_internal(currentUser?.id ?? "admin", "UPDATE_ACCOUNT", `Cuenta ${accountId} del usuario ${userId} actualizada: ${JSON.stringify(data)}`);
  }, [currentUser]);

  const getAllTransactions = useCallback(async (): Promise<Transaction[]> => {
    const usersJson = await AsyncStorage.getItem("registeredUsers");
    const users: RegisteredUser[] = usersJson ? JSON.parse(usersJson) : [];
    const all: Transaction[] = [];
    for (const u of users) {
      if (u.isAdmin) continue;
      const stored = await AsyncStorage.getItem(`transactions_${u.id}`);
      if (stored) {
        const txs: Transaction[] = JSON.parse(stored);
        all.push(...txs.map((t) => ({ ...t, userId: u.id })));
      }
    }
    return all.sort((a, b) => b.date.localeCompare(a.date));
  }, []);

  const addTransaction = useCallback(async (userId: string, tx: Omit<Transaction, "id">) => {
    const stored = await AsyncStorage.getItem(`transactions_${userId}`);
    const txs: Transaction[] = stored ? JSON.parse(stored) : [];
    const newTx: Transaction = { ...tx, id: `tx_${Date.now()}`, userId };
    await AsyncStorage.setItem(`transactions_${userId}`, JSON.stringify([newTx, ...txs]));
  }, []);

  const getAuditLogs = useCallback(async (): Promise<AuditLog[]> => {
    const stored = await AsyncStorage.getItem("auditLogs");
    return stored ? JSON.parse(stored) : [];
  }, []);

  async function addAuditLog_internal(adminId: string, action: string, details: string, targetUserId?: string) {
    const stored = await AsyncStorage.getItem("auditLogs");
    const logs: AuditLog[] = stored ? JSON.parse(stored) : [];
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminId,
      action,
      details,
      targetUserId,
    };
    await AsyncStorage.setItem("auditLogs", JSON.stringify([newLog, ...logs].slice(0, 500)));
  }

  const addAuditLog = useCallback(async (action: string, details: string, targetUserId?: string) => {
    await addAuditLog_internal(currentUser?.id ?? "admin", action, details, targetUserId);
  }, [currentUser]);

  const displayName = currentUser?.firstName ?? "Carlos";
  const accounts = currentUser && !currentUser.isAdmin ? zeroAccounts(currentUser) : DEMO_ACCOUNTS;
  const transactions = currentUser && !currentUser.isAdmin ? [] : DEMO_TRANSACTIONS;
  const cards = currentUser && !currentUser.isAdmin ? zeroCards(currentUser) : DEMO_CARDS;

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        accounts,
        transactions,
        cards,
        userName: displayName,
        currentUser,
        login,
        logout,
        register,
        balanceVisible,
        toggleBalanceVisible,
        themeMode,
        setThemeMode,
        getAllUsers,
        updateUser,
        deleteUser,
        getAllAccounts,
        updateAccount,
        getAllTransactions,
        addTransaction,
        getAuditLogs,
        addAuditLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
