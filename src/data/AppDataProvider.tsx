import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import type { PendingAction } from '@/ai/toolRegistry';
import { demoData } from '@/data/seed';
import {
  BullionLot,
  CryptoHolding,
  DemoData,
  PropertyBill,
  PropertyBillType,
  PropertyHolding,
  ShareHolding,
  SuperSettings,
  Transaction,
} from '@/types/models';

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
  superSettings: SuperSettings;
  lastRefreshedAt: string;
  refreshDashboard: () => void;
  confirmSMSFLedgerItem: (payload: LedgerPayload) => void;
  confirmInvestmentItem: (payload: InvestmentPayload) => void;
  confirmAssistantPendingAction: (action: PendingAction) => { message: string; data: unknown };
  updateProperty: (propertyId: string, updates: Partial<PropertyHolding>) => void;
  addPropertyBill: (bill: Omit<PropertyBill, 'id' | 'user_id'>) => void;
  togglePropertyBillPaid: (billId: string) => void;
  deletePropertyBill: (billId: string) => void;
  updateSuper: (updates: Partial<SuperSettings>) => void;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<DemoData>(demoData);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date().toISOString());

  const stampRefresh = () => setLastRefreshedAt(new Date().toISOString());

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      superSettings: data.superSettings,
      lastRefreshedAt,
      refreshDashboard: stampRefresh,
      confirmSMSFLedgerItem: (payload) => {
        setData((current) => applySMSFItem(current, payload));
        stampRefresh();
      },
      confirmInvestmentItem: (payload) => {
        setData((current) => applyInvestmentItem(current, payload));
        stampRefresh();
      },
      confirmAssistantPendingAction: (action) => {
        let result: { message: string; data: unknown } = {
          message: 'No matching assistant action was applied.',
          data: { actionId: action.id, status: 'ignored' },
        };

        setData((current) => {
          const applied = applyAssistantPendingAction(current, action);
          result = { message: applied.message, data: applied.data };
          return applied.dataState;
        });
        stampRefresh();
        return result;
      },
      updateProperty: (propertyId, updates) => {
        setData((current) => ({
          ...current,
          propertyHoldings: current.propertyHoldings.map((property) =>
            property.id === propertyId ? { ...property, ...updates } : property,
          ),
        }));
        stampRefresh();
      },
      addPropertyBill: (bill) => {
        setData((current) => addPropertyBillToData(current, bill));
        stampRefresh();
      },
      togglePropertyBillPaid: (billId) => {
        setData((current) => ({
          ...current,
          propertyBills: current.propertyBills.map((bill) =>
            bill.id === billId
              ? {
                  ...bill,
                  status: bill.status === 'paid' ? 'upcoming' : 'paid',
                  paid_date: bill.status === 'paid' ? undefined : bill.due_date,
                }
              : bill,
          ),
        }));
        stampRefresh();
      },
      deletePropertyBill: (billId) => {
        setData((current) => ({
          ...current,
          propertyBills: current.propertyBills.filter((bill) => bill.id !== billId),
        }));
        stampRefresh();
      },
      updateSuper: (updates) => {
        setData((current) => ({
          ...current,
          superSettings: {
            ...current.superSettings,
            ...updates,
          },
        }));
        stampRefresh();
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
  const targetAccountId = resolveSMSFTargetAccountId(payload.type);
  const fundingAccountId = 'acct-smsf-cash';

  if (payload.type === 'Contribution' || payload.type === 'Cash movement') {
    return {
      ...data,
      accounts: adjustAccountBalance(data.accounts, fundingAccountId, amount),
      transactions: [
        createTransaction(data, fundingAccountId, payload, payload.type === 'Contribution' ? 'contribution' : 'transfer'),
        ...data.transactions,
      ],
    };
  }

  if (payload.type === 'ETF units') {
    const price = quantity > 0 ? amount / quantity : amount;
    const holding: ShareHolding = {
      id: `share-smsf-local-${Date.now()}`,
      user_id: data.user.id,
      account_id: targetAccountId,
      symbol: payload.label.toUpperCase(),
      name: payload.label.toUpperCase(),
      quantity,
      average_cost: price,
      current_price: price,
      current_value: amount,
    };
    return {
      ...data,
      accounts: adjustAccountBalance(data.accounts, fundingAccountId, -amount),
      shareHoldings: [holding, ...data.shareHoldings],
      transactions: [createTransaction(data, targetAccountId, payload, 'buy'), ...data.transactions],
    };
  }

  if (payload.type === 'Crypto units') {
    const price = quantity > 0 ? amount / quantity : amount;
    const holding: CryptoHolding = {
      id: `crypto-smsf-local-${Date.now()}`,
      user_id: data.user.id,
      account_id: targetAccountId,
      symbol: payload.label.toUpperCase(),
      name: payload.label.toUpperCase(),
      quantity,
      average_cost: price,
      current_price: price,
      current_value: amount,
    };
    return {
      ...data,
      accounts: adjustAccountBalance(data.accounts, fundingAccountId, -amount),
      cryptoHoldings: [holding, ...data.cryptoHoldings],
      transactions: [createTransaction(data, targetAccountId, payload, 'buy'), ...data.transactions],
    };
  }

  if (payload.type === 'Metal lot') {
    const price = quantity > 0 ? amount / quantity : amount;
    const lot: BullionLot = {
      id: `bullion-smsf-local-${Date.now()}`,
      user_id: data.user.id,
      account_id: targetAccountId,
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
      accounts: adjustAccountBalance(data.accounts, fundingAccountId, -amount),
      bullionLots: [lot, ...data.bullionLots],
      transactions: [createTransaction(data, targetAccountId, payload, 'buy'), ...data.transactions],
    };
  }

  return {
    ...data,
    accounts: adjustAccountBalance(data.accounts, fundingAccountId, -amount),
    transactions: [createTransaction(data, fundingAccountId, payload, 'expense'), ...data.transactions],
  };
}

