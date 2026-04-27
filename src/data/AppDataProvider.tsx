import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { demoData } from '@/data/seed';
import { BullionLot, CryptoHolding, DemoData, PropertyHolding, ShareHolding, Transaction } from '@/types/models';

type LedgerPayload = {
  type: string;
  label: string;
  quantity: string;
  amount: string;
  date: string;
};

type InvestmentPayload = LedgerPayload & {
  account: string;
};

type AppDataContextValue = {
  data: DemoData;
  lastRefreshedAt: string;
  refreshDashboard: () => void;
  confirmSMSFLedgerItem: (payload: LedgerPayload) => void;
  confirmInvestmentItem: (payload: InvestmentPayload) => void;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<DemoData>(demoData);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date().toISOString());

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      lastRefreshedAt,
      refreshDashboard: () => setLastRefreshedAt(new Date().toISOString()),
      confirmSMSFLedgerItem: (payload) => {
        setData((current) => applySMSFItem(current, payload));
        setLastRefreshedAt(new Date().toISOString());
      },
      confirmInvestmentItem: (payload) => {
        setData((current) => applyInvestmentItem(current, payload));
        setLastRefreshedAt(new Date().toISOString());
      },
    }),
    [data, lastRefreshedAt],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used inside AppDataProvider');
  }
  return context;
}

function applySMSFItem(data: DemoData, payload: LedgerPayload): DemoData {
  const amount = parseAmount(payload.amount);
  const quantity = parseAmount(payload.quantity);
  const accountId = resolveSMSFAccountId(data, payload.type);

  if (payload.type === 'Contribution' || payload.type === 'Cash movement') {
    return {
      ...data,
      accounts: data.accounts.map((account) =>
        account.id === accountId ? { ...account, current_balance: (account.current_balance ?? 0) + amount } : account,
      ),
      transactions: [createTransaction(data, accountId, payload, payload.type === 'Contribution' ? 'contribution' : 'transfer'), ...data.transactions],
    };
  }

  if (payload.type === 'ETF units') {
    const price = quantity > 0 ? amount / quantity : amount;
    const holding: ShareHolding = {
      id: `share-smsf-local-${Date.now()}`,
      user_id: data.user.id,
      account_id: accountId,
      symbol: payload.label.toUpperCase(),
      name: payload.label.toUpperCase(),
      quantity,
      average_cost: price,
      current_price: price,
      current_value: amount,
    };
    return {
      ...data,
      shareHoldings: [holding, ...data.shareHoldings],
      transactions: [createTransaction(data, accountId, payload, 'buy'), ...data.transactions],
    };
  }

  if (payload.type === 'Crypto units') {
    const price = quantity > 0 ? amount / quantity : amount;
    const holding: CryptoHolding = {
      id: `crypto-smsf-local-${Date.now()}`,
      user_id: data.user.id,
      account_id: accountId,
      symbol: payload.label.toUpperCase(),
      name: payload.label.toUpperCase(),
      quantity,
      average_cost: price,
      current_price: price,
      current_value: amount,
    };
    return {
      ...data,
      cryptoHoldings: [holding, ...data.cryptoHoldings],
      transactions: [createTransaction(data, accountId, payload, 'buy'), ...data.transactions],
    };
  }

  if (payload.type === 'Metal lot') {
    const price = quantity > 0 ? amount / quantity : amount;
    const lot: BullionLot = {
      id: `bullion-smsf-local-${Date.now()}`,
      user_id: data.user.id,
      account_id: accountId,
      metal_type: payload.label.toLowerCase().includes('silver') ? 'silver' : 'gold',
      item_name: payload.label,
      unit_type: 'oz',
      quantity,
      buy_price_per_unit: price,
      total_cost: amount,
      purchase_date: payload.date,
      current_spot_price: price,
      current_estimated_value: amount,
      unrealized_gain_loss: 0,
      storage_location: 'SMSF Bullion Vault',
    };
    return {
      ...data,
      bullionLots: [lot, ...data.bullionLots],
      transactions: [createTransaction(data, accountId, payload, 'buy'), ...data.transactions],
    };
  }

  return {
    ...data,
    transactions: [createTransaction(data, accountId, payload, 'expense'), ...data.transactions],
  };
}

