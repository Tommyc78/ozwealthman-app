import {
  AssistantToolCall,
  PendingAction,
  responsesToolDefinitions,
  runAssistantTool,
  ToolResult,
} from './toolRegistry';

export type WealthAssistantRequest = {
  userId: string;
  input: string;
};

export type WealthAssistantResponse = {
  id: string;
  message: string;
  toolCalls: AssistantToolCall[];
  toolResults: ToolResult[];
  pendingAction?: PendingAction;
  providerKey: AssistantProviderKey;
  providerLabel: string;
  consoleLines: string[];
};

export type AssistantProviderKey = 'oz_local' | 'openai_responses' | 'claude' | 'copilot';

export type AssistantProviderDefinition = {
  key: AssistantProviderKey;
  label: string;
  shortLabel: string;
  status: 'live' | 'backend_required' | 'enterprise_setup';
  description: string;
  endpointEnvVar?: string;
};

export const wealthAssistantSystemPrompt =
  'You are OzWealthman, an Australian wealth tracking assistant. Do not invent balances, prices, transactions, or portfolio values. Use tools for stored data and calculations. Ask for confirmation before material writes. Do not provide licensed personal financial advice.';

export const assistantProviders: AssistantProviderDefinition[] = [
  {
    key: 'oz_local',
    label: 'OzWealthman Local',
    shortLabel: 'Local mock',
    status: 'live',
    description: 'Runs the local tool layer immediately inside the app so the assistant is visible and testable right now.',
  },
  {
    key: 'openai_responses',
    label: 'ChatGPT / OpenAI',
    shortLabel: 'ChatGPT',
    status: 'backend_required',
    description: 'Provider-ready connector for the OpenAI Responses API. Best route for a real production assistant.',
    endpointEnvVar: 'EXPO_PUBLIC_OPENAI_EDGE_URL',
  },
  {
    key: 'claude',
    label: 'Claude / Anthropic',
    shortLabel: 'Claude',
    status: 'backend_required',
    description: 'Provider-ready connector for an Anthropic-backed edge function or server endpoint.',
    endpointEnvVar: 'EXPO_PUBLIC_ANTHROPIC_EDGE_URL',
  },
  {
    key: 'copilot',
    label: 'Copilot connector',
    shortLabel: 'Copilot',
    status: 'enterprise_setup',
    description: 'Best treated as an enterprise or backend integration rather than a direct consumer Copilot login inside the app.',
    endpointEnvVar: 'EXPO_PUBLIC_COPILOT_EDGE_URL',
  },
];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseMoney(text: string, fallback: number) {
  const match = text.match(/\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/);
  return match ? Number(match[1].replace(/,/g, '')) : fallback;
}

function parseQuantity(text: string, fallback: number) {
  const match = text.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:oz|kg|grams|units|unit|of)/i);
  return match ? Number(match[1]) : fallback;
}