function applyInvestmentItem(data: DemoData, payload: InvestmentPayload): DemoData {
  const amount = parseAmount(payload.amount);
  const quantity = parseAmount(payload.quantity);
  const targetAccountId = resolvePersonalTargetAccountId(payload.type);
  const fundingAccountId = 'acct-offset';

  if (payload.type === 'ETF purchase') {
    const price = quantity > 0 ? amount / quantity : amount;
    const holding: ShareHolding = {
      id: `share-personal-local-${Date.now()}`,
      user_id: data.user.id,
      account_id: targetAccountId,
      symbol: payload.label.toUpperCase(),
      name: payload.label.toUpperCase(),
      quantity,
      average_cost: price,
      current_price: price,
      current_value: amount,
    };
    return {
      ...data,
      accounts: adjustAccountBalance(data.accounts, fundingAccountId, -amount),
      shareHoldings: [holding, ...data.shareHoldings],
      transactions: [createTransaction(data, targetAccountId, payload, 'buy'), ...data.transactions],
    };
  }

  if (payload.type === 'Crypto purchase') {
    const price = quantity > 0 ? amount / quantity : amount;
    const holding: CryptoHolding = {
      id: `crypto-personal-local-${Date.now()}`,
      user_id: data.user.id,
      account_id: targetAccountId,
      symbol: payload.label.toUpperCase(),
      name: payload.label.toUpperCase(),
      quantity,
      average_cost: price,
      current_price: price,
      current_value: amount,
    };
    return {
      ...data,
      accounts: adjustAccountBalance(data.accounts, fundingAccountId, -amount),
      cryptoHoldings: [holding, ...data.cryptoHoldings],
      transactions: [createTransaction(data, targetAccountId, payload, 'buy'), ...data.transactions],
    };
  }

  if (payload.type === 'Bullion lot') {
    const price = quantity > 0 ? amount / quantity : amount;
    const lot: BullionLot = {
      id: `bullion-personal-local-${Date.now()}`,
      user_id: data.user.id,
      account_id: targetAccountId,
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
    return {
      ...data,
      accounts: adjustAccountBalance(data.accounts, fundingAccountId, -amount),
      bullionLots: [lot, ...data.bullionLots],
      transactions: [createTransaction(data, targetAccountId, payload, 'buy'), ...data.transactions],
    };
  }

  if (payload.type === 'Property asset') {
    const property: PropertyHolding = {
      id: `property-personal-local-${Date.now()}`,
      user_id: data.user.id,
      account_id: fundingAccountId,
      name: payload.label,
      location: 'Personal property',
      ownership_type: 'personal',
      current_value: amount,
      loan_balance: 0,
      interest_rate: 0,
      monthly_repayment: 0,
      weekly_rent: 0,
      annual_expenses: 0,
      notes: `Added from ${payload.account} investment draft.`,
    };
    return {
      ...data,
      accounts: adjustAccountBalance(data.accounts, fundingAccountId, -amount),
      propertyHoldings: [property, ...data.propertyHoldings],
      transactions: [createTransaction(data, fundingAccountId, payload, 'buy'), ...data.transactions],
    };
  }

  if (payload.type === 'Other investment') {
    const holding: ShareHolding = {
      id: `share-other-local-${Date.now()}`,
      user_id: data.user.id,
      account_id: targetAccountId,
      symbol: 'OTHER',
      name: payload.label,
      quantity: quantity || 1,
      average_cost: quantity > 0 ? amount / quantity : amount,
      current_price: quantity > 0 ? amount / quantity : amount,
      current_value: amount,
    };
    return {
      ...data,
      accounts: adjustAccountBalance(data.accounts, fundingAccountId, -amount),
      shareHoldings: [holding, ...data.shareHoldings],
      transactions: [createTransaction(data, targetAccountId, payload, 'buy'), ...data.transactions],
    };
  }

  return {
    ...data,
    accounts: adjustAccountBalance(
      data.accounts,
      fundingAccountId,
      payload.type === 'Dividend income' ? amount : -amount,
    ),
    transactions: [
      createTransaction(data, fundingAccountId, payload, payload.type === 'Dividend income' ? 'income' : 'transfer'),
      ...data.transactions,
    ],
  };
}

function applyAssistantPendingAction(
  data: DemoData,
  action: PendingAction,
): { dataState: DemoData; message: string; data: unknown } {
  switch (action.type) {
    case 'addInvestmentPurchase': {
      const payload = action.payload;
      const amount = coerceNumber(payload.amount);
      const quantity = coerceNumber(payload.quantity);
      const accountId = coerceString(payload.accountId) || 'acct-broker';
      const fundingAccountId = accountId.startsWith('acct-smsf') ? 'acct-smsf-cash' : 'acct-offset';
      const isCrypto = accountId.includes('crypto') || coerceString(payload.symbol).toUpperCase() === 'BTC';
      const label = coerceString(payload.symbol) || coerceString(payload.assetName) || 'Asset';
      const transactionPayload: LedgerPayload = {
        type: isCrypto ? 'Crypto purchase' : 'ETF purchase',
        label,
        quantity: String(quantity),
        amount: String(amount),
        date: coerceString(payload.transactionDate) || todayIsoDate(),
      };

      const next = isCrypto
        ? {
            ...data,
            accounts: adjustAccountBalance(data.accounts, fundingAccountId, -amount),
            cryptoHoldings: [
              {
                id: `crypto-ai-${Date.now()}`,
                user_id: data.user.id,
                account_id: accountId,
                symbol: label.toUpperCase(),
                name: coerceString(payload.assetName) || label.toUpperCase(),
                quantity,
                average_cost: coerceNumber(payload.unitPrice),
                current_price: coerceNumber(payload.unitPrice),
                current_value: amount,
              },
              ...data.cryptoHoldings,
            ],
            transactions: [createTransaction(data, accountId, transactionPayload, 'buy'), ...data.transactions],
          }
        : {
            ...data,
            accounts: adjustAccountBalance(data.accounts, fundingAccountId, -amount),
            shareHoldings: [
              {
                id: `share-ai-${Date.now()}`,
                user_id: data.user.id,
                account_id: accountId,
                symbol: label.toUpperCase(),
                name: coerceString(payload.assetName) || label.toUpperCase(),
                quantity,
                average_cost: coerceNumber(payload.unitPrice),
                current_price: coerceNumber(payload.unitPrice),
                current_value: amount,
              },
              ...data.shareHoldings,
            ],
            transactions: [createTransaction(data, accountId, transactionPayload, 'buy'), ...data.transactions],
          };

      return {
        dataState: next,
        message: `Confirmed and saved ${label.toUpperCase()} for ${formatCurrency(amount)}. Dashboard data has been refreshed from shared state.`,
        data: { actionId: action.id, status: 'confirmed', accountId },
      };
    }
    case 'addBullionPurchase': {
      const payload = action.payload;
      const accountId = coerceString(payload.accountId) || 'acct-smsf-bullion';
      const quantity = coerceNumber(payload.quantity);
      const unitPrice = coerceNumber(payload.buyPricePerUnit);
      const totalCost = quantity * unitPrice;
      const fundingAccountId = accountId.startsWith('acct-smsf') ? 'acct-smsf-cash' : 'acct-offset';
      const itemName = coerceString(payload.itemName) || 'Bullion lot';
      const metalType: BullionLot['metal_type'] =
        coerceString(payload.metalType).toLowerCase().includes('silver') ? 'silver' : 'gold';

      const next = {
        ...data,
        accounts: adjustAccountBalance(data.accounts, fundingAccountId, -totalCost),
        bullionLots: [
          {
            id: `bullion-ai-${Date.now()}`,
            user_id: data.user.id,
            account_id: accountId,
            metal_type: metalType,
            item_name: itemName,
            unit_type: (coerceString(payload.unitType) as BullionLot['unit_type']) || 'oz',
            quantity,
            buy_price_per_unit: unitPrice,
            total_cost: totalCost,
            purchase_date: coerceString(payload.purchaseDate) || todayIsoDate(),
            current_spot_price: unitPrice,
            current_estimated_value: totalCost,
            unrealized_gain_loss: 0,
            storage_location: coerceString(payload.storageLocation) || 'Vault',
          },
          ...data.bullionLots,
        ],
        transactions: [
          createTransaction(
            data,
            accountId,
            {
              type: 'Bullion purchase',
              label: itemName,
              quantity: String(quantity),
              amount: String(totalCost),
              date: coerceString(payload.purchaseDate) || todayIsoDate(),
            },
            'buy',
          ),
          ...data.transactions,
        ],
      };

      return {
        dataState: next,
        message: `Confirmed and saved ${itemName} for ${formatCurrency(totalCost)}.`,
        data: { actionId: action.id, status: 'confirmed', accountId },
      };
    }
    case 'addPropertyIncome': {
      const payload = action.payload;
      const propertyId = coerceString(payload.propertyId);
      const property = data.propertyHoldings.find((item) => item.id === propertyId);
      const amount = coerceNumber(payload.amount);
      const accountId = property?.account_id ?? 'acct-offset';
      const next = {
        ...data,
        accounts: adjustAccountBalance(data.accounts, accountId, amount),
        transactions: [
          {
            id: `txn-property-income-${Date.now()}`,
            user_id: data.user.id,
            account_id: accountId,
            transaction_type: 'income' as const,
            category: 'Property income',
            asset_type: 'property' as const,
            asset_name: property?.name,
            amount,
            transaction_date: coerceString(payload.transactionDate) || todayIsoDate(),
            notes: coerceString(payload.notes) || 'Assistant-confirmed property income',
            created_at: new Date().toISOString(),
          },
          ...data.transactions,
        ],
      };

      return {
        dataState: next,
        message: `Confirmed and saved ${formatCurrency(amount)} rental income${property ? ` for ${property.name}` : ''}.`,
        data: { actionId: action.id, status: 'confirmed', propertyId },
      };
    }
    case 'addPropertyBill': {
      const payload = action.payload;
      const propertyId = coerceString(payload.propertyId);
      const paidDate = coerceString(payload.paidDate);
      const amount = coerceNumber(payload.amount);
      const property = data.propertyHoldings.find((item) => item.id === propertyId);
      let next = addPropertyBillToData(data, {
        property_id: propertyId,
        bill_type: (coerceString(payload.billType) as PropertyBillType) || 'other',
        vendor: coerceString(payload.vendor) || 'Property bill',
        amount,
        due_date: coerceString(payload.dueDate) || todayIsoDate(),
        paid_date: paidDate || undefined,
        recurrence: (coerceString(payload.recurrence) as PropertyBill['recurrence']) || 'once',
        status: paidDate ? 'paid' : 'upcoming',
        notes: coerceString(payload.notes),
      });
      if (paidDate && property) {
        next = {
          ...next,
          accounts: adjustAccountBalance(next.accounts, property.account_id, -amount),
          transactions: [
            {
              id: `txn-property-bill-${Date.now()}`,
              user_id: data.user.id,
              account_id: property.account_id,
              transaction_type: 'expense' as const,
              category: 'Property bill',
              asset_type: 'property' as const,
              asset_name: property.name,
              amount,
              transaction_date: paidDate,
              notes: coerceString(payload.notes) || 'Assistant-confirmed property bill',
              created_at: new Date().toISOString(),
            },
            ...next.transactions,
          ],
        };
      }

      return {
        dataState: next,
        message: `Confirmed and saved ${formatCurrency(amount)} property bill${property ? ` for ${property.name}` : ''}.`,
        data: { actionId: action.id, status: 'confirmed', propertyId },
      };
    }
    default:
      return {
        dataState: data,
        message: 'That assistant action type is not wired into the shared data layer yet.',
        data: { actionId: action.id, status: 'unsupported' },
      };
  }
}

function addPropertyBillToData(data: DemoData, bill: Omit<PropertyBill, 'id' | 'user_id'>) {
  return {
    ...data,
    propertyBills: [
      {
        id: `bill-local-${Date.now()}`,
        user_id: data.user.id,
        ...bill,
      },
      ...data.propertyBills,
    ],
  };
}

function createTransaction(
  data: DemoData,
  accountId: string,
  payload: LedgerPayload,
  transactionType: Transaction['transaction_type'],
): Transaction {
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

function adjustAccountBalance(accounts: DemoData['accounts'], accountId: string, delta: number) {
  return accounts.map((account) =>
    account.id === accountId
      ? {
          ...account,
          current_balance: Math.max((account.current_balance ?? 0) + delta, 0),
        }
      : account,
  );
}

function resolveSMSFTargetAccountId(type: string) {
  if (type === 'ETF units') return 'acct-smsf-broker';
  if (type === 'Crypto units') return 'acct-smsf-crypto';
  if (type === 'Metal lot') return 'acct-smsf-bullion';
  return 'acct-smsf-cash';
}

function resolvePersonalTargetAccountId(type: string) {
  if (type === 'Crypto purchase') return 'acct-crypto';
  if (type === 'ETF purchase' || type === 'Other investment') return 'acct-broker';
  if (type === 'Bullion lot') return 'acct-offset';
  return 'acct-offset';
}

function parseAmount(value: string) {
  const parsed = Number(String(value).replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function coerceString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function coerceNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(value: number) {
  return value.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}
