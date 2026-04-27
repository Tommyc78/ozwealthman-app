export type AccountType = 'cash' | 'super' | 'smsf' | 'property' | 'brokerage' | 'crypto' | 'bullion';
export type AssetType = 'cash' | 'property' | 'super' | 'share' | 'crypto' | 'bullion';
export type MetalType = 'gold' | 'silver';
export type UnitType = 'oz' | 'kg' | 'grams';
export type ContributionFrequency = 'weekly' | 'fortnightly' | 'monthly' | 'annual';
export type PropertyBillType = 'water' | 'rates' | 'body_corporate' | 'insurance' | 'utilities' | 'repairs' | 'loan' | 'other';
export type BillStatus = 'upcoming' | 'paid' | 'overdue';

export type User = {
  id: string;
  first_name: string;
  age: number;
  country: 'Australia';
  currency: 'AUD';
  created_at: string;
};

export type Profile = {
  user_id: string;
  annual_income: number;
  estimated_monthly_expenses: number;
  current_super_balance: number;
  has_smsf: boolean;
  has_property: boolean;
  has_etfs: boolean;
  has_bullion: boolean;
  has_crypto: boolean;
  retirement_target: number;
  passive_income_target: number;
};

export type Account = {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  institution: string;
  is_smsf: boolean;
  current_balance?: number;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  account_id: string;
  transaction_type: 'income' | 'expense' | 'buy' | 'sell' | 'contribution' | 'transfer';
  category: string;
  asset_type?: AssetType;
  asset_symbol?: string;
  asset_name?: string;
  amount: number;
  quantity?: number;
  unit_price?: number;
  transaction_date: string;
  notes?: string;
  created_at: string;
};

export type BudgetCategory = {
  id: string;
  user_id: string;
  name: string;
  category_type: 'income' | 'fixed' | 'discretionary' | 'saving';
  monthly_target: number;
};

export type PropertyHolding = {
  id: string;
  user_id: string;
  account_id: string;
  name: string;
  location: string;
  ownership_type: 'personal' | 'smsf';
  current_value: number;
  loan_balance: number;
  weekly_rent: number;
  annual_expenses: number;
  notes?: string;
};

export type PropertyBill = {
  id: string;
  user_id: string;
  property_id: string;
  bill_type: PropertyBillType;
  vendor: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  recurrence: 'once' | 'monthly' | 'quarterly' | 'annual';
  status: BillStatus;
  notes?: string;
};

export type PropertyProjection = {
  property_id: string;
  base_growth_rate: number;
  downside_growth_rate: number;
  upside_growth_rate: number;
  projection_years: number;
  local_market_summary: string;
  ai_research_status: 'not_connected' | 'ready_for_provider';
  research_sources: string[];
};

export type PropertyAnalysisInput = {
  id: string;
  user_id: string;
  name: string;
  address?: string;
  property_type?: string;
  suburb: string;
  state: string;
  purchase_price: number;
  deposit: number;
  loan_amount: number;
  interest_rate: number;
  weekly_rent: number;
  low_weekly_rent?: number;
  high_weekly_rent?: number;
  vacancy_rate: number;
  annual_rates: number;
  annual_water_rates: number;
  annual_insurance: number;
  annual_landlord_insurance: number;
  annual_body_corporate: number;
  annual_repairs: number;
  annual_management_fees: number;
  management_fee_rate: number;
  stamp_duty: number;
  legal_and_buying_costs: number;
  buffer: number;
  projected_growth_rate: number;
  bedrooms?: number;
  bathrooms?: number;
  garage_spaces?: number;
  living_area_sqm?: number;
  units_in_block?: number;
  occupancy?: string;
  lease_rent?: number;
  advertisement_url?: string;
};

export type TaxTrackerItem = {
  id: string;
  user_id: string;
  tax_year: string;
  context: 'payg' | 'investment' | 'smsf';
  title: string;
  due_date: string;
  status: 'not_started' | 'in_progress' | 'ready' | 'done';
  notes: string;
};

export type SMSFComplianceChecklistItem = {
  id: string;
  user_id: string;
  tax_year: string;
  title: string;
  category: 'tax' | 'audit' | 'records' | 'strategy' | 'lodgement';
  due_date: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
};

export type SuperHolding = {
  id: string;
  user_id: string;
  account_id: string;
  fund_name: string;
  current_balance: number;
  contribution_rate: number;
  contribution_frequency: ContributionFrequency;
};

export type ShareHolding = {
  id: string;
  user_id: string;
  account_id: string;
  symbol: string;
  name: string;
  quantity: number;
  average_cost: number;
  current_price: number;
  current_value: number;
};

export type CryptoHolding = ShareHolding;

export type BullionLot = {
  id: string;
  user_id: string;
  account_id: string;
  metal_type: MetalType;
  item_name: string;
  unit_type: UnitType;
  quantity: number;
  buy_price_per_unit: number;
  total_cost: number;
  purchase_date: string;
  current_spot_price: number;
  current_estimated_value: number;
  unrealized_gain_loss: number;
  storage_location: string;
  notes?: string;
};

export type DashboardSnapshot = {
  id: string;
  user_id: string;
  net_worth: number;
  monthly_surplus: number;
  super_total: number;
  smsf_total: number;
  passive_income_monthly: number;
  updated_at: string;
};

export type DemoData = {
  user: User;
  profile: Profile;
  accounts: Account[];
  transactions: Transaction[];
  budgetCategories: BudgetCategory[];
  propertyHoldings: PropertyHolding[];
  propertyBills: PropertyBill[];
  propertyProjections: PropertyProjection[];
  propertyAnalysisInputs: PropertyAnalysisInput[];
  taxTrackerItems: TaxTrackerItem[];
  smsfComplianceChecklist: SMSFComplianceChecklistItem[];
  superHoldings: SuperHolding[];
  shareHoldings: ShareHolding[];
  cryptoHoldings: CryptoHolding[];
  bullionLots: BullionLot[];
};
