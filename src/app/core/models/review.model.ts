import { CategoryId } from './product.model';

export interface Review {
  id: number;
  author: string;
  location: string;
  rating: number;
  product: string;
  category: CategoryId;
  date: string;
  text: string;
  helpful: number;
}

export interface RatingBar {
  stars: number;
  percent: number;
}

export interface ReviewSummary {
  average: number;
  total: number;
  bars: RatingBar[];
}
