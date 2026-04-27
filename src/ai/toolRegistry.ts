import { demoData } from '@/data/seed';
import { getBullionLotById, getDashboardSummary } from '@/services/calculations';
import { getDefaultPropertyAnalysis, getPropertyDetail } from '@/services/propertyServices';
import { getTaxTrackerSummary } from '@/services/taxServices';
import { AssetType, MetalType, PropertyBillType, UnitType } from '@/types/models';

type JsonSchema = {
  type: 'object';
  additionalProperties: false;
  properties: Record<string, unknown>;
  required: string[];
};

export type ResponsesToolDefinition = {
  type: 'function';
  name: AssistantToolName;
  description: string;
  parameters: JsonSchema;
  strict: true;
};

export type AssistantToolName =
  | 'getDashboardSummary'
  | 'getAssetDetail'
  | 'addInvestmentPurchase'
  | 'addBullionPurchase'
  | 'addPropertyIncome'
  | 'addPropertyBill'
  | 'getPropertyAnalysis'
  | 'getTaxTrackerSummary'
  | 'recalculateDashboard';

export type PendingActionType = 'addInvestmentPurchase' | 'addBullionPurchase' | 'addPropertyIncome' | 'addPropertyBill';

export type PendingAction = {
  id: string;
  type: PendingActionType;
  title: string;
  summary: string;
  payload: Record<string, unknown>;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'cancelled';
};

export type ToolResult = {
  message: string;
  data?: unknown;
  pendingAction?: PendingAction;
};

export type AssistantToolCall = {
  id: string;
  name: AssistantToolName;
  arguments: Record<string, unknown>;
};

const pendingActions = new Map<string, PendingAction>();

const stringSchema = (description: string, enumValues?: readonly string[]) => ({
  type: 'string',
  description,
  ...(enumValues ? { enum: enumValues } : {}),
});

const numberSchema = (description: string) => ({
  type: 'number',
  description,
});

export const responsesToolDefinitions: ResponsesToolDefinition[] = [
  {
    type: 'function',
    name: 'getDashboardSummary',
    description: 'Return the deterministic dashboard summary for an OzWealthman user.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        userId: stringSchema('The user id to read.'),
      },
      required: ['userId'],
    },
  },
  {
    type: 'function',
    name: 'getAssetDetail',
    description: 'Return details for a specific stored asset or holding. Use this instead of estimating values.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        userId: stringSchema('The user id to read.'),
        assetType: stringSchema('The asset category to retrieve.', ['property', 'share', 'crypto', 'bullion']),
        assetId: stringSchema('The stored asset id.'),
      },
      required: ['userId', 'assetType', 'assetId'],
    },
  },
  {
    type: 'function',
    name: 'addInvestmentPurchase',
    description: 'Prepare an ETF, share, or crypto purchase for confirmation before saving.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        userId: stringSchema('The user id to update.'),
        symbol: stringSchema('The ticker or asset symbol.'),
        assetName: stringSchema('The readable asset name.'),
        amount: numberSchema('Total purchase amount in AUD.'),
        quantity: numberSchema('Quantity purchased.'),
        unitPrice: numberSchema('Unit price in AUD.'),
        accountId: stringSchema('The destination account id.'),
        transactionDate: stringSchema('The transaction date in YYYY-MM-DD format.'),
      },
      required: ['userId', 'symbol', 'assetName', 'amount', 'quantity', 'unitPrice', 'accountId', 'transactionDate'],
    },
  },
  {
    type: 'function',
    name: 'addBullionPurchase',
    description: 'Prepare a gold or silver lot purchase for confirmation before saving.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        userId: stringSchema('The user id to update.'),
        metalType: stringSchema('The metal purchased.', ['gold', 'silver']),
        itemName: stringSchema('The bullion item name.'),
        quantity: numberSchema('Quantity purchased.'),
        unitType: stringSchema('The bullion unit type.', ['oz', 'kg', 'grams']),
        buyPricePerUnit: numberSchema('Buy price per unit in AUD.'),
        accountId: stringSchema('The account id for the lot.'),
        purchaseDate: stringSchema('The purchase date in YYYY-MM-DD format.'),
        storageLocation: stringSchema('The storage location or vault.'),
      },
      required: ['userId', 'metalType', 'itemName', 'quantity', 'unitType', 'buyPricePerUnit', 'accountId', 'purchaseDate', 'storageLocation'],
    },
  },
  {
    type: 'function',
    name: 'addPropertyIncome',
    description: 'Prepare a property rental income transaction for confirmation before saving.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        userId: stringSchema('The user id to update.'),
        propertyId: stringSchema('The property id receiving income.'),
        amount: numberSchema('Rental income amount in AUD.'),
        transactionDate: stringSchema('The transaction date in YYYY-MM-DD format.'),
        notes: stringSchema('Short notes for the transaction.'),
      },
      required: ['userId', 'propertyId', 'amount', 'transactionDate', 'notes'],
    },
  },
  {
    type: 'function',
    name: 'addPropertyBill',
    description: 'Prepare a property bill such as water, rates, body corporate, insurance, utilities or repairs for confirmation before saving.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        userId: stringSchema('The user id to update.'),
        propertyId: stringSchema('The property id the bill belongs to.'),
        billType: stringSchema('The bill category.', ['water', 'rates', 'body_corporate', 'insurance', 'utilities', 'repairs', 'loan', 'other']),
        vendor: stringSchema('The biller or vendor name.'),
        amount: numberSchema('Bill amount in AUD.'),
        dueDate: stringSchema('Due date in YYYY-MM-DD format.'),
        paidDate: stringSchema('Paid date in YYYY-MM-DD format, or same as due date if already paid.'),
        recurrence: stringSchema('Bill recurrence.', ['once', 'monthly', 'quarterly', 'annual']),
        notes: stringSchema('Short notes for the bill.'),
      },
      required: ['userId', 'propertyId', 'billType', 'vendor', 'amount', 'dueDate', 'paidDate', 'recurrence', 'notes'],
    },
  },
  {
    type: 'function',
    name: 'getPropertyAnalysis',
    description: 'Return deterministic OzWealthman property analyser results and stored area research profile.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        userId: stringSchema('The user id to read.'),
        propertyId: stringSchema('Optional property id for an existing holding. Use demo analyser when blank.'),
      },
      required: ['userId', 'propertyId'],
    },
  },
  {
    type: 'function',
    name: 'getTaxTrackerSummary',
    description: 'Return PAYG, investment, SMSF tax and audit checklist tracking information.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        userId: stringSchema('The user id to read.'),
      },
      required: ['userId'],
    },
  },
  {
    type: 'function',
    name: 'recalculateDashboard',
    description: 'Recalculate dashboard rollups from stored data after a confirmed change.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        userId: stringSchema('The user id to recalculate.'),
      },
      required: ['userId'],
    },
  },
];