function chooseMockToolCalls({ userId, input }: WealthAssistantRequest): AssistantToolCall[] {
  const text = input.toLowerCase();

  if (text.includes('record') || text.includes('bought') || text.includes('purchase') || text.includes('update my dashboard')) {
    if (text.includes('gold') || text.includes('silver') || text.includes('bullion')) {
      const metalType = text.includes('silver') ? 'silver' : 'gold';
      const unitType = text.includes('kg') ? 'kg' : text.includes('gram') ? 'grams' : 'oz';
      const buyPricePerUnit = parseMoney(text, metalType === 'gold' ? 4200 : 1510);
      return [
        {
          id: `call-${Date.now()}-bullion`,
          name: 'addBullionPurchase',
          arguments: {
            userId,
            metalType,
            itemName: metalType === 'gold' ? '1oz Gold Coin' : unitType === 'kg' ? '1kg Silver Bar' : 'Silver Bullion Lot',
            quantity: parseQuantity(text, 1),
            unitType,
            buyPricePerUnit,
            accountId: 'acct-smsf-bullion',
            purchaseDate: todayIsoDate(),
            storageLocation: text.includes('personal') ? 'Personal Safe' : 'SMSF Bullion Vault',
          },
        },
      ];
    }

    const symbolMatch = input.match(/\b([A-Z]{2,5})\b/);
    const symbol = symbolMatch?.[1] ?? 'IVV';
    const amount = parseMoney(text, 10000);
    return [
      {
        id: `call-${Date.now()}-investment`,
        name: 'addInvestmentPurchase',
        arguments: {
          userId,
          symbol,
          assetName: symbol === 'BTC' ? 'Bitcoin' : symbol === 'VAS' ? 'Vanguard Australian Shares ETF' : 'iShares S&P 500 ETF',
          amount,
          quantity: symbol === 'BTC' ? amount / 142000 : amount / 170,
          unitPrice: symbol === 'BTC' ? 142000 : 170,
          accountId: symbol === 'BTC' ? 'acct-crypto' : 'acct-broker',
          transactionDate: todayIsoDate(),
        },
      },
    ];
  }

  if (text.includes('rent') || text.includes('property income')) {
    return [
      {
        id: `call-${Date.now()}-rent`,
        name: 'addPropertyIncome',
        arguments: {
          userId,
          propertyId: 'prop-logan',
          amount: parseMoney(text, 2600),
          transactionDate: todayIsoDate(),
          notes: 'SMSF rental income recorded from assistant command',
        },
      },
    ];
  }

  if (
    text.includes('water') ||
    text.includes('rates') ||
    text.includes('body corporate') ||
    text.includes('insurance') ||
    text.includes('utilities') ||
    text.includes('bill')
  ) {
    const amount = parseMoney(text, 322);
    const billType = text.includes('body corporate')
      ? 'body_corporate'
      : text.includes('rates')
        ? 'rates'
        : text.includes('insurance')
          ? 'insurance'
          : text.includes('water')
            ? 'water'
            : text.includes('utilities')
              ? 'utilities'
              : 'other';
    const vendorMatch = input.match(/(?:for|from|paid for)\s+([A-Za-z ]+?)(?:\s+@|\s+at|\s+\$|$)/i);
    return [
      {
        id: `call-${Date.now()}-property-bill`,
        name: 'addPropertyBill',
        arguments: {
          userId,
          propertyId: text.includes('ipswich') ? 'prop-ipswich' : 'prop-logan',
          billType,
          vendor: vendorMatch?.[1]?.trim() || 'Property biller',
          amount,
          dueDate: todayIsoDate(),
          paidDate: text.includes('paid') ? todayIsoDate() : todayIsoDate(),
          recurrence: billType === 'rates' || billType === 'water' || billType === 'body_corporate' ? 'quarterly' : 'once',
          notes: input,
        },
      },
    ];
  }

  if (text.includes('property analyser') || text.includes('analyse property') || text.includes('analyze property')) {
    return [
      {
        id: `call-${Date.now()}-property-analysis`,
        name: 'getPropertyAnalysis',
        arguments: {
          userId,
          propertyId: '',
        },
      },
    ];
  }

  if (text.includes('tax') || text.includes('audit') || text.includes('checklist')) {
    return [
      {
        id: `call-${Date.now()}-tax`,
        name: 'getTaxTrackerSummary',
        arguments: { userId },
      },
    ];
  }

  if (text.includes('gold') || text.includes('silver') || text.includes('bullion')) {
    return [
      {
        id: `call-${Date.now()}-asset`,
        name: 'getAssetDetail',
        arguments: {
          userId,
          assetType: 'bullion',
          assetId: text.includes('silver') ? 'bullion-silver-1' : 'bullion-gold-1',
        },
      },
    ];
  }

  if (text.includes('recalculate') || text.includes('refresh dashboard')) {
    return [
      {
        id: `call-${Date.now()}-recalc`,
        name: 'recalculateDashboard',
        arguments: { userId },
      },
    ];
  }

  return [
    {
      id: `call-${Date.now()}-dashboard`,
      name: 'getDashboardSummary',
      arguments: { userId },
    },
  ];
}

function summarizeToolResults(toolResults: ToolResult[]) {
  const pending = toolResults.find((result) => result.pendingAction)?.pendingAction;
  if (pending) {
    return pending.summary;
  }

  const first = toolResults[0];
  if (!first) {
    return 'No tool result was returned.';
  }
  return first.message;
}