function applyInvestmentItem(data: DemoData, payload: InvestmentPayload): DemoData {
  const amount = parseAmount(payload.amount);
  const quantity = parseAmount(payload.quantity);
  const accountId = resolvePersonalAccountId(data, payload.type);

  if (payload.type === 'ETF purchase') {
    const price = quantity > 0 ? amount / quantity : amount;
    const holding: ShareHolding = {
      id: `share-personal-local-${Date.now()}`,
      user_id: data.user.id,
      account_id: accountId,
      symbol: payload.label.toUpperCase(),
      name: payload.label.toUpperCase(),
      quantity,
      average_cost: price,
      current_price: price,
      current_value: amount,
    };
    return { ...data, shareHoldings: [holding, ...data.shareHoldings], transactions: [createTransaction(data, accountId, payload, 'buy'), ...data.transactions] };
  }

  if (payload.type === 'Crypto purchase') {
    const price = quantity > 0 ? amount / quantity : amount;
    const holding: CryptoHolding = {
      id: `crypto-personal-local-${Date.now()}`,
      user_id: data.user.id,
      account_id: accountId,
      symbol: payload.label.toUpperCase(),
      name: payload.label.toUpperCase(),
      quantity,
      average_cost: price,
      current_price: price,
      current_value: amount,
    };
    return { ...data, cryptoHoldings: [holding, ...data.cryptoHoldings], transactions: [createTransaction(data, accountId, payload, 'buy'), ...data.transactions] };
  }

  if (payload.type === 'Bullion lot') {
    const price = quantity > 0 ? amount / quantity : amount;
    const lot: BullionLot = {
      id: `bullion-personal-local-${Date.now()}`,
      user_id: data.user.id,
      account_id: accountId,
      metal_type: payload.label.toLowerCase().includes('silver') ? 'silver' : 'gold',
      item_name: payload.label,
      unit_type: 'oz',
      quantity,
      buy_price_per_unit: price,
      total_cost: amount,
      purchase_date: payload.date,
      current_spot_price: price,
      current_estimated_value: amount,
      unrealized_gain_loss: 0,
      storage_location: 'Personal',
    };
    return { ...data, bullionLots: [lot, ...data.bullionLots], transactions: [createTransaction(data, accountId, payload, 'buy'), ...data.transactions] };
  }

  if (payload.type === 'Property asset') {
    const property: PropertyHolding = {
      id: `property-personal-local-${Date.now()}`,
      user_id: data.user.id,
      account_id: accountId,
      name: payload.label,
      location: 'Personal property',
      ownership_type: 'personal',
      current_value: amount,
      loan_balance: 0,
      weekly_rent: 0,
      annual_expenses: 0,
      notes: `Added from ${payload.account} investment draft.`,
    };
    return { ...data, propertyHoldings: [property, ...data.propertyHoldings] };
  }

  if (payload.type === 'Other investment') {
    const holding: ShareHolding = {
      id: `share-other-local-${Date.now()}`,
      user_id: data.user.id,
      account_id: accountId,
      symbol: 'OTHER',
      name: payload.label,
      quantity: quantity || 1,
      average_cost: quantity > 0 ? amount / quantity : amount,
      current_price: quantity > 0 ? amount / quantity : amount,
      current_value: amount,
    };
    return { ...data, shareHoldings: [holding, ...data.shareHoldings], transactions: [createTransaction(data, accountId, payload, 'buy'), ...data.transactions] };
  }

  return {
    ...data,
    accounts: data.accounts.map((account) =>
      account.id === accountId ? { ...account, current_balance: (account.current_balance ?? 0) + amount } : account,
    ),
    transactions: [createTransaction(data, accountId, payload, payload.type === 'Dividend income' ? 'income' : 'transfer'), ...data.transactions],
  };
}

function createTransaction(data: DemoData, accountId: string, payload: LedgerPayload, transactionType: Transaction['transaction_type']): Transaction {
  const amount = parseAmount(payload.amount);
  const quantity = parseAmount(payload.quantity);
  return {
    id: `txn-local-${Date.now()}-${Math.round(Math.random() * 10000)}`,
    user_id: data.user.id,
    account_id: accountId,
    transaction_type: transactionType,
    category: payload.type,
    asset_symbol: payload.label.toUpperCase(),
    asset_name: payload.label,
    amount,
    quantity: quantity || undefined,
    unit_price: quantity > 0 ? amount / quantity : undefined,
    transaction_date: payload.date,
    notes: 'Confirmed local draft. Supabase write pending.',
    created_at: new Date().toISOString(),
  };
}

function resolveSMSFAccountId(data: DemoData, type: string) {
  if (type === 'ETF units') return 'acct-smsf-broker';
  if (type === 'Crypto units') return 'acct-smsf-crypto';
  if (type === 'Metal lot') return 'acct-smsf-bullion';
  return data.accounts.find((account) => account.id === 'acct-smsf-cash')?.id ?? data.accounts[0].id;
}

function resolvePersonalAccountId(data: DemoData, type: string) {
  if (type === 'Crypto purchase') return 'acct-crypto';
  if (type === 'ETF purchase') return 'acct-broker';
  if (type === 'Bullion lot') return 'acct-offset';
  return data.accounts.find((account) => account.id === 'acct-offset')?.id ?? data.accounts[0].id;
}

function parseAmount(value: string) {
  const parsed = Number(String(value).replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}