export const assistantToolDefinitions = responsesToolDefinitions;

function formatAUD(value: number) {
  return value.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}

function requireNumber(args: Record<string, unknown>, key: string) {
  const value = args[key];
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`${key} is required and must be a number.`);
  }
  return value;
}

function requireString(args: Record<string, unknown>, key: string) {
  const value = args[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${key} is required and must be a string.`);
  }
  return value;
}

function createPendingAction(type: PendingActionType, title: string, summary: string, payload: Record<string, unknown>): PendingAction {
  const pendingAction: PendingAction = {
    id: `pending-${Date.now()}`,
    type,
    title,
    summary,
    payload,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  pendingActions.set(pendingAction.id, pendingAction);
  return pendingAction;
}

function getAssetDetail(args: Record<string, unknown>) {
  const assetType = requireString(args, 'assetType') as AssetType;
  const assetId = requireString(args, 'assetId');

  if (assetType === 'bullion') {
    return getBullionLotById(assetId) ?? null;
  }
  if (assetType === 'property') {
    return demoData.propertyHoldings.find((holding) => holding.id === assetId) ?? null;
  }
  if (assetType === 'share') {
    return demoData.shareHoldings.find((holding) => holding.id === assetId) ?? null;
  }
  if (assetType === 'crypto') {
    return demoData.cryptoHoldings.find((holding) => holding.id === assetId) ?? null;
  }
  return null;
}

function prepareInvestmentPurchase(args: Record<string, unknown>) {
  const amount = requireNumber(args, 'amount');
  const quantity = requireNumber(args, 'quantity');
  const symbol = requireString(args, 'symbol').toUpperCase();
  const assetName = requireString(args, 'assetName');

  return createPendingAction(
    'addInvestmentPurchase',
    'Confirm investment purchase',
    `Record ${formatAUD(amount)} of ${symbol} (${assetName}), ${quantity} units. This will not be saved until confirmed.`,
    {
      userId: requireString(args, 'userId'),
      symbol,
      assetName,
      amount,
      quantity,
      unitPrice: requireNumber(args, 'unitPrice'),
      accountId: requireString(args, 'accountId'),
      transactionDate: requireString(args, 'transactionDate'),
    },
  );
}

function prepareBullionPurchase(args: Record<string, unknown>) {
  const metalType = requireString(args, 'metalType') as MetalType;
  const itemName = requireString(args, 'itemName');
  const quantity = requireNumber(args, 'quantity');
  const unitType = requireString(args, 'unitType') as UnitType;
  const buyPricePerUnit = requireNumber(args, 'buyPricePerUnit');
  const totalCost = quantity * buyPricePerUnit;

  return createPendingAction(
    'addBullionPurchase',
    'Confirm bullion purchase',
    `Record ${quantity} ${unitType} of ${metalType} bullion (${itemName}) for ${formatAUD(totalCost)}. This will not be saved until confirmed.`,
    {
      userId: requireString(args, 'userId'),
      metalType,
      itemName,
      quantity,
      unitType,
      buyPricePerUnit,
      accountId: requireString(args, 'accountId'),
      purchaseDate: requireString(args, 'purchaseDate'),
      storageLocation: requireString(args, 'storageLocation'),
    },
  );
}

function preparePropertyIncome(args: Record<string, unknown>) {
  const amount = requireNumber(args, 'amount');
  const propertyId = requireString(args, 'propertyId');
  const property = demoData.propertyHoldings.find((holding) => holding.id === propertyId);

  return createPendingAction(
    'addPropertyIncome',
    'Confirm property income',
    `Record ${formatAUD(amount)} rental income${property ? ` for ${property.name}` : ''}. This will not be saved until confirmed.`,
    {
      userId: requireString(args, 'userId'),
      propertyId,
      amount,
      transactionDate: requireString(args, 'transactionDate'),
      notes: requireString(args, 'notes'),
    },
  );
}

function preparePropertyBill(args: Record<string, unknown>) {
  const amount = requireNumber(args, 'amount');
  const propertyId = requireString(args, 'propertyId');
  const billType = requireString(args, 'billType') as PropertyBillType;
  const vendor = requireString(args, 'vendor');
  const property = demoData.propertyHoldings.find((holding) => holding.id === propertyId);

  return createPendingAction(
    'addPropertyBill',
    'Confirm property bill',
    `Record ${formatAUD(amount)} ${billType.replace('_', ' ')} bill from ${vendor}${property ? ` for ${property.name}` : ''}. This will not be saved until confirmed.`,
    {
      userId: requireString(args, 'userId'),
      propertyId,
      billType,
      vendor,
      amount,
      dueDate: requireString(args, 'dueDate'),
      paidDate: requireString(args, 'paidDate'),
      recurrence: requireString(args, 'recurrence'),
      notes: requireString(args, 'notes'),
    },
  );
}

export async function runAssistantTool(call: AssistantToolCall): Promise<ToolResult> {
  switch (call.name) {
    case 'getDashboardSummary':
      return {
        message: 'Dashboard summary returned from deterministic calculation services.',
        data: getDashboardSummary(demoData),
      };
    case 'getAssetDetail': {
      const data = getAssetDetail(call.arguments);
      return {
        message: data ? 'Asset detail returned from stored data.' : 'No stored asset matched that request.',
        data,
      };
    }
    case 'addInvestmentPurchase': {
      const pendingAction = prepareInvestmentPurchase(call.arguments);
      return {
        message: 'I prepared the investment purchase. Please confirm before I save it.',
        pendingAction,
      };
    }
    case 'addBullionPurchase': {
      const pendingAction = prepareBullionPurchase(call.arguments);
      return {
        message: 'I prepared the bullion lot purchase. Please confirm before I save it.',
        pendingAction,
      };
    }
    case 'addPropertyIncome': {
      const pendingAction = preparePropertyIncome(call.arguments);
      return {
        message: 'I prepared the property income transaction. Please confirm before I save it.',
        pendingAction,
      };
    }
    case 'addPropertyBill': {
      const pendingAction = preparePropertyBill(call.arguments);
      return {
        message: 'I prepared the property bill. Please confirm before I save it.',
        pendingAction,
      };
    }
    case 'getPropertyAnalysis': {
      const propertyId = typeof call.arguments.propertyId === 'string' ? call.arguments.propertyId.trim() : '';
      return {
        message: 'Property analysis returned from deterministic services.',
        data: propertyId ? getPropertyDetail(propertyId) ?? getDefaultPropertyAnalysis() : getDefaultPropertyAnalysis(),
      };
    }
    case 'getTaxTrackerSummary':
      return {
        message: 'Tax and SMSF compliance tracker returned from stored data.',
        data: getTaxTrackerSummary(),
      };
    case 'recalculateDashboard':
      return {
        message: 'Dashboard recalculated from stored data.',
        data: getDashboardSummary(demoData),
      };
    default:
      return {
        message: 'Unsupported tool call.',
      };
  }
}

export function confirmPendingAction(actionOrId: PendingAction | string): ToolResult {
  const actionId = typeof actionOrId === 'string' ? actionOrId : actionOrId.id;
  const action = pendingActions.get(actionId) ?? (typeof actionOrId === 'string' ? undefined : actionOrId);

  if (!action) {
    return {
      message: 'That pending action could not be found. No records were changed.',
      data: { actionId, status: 'missing' },
    };
  }

  const confirmedAction: PendingAction = { ...action, status: 'confirmed' };
  pendingActions.set(actionId, confirmedAction);

  return {
    message:
      'Confirmed. The mocked write layer marked the action as saved and recalculated the dashboard. Production wiring should persist the payload through Supabase before recalculation.',
    data: {
      actionId,
      status: 'confirmed',
      committedPayload: confirmedAction.payload,
      recalculatedDashboard: getDashboardSummary(demoData),
    },
  };
}

export function cancelPendingAction(actionOrId: PendingAction | string): ToolResult {
  const actionId = typeof actionOrId === 'string' ? actionOrId : actionOrId.id;
  const action = pendingActions.get(actionId) ?? (typeof actionOrId === 'string' ? undefined : actionOrId);

  if (action) {
    pendingActions.set(actionId, { ...action, status: 'cancelled' });
  }

  return {
    message: 'Cancelled. No records were changed.',
    data: {
      actionId,
      status: 'cancelled',
    },
  };
}