export async function createMockWealthAssistantResponse(
  request: WealthAssistantRequest,
  providerKey: AssistantProviderKey = 'oz_local',
): Promise<WealthAssistantResponse> {
  const toolCalls = chooseMockToolCalls(request);
  const toolResults = await Promise.all(toolCalls.map((toolCall) => runAssistantTool(toolCall)));
  const pendingAction = toolResults.find((result) => result.pendingAction)?.pendingAction;
  const provider = assistantProviders.find((item) => item.key === providerKey) ?? assistantProviders[0];
  const consoleLines = [
    `[${provider.shortLabel}] user input: ${request.input}`,
    `[${provider.shortLabel}] tools selected: ${toolCalls.map((toolCall) => toolCall.name).join(', ')}`,
    ...toolResults.map((result, index) => `[${provider.shortLabel}] result ${index + 1}: ${result.message}`),
  ];

  consoleLines.forEach((line) => console.log(line));

  return {
    id: `mock-response-${Date.now()}`,
    message: pendingAction
      ? `I prepared this change for confirmation: ${pendingAction.summary}`
      : `I used ${toolCalls.map((toolCall) => toolCall.name).join(', ')}. ${summarizeToolResults(toolResults)}`,
    toolCalls,
    toolResults,
    pendingAction,
    providerKey,
    providerLabel: provider.label,
    consoleLines,
  };
}

async function createRemoteProviderResponse(
  request: WealthAssistantRequest,
  providerKey: Exclude<AssistantProviderKey, 'oz_local'>,
): Promise<WealthAssistantResponse> {
  const provider = assistantProviders.find((item) => item.key === providerKey) ?? assistantProviders[0];
  const endpoint =
    provider.endpointEnvVar === 'EXPO_PUBLIC_OPENAI_EDGE_URL'
      ? process.env.EXPO_PUBLIC_OPENAI_EDGE_URL
      : provider.endpointEnvVar === 'EXPO_PUBLIC_ANTHROPIC_EDGE_URL'
        ? process.env.EXPO_PUBLIC_ANTHROPIC_EDGE_URL
        : provider.endpointEnvVar === 'EXPO_PUBLIC_COPILOT_EDGE_URL'
          ? process.env.EXPO_PUBLIC_COPILOT_EDGE_URL
          : undefined;

  if (!endpoint) {
    const consoleLines = [
      `[${provider.shortLabel}] connector requested but no endpoint is configured.`,
      `[${provider.shortLabel}] configure ${provider.endpointEnvVar} to point at a secure backend or Supabase Edge Function.`,
      `[${provider.shortLabel}] local mock remains available for tool and UX testing.`,
    ];
    consoleLines.forEach((line) => console.log(line));
    return {
      id: `provider-missing-${Date.now()}`,
      message: `${provider.label} is provider-ready, but not wired yet. Add ${provider.endpointEnvVar} and route calls through a secure backend or Supabase Edge Function. Until then, use OzWealthman Local for testing.`,
      toolCalls: [],
      toolResults: [],
      providerKey,
      providerLabel: provider.label,
      consoleLines,
    };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: providerKey,
      request,
      systemPrompt: wealthAssistantSystemPrompt,
      tools: responsesToolDefinitions,
    }),
  });

  if (!response.ok) {
    throw new Error(`${provider.label} connector failed with ${response.status}.`);
  }

  const payload = (await response.json()) as Partial<WealthAssistantResponse>;
  const consoleLines = payload.consoleLines ?? [`[${provider.shortLabel}] remote provider completed.`];
  consoleLines.forEach((line) => console.log(line));

  return {
    id: payload.id ?? `remote-response-${Date.now()}`,
    message: payload.message ?? `${provider.label} returned a response.`,
    toolCalls: payload.toolCalls ?? [],
    toolResults: payload.toolResults ?? [],
    pendingAction: payload.pendingAction,
    providerKey,
    providerLabel: provider.label,
    consoleLines,
  };
}

export async function createWealthAssistantResponse(
  request: WealthAssistantRequest,
  providerKey: AssistantProviderKey = 'oz_local',
): Promise<WealthAssistantResponse> {
  if (providerKey === 'oz_local') {
    return createMockWealthAssistantResponse(request, providerKey);
  }

  try {
    return await createRemoteProviderResponse(request, providerKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown connector error.';
    console.log(`[${providerKey}] connector error: ${message}`);
    return {
      id: `provider-error-${Date.now()}`,
      message: `${message} Falling back to OzWealthman Local is recommended while the provider connector is being wired.`,
      toolCalls: [],
      toolResults: [],
      providerKey,
      providerLabel: assistantProviders.find((item) => item.key === providerKey)?.label ?? providerKey,
      consoleLines: [`[${providerKey}] ${message}`],
    };
  }
}

export async function createRawOpenAIResponse(request: WealthAssistantRequest) {
  void request;
  void responsesToolDefinitions;
  void wealthAssistantSystemPrompt;
  throw new Error(
    'Real OpenAI Responses API calls should be made from a secure backend or Supabase Edge Function. The app uses createWealthAssistantResponse, which can run locally or call provider endpoints when configured.',
  );
}
