import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'Atelier Justinazaqueu — Handcrafted Leather Goods',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomePageComponent),
  },
  {
    path: 'shop',
    title: 'The Shop · Atelier Justinazaqueu',
    loadComponent: () => import('./pages/shop/shop').then((m) => m.ShopPageComponent),
  },
  {
    path: 'products/:id',
    title: 'Product Details · Atelier Justinazaqueu',
    loadComponent: () =>
      import('./pages/product-detail/product-detail').then((m) => m.ProductDetailPageComponent),
  },
  {
    path: 'collections',
    title: 'Collections · Atelier Justinazaqueu',
    loadComponent: () =>
      import('./pages/collections/collections').then((m) => m.CollectionsPageComponent),
  },
  {
    path: 'history',
    title: 'Our Story · Atelier Justinazaqueu',
    loadComponent: () => import('./pages/history/history').then((m) => m.HistoryPageComponent),
  },
  {
    path: 'reviews',
    title: 'Reviews · Atelier Justinazaqueu',
    loadComponent: () => import('./pages/reviews/reviews').then((m) => m.ReviewsPageComponent),
  },
  {
    path: 'contact',
    title: 'Contact · Atelier Justinazaqueu',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.ContactPageComponent),
  },
  {
    path: 'custom-order',
    title: 'Custom Order · Atelier Justinazaqueu',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/custom-order/custom-order').then((m) => m.CustomOrderPageComponent),
  },
  {
    path: 'login',
    title: 'Sign In · Atelier Justinazaqueu',
    loadComponent: () => import('./pages/auth/login/login').then((m) => m.LoginPageComponent),
  },
  {
    path: 'register',
    title: 'Create Account · Atelier Justinazaqueu',
    loadComponent: () =>
      import('./pages/auth/register/register').then((m) => m.RegisterPageComponent),
  },
  {
    path: 'forgot-password',
    title: 'Reset Password · Atelier Justinazaqueu',
    loadComponent: () =>
      import('./pages/auth/forgot-password/forgot-password').then(
        (m) => m.ForgotPasswordPageComponent,
      ),
  },
  {
    path: 'reset-password',
    title: 'Choose a New Password · Atelier Justinazaqueu',
    loadComponent: () =>
      import('./pages/auth/reset-password/reset-password').then(
        (m) => m.ResetPasswordPageComponent,
      ),
  },
  {
    path: 'account',
    title: 'My Account · Atelier Justinazaqueu',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/account/account').then((m) => m.AccountPageComponent),
  },
  {
    path: 'admin/products/new',
    title: 'New Product · Atelier Justinazaqueu',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./pages/admin/product-editor/product-editor').then(
        (m) => m.AdminProductEditorPageComponent,
      ),
  },
  {
    path: 'admin/products/:id',
    title: 'Edit Product · Atelier Justinazaqueu',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./pages/admin/product-editor/product-editor').then(
        (m) => m.AdminProductEditorPageComponent,
      ),
  },
  {
    path: 'admin',
    title: 'Admin Panel · Atelier Justinazaqueu',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin/admin').then((m) => m.AdminPageComponent),
  },
  { path: '**', redirectTo: '' },
];
