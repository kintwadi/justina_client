import { CategoryId } from '../models/product.model';

export interface ProductTypeDefinition {
  id: string;
  label: string;
  category?: CategoryId;
  optionFields: string[];
}

export const PRODUCT_TYPE_DEFINITIONS: readonly ProductTypeDefinition[] = [
  { id: 'tote-bag', label: 'Tote Bag', category: 'bags', optionFields: ['Size', 'Color', 'Material'] },
  { id: 'crossbody-bag', label: 'Crossbody Bag', category: 'bags', optionFields: ['Size', 'Color', 'Material'] },
  { id: 'weekender-bag', label: 'Weekender Bag', category: 'bags', optionFields: ['Size', 'Color', 'Material'] },
  { id: 'wallet', label: 'Wallet', category: 'wallets', optionFields: ['Color', 'Material', 'Finish'] },
  { id: 'card-holder', label: 'Card Holder', category: 'wallets', optionFields: ['Color', 'Material', 'Finish'] },
  { id: 'belt', label: 'Belt', category: 'accessories', optionFields: ['Size', 'Color', 'Material'] },
  { id: 'dress', label: 'Dress', optionFields: ['Size', 'Color', 'Material'] },
  { id: 'top', label: 'Top', optionFields: ['Size', 'Color', 'Material'] },
  { id: 'skirt', label: 'Skirt', optionFields: ['Size', 'Color', 'Material'] },
  { id: 'jewelry', label: 'Jewelry', category: 'accessories', optionFields: ['Size', 'Color', 'Material'] },
  { id: 'journal-cover', label: 'Journal Cover', category: 'accessories', optionFields: ['Size', 'Color', 'Material'] },
];

export function productTypeOptionsForCategory(category: CategoryId): ProductTypeDefinition[] {
  const categoryMatches = PRODUCT_TYPE_DEFINITIONS.filter((item) => item.category === category);
  const uncategorized = PRODUCT_TYPE_DEFINITIONS.filter((item) => !item.category);
  return [...categoryMatches, ...uncategorized];
}

export function findProductTypeDefinition(productType: string | null | undefined): ProductTypeDefinition | undefined {
  const normalized = (productType ?? '').trim().toLowerCase();
  return PRODUCT_TYPE_DEFINITIONS.find((item) => item.id === normalized);
}
