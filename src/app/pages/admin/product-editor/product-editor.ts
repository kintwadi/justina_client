import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import {
  PRODUCT_TYPE_DEFINITIONS,
  findProductTypeDefinition,
  productTypeOptionsForCategory,
} from '../../../core/config/product-editor.config';
import {
  AdminCategory,
  AdminProduct,
  AdminProductPayload,
  AdminProductType,
  ProductTranslations,
} from '../../../core/models/admin.model';
import { AppLanguage } from '../../../core/models/locale.model';
import { CATEGORY_IDS, CategoryId } from '../../../core/models/product.model';
import { AdminService } from '../../../core/services/admin.service';
import { LocaleService } from '../../../core/services/locale.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/utils/error.util';
import { formatPrice } from '../../../core/utils/format.util';
import { IconComponent } from '../../../shared/components/icon/icon';

interface VariantOptionForm {
  uid: string;
  key: string;
  value: string;
  preset: boolean;
}

interface VariantForm {
  uid: string;
  sku: string;
  name: string;
  price: number | null;
  stock: number;
  image: string;
  gallery: string[];
  options: VariantOptionForm[];
}

/** Translatable product fields for a single language. */
interface TranslationForm {
  name: string;
  description: string;
  badge: string;
}

interface ProductEditorForm {
  name: string;
  slug: string;
  category: CategoryId;
  productTypePreset: string;
  productTypeCustom: string;
  sku: string;
  price: number | null;
  originalPrice: number | null;
  badge: string;
  image: string;
  gallery: string[];
  options: VariantOptionForm[];
  imageClass: string;
  description: string;
  inStock: boolean;
  stockQuantity: number | null;
  featured: boolean;
  customMade: boolean;
  date: string;
  variants: VariantForm[];
  translations: Record<string, TranslationForm>;
}

interface UploadedGalleryItem {
  url: string;
  generated: boolean;
}

const GENERATED_IMAGE_BASE =
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?image_size=portrait_4_3&prompt=';

/** Base language; its values live on the entity itself, not in the translations map. */
const BASE_LANGUAGE: AppLanguage = 'en';

let variantSequence = 0;
let optionSequence = 0;

function optionUid(): string {
  return `option-${++optionSequence}`;
}

function variantUid(): string {
  return `variant-${++variantSequence}`;
}

function createOption(key = '', value = '', preset = false): VariantOptionForm {
  return { uid: optionUid(), key, value, preset };
}

function createVariant(presetFields: string[] = []): VariantForm {
  return {
    uid: variantUid(),
    sku: '',
    name: '',
    price: null,
    stock: 0,
    image: '',
    gallery: [],
    options: presetFields.map((field) => createOption(field, '', true)),
  };
}

function emptyForm(): ProductEditorForm {
  return {
    name: '',
    slug: '',
    category: 'bags',
    productTypePreset: '',
    productTypeCustom: '',
    sku: '',
    price: null,
    originalPrice: null,
    badge: '',
    image: '',
    gallery: [],
    options: [],
    imageClass: '',
    description: '',
    inStock: true,
    stockQuantity: 0,
    featured: false,
    customMade: false,
    date: '',
    variants: [],
    translations: {},
  };
}

@Component({
  selector: 'app-admin-product-editor-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, IconComponent],
  templateUrl: './product-editor.html',
  styleUrl: './product-editor.scss',
})
export class AdminProductEditorPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly admin = inject(AdminService);
  private readonly locale = inject(LocaleService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private previewRefreshTimer: ReturnType<typeof setInterval> | null = null;

  protected readonly productId = Number(this.route.snapshot.paramMap.get('id') ?? 0) || null;
  protected readonly isEdit = this.productId !== null;

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly uploadNotice = signal<string | null>(null);
  protected readonly previewImageRefreshNonce = signal(Date.now());
  protected readonly form = signal<ProductEditorForm>(emptyForm());
  protected readonly categoryOptions = signal<AdminCategory[]>([]);
  protected readonly productTypeOptions = signal<AdminProductType[]>([]);

  protected readonly languages = this.locale.languages;
  protected readonly baseLanguage: AppLanguage = BASE_LANGUAGE;
  /** Language whose translation overrides the editor currently targets. */
  protected readonly translationLanguage = signal<AppLanguage>(
    this.locale.languages.find((language) => language.code !== BASE_LANGUAGE)?.code ?? BASE_LANGUAGE,
  );
  protected readonly isBaseLanguage = computed(
    () => this.translationLanguage() === BASE_LANGUAGE,
  );

  protected readonly resolvedProductType = computed(() => {
    const form = this.form();
    return form.productTypeCustom.trim() || form.productTypePreset || '';
  });
  protected readonly categories = computed(() => {
    const categories = this.categoryOptions();
    if (categories.length > 0) {
      return categories;
    }
    return CATEGORY_IDS.map((category) => ({
      id: 0,
      slug: category,
      label: this.labelize(category),
      description: null,
      displayOrder: 0,
      productCount: 0,
    }));
  });
  protected readonly suggestedTypes = computed(() => {
    const productTypes = this.productTypeOptions();
    if (productTypes.length > 0) {
      return productTypes.filter(
        (type) => !type.category || type.category.toLowerCase() === this.form().category.toLowerCase(),
      );
    }
    return productTypeOptionsForCategory(this.form().category).map((type) => ({
      id: 0,
      slug: type.id,
      label: type.label,
      category: type.category ?? null,
      description: null,
      displayOrder: 0,
      presetFields: [...type.optionFields],
    }));
  });
  protected readonly presetFields = computed(
    () => this.resolvePresetFields(this.resolvedProductType()),
  );
  protected readonly previewPrice = computed(() => {
    const value = this.form().price;
    return value !== null && value > 0 ? formatPrice(value) : '—';
  });
  protected readonly previewSku = computed(
    () => this.resolveBaseSku(this.form()).trim() || 'Auto-generated on save',
  );
  protected readonly previewStock = computed(() => {
    const value = this.form().stockQuantity;
    return value !== null && value > 0 ? `${value} available` : 'Sold out';
  });
  protected readonly previewGallery = computed(() => {
    const form = this.form();
    return [form.image.trim(), ...this.normalizedGallery(form.gallery, form.image)].filter(
      (image): image is string => Boolean(image),
    );
  });
  protected readonly previewName = computed(
    () => this.translationValue('name').trim() || this.form().name || 'Untitled product',
  );
  protected readonly previewDescription = computed(
    () => this.translationValue('description').trim() || this.form().description,
  );
  protected readonly previewBadge = computed(
    () => this.translationValue('badge').trim() || this.form().badge,
  );

  constructor() {
    this.loadEditorData();
    effect(() => {
      const hasGeneratedPreviewImage = this.previewGallery().some((image) => this.isGeneratedImage(image));
      if (hasGeneratedPreviewImage) {
        this.ensurePreviewRefreshTimer();
      } else {
        this.clearPreviewRefreshTimer();
      }
    });
    this.destroyRef.onDestroy(() => this.clearPreviewRefreshTimer());
  }

  protected update<K extends keyof ProductEditorForm>(field: K, value: ProductEditorForm[K]): void {
    this.form.update((form) => ({ ...form, [field]: value }));
  }

  protected setTranslationLanguage(language: AppLanguage): void {
    this.translationLanguage.set(language);
  }

  /** Value of a translatable field for the language currently being edited. */
  protected translationValue(field: keyof TranslationForm): string {
    return this.form().translations[this.translationLanguage()]?.[field] ?? '';
  }

  protected updateTranslation(field: keyof TranslationForm, value: string): void {
    this.form.update((form) => {
      const language = this.translationLanguage();
      const current = form.translations[language] ?? { name: '', description: '', badge: '' };
      return {
        ...form,
        translations: {
          ...form.translations,
          [language]: { ...current, [field]: value },
        },
      };
    });
  }

  protected updateCategory(category: CategoryId): void {
    this.form.update((form) => ({
      ...form,
      category,
      variants: this.syncPresetFields(form.variants, this.optionFieldsForResolvedType(form)),
    }));
  }

  protected updateProductTypePreset(value: string): void {
    this.form.update((form) => {
      const next = { ...form, productTypePreset: value };
      return {
        ...next,
        variants: this.syncPresetFields(next.variants, this.optionFieldsForResolvedType(next)),
      };
    });
  }

  protected updateProductTypeCustom(value: string): void {
    this.form.update((form) => {
      const next = { ...form, productTypeCustom: value };
      return {
        ...next,
        variants: this.syncPresetFields(next.variants, this.optionFieldsForResolvedType(next)),
      };
    });
  }

  protected addVariant(): void {
    this.form.update((form) => ({
      ...form,
      variants: [...form.variants, createVariant(this.presetFields())],
    }));
  }

  protected removeVariant(index: number): void {
    this.form.update((form) => ({
      ...form,
      variants: form.variants.filter((_, position) => position !== index),
    }));
  }

  protected updateVariant<K extends keyof Omit<VariantForm, 'uid' | 'gallery' | 'options'>>(
    index: number,
    field: K,
    value: VariantForm[K],
  ): void {
    this.form.update((form) => ({
      ...form,
      variants: form.variants.map((variant, position) =>
        position === index ? { ...variant, [field]: value } : variant,
      ),
    }));
  }

  protected addProductGalleryImage(): void {
    this.form.update((form) => ({ ...form, gallery: [...form.gallery, ''] }));
  }

  protected updateProductGalleryImage(index: number, value: string): void {
    this.form.update((form) => ({
      ...form,
      gallery: form.gallery.map((image, position) => (position === index ? value : image)),
    }));
  }

  protected removeProductGalleryImage(index: number): void {
    this.form.update((form) => ({
      ...form,
      gallery: form.gallery.filter((_, position) => position !== index),
    }));
  }

  protected addVariantGalleryImage(index: number): void {
    this.form.update((form) => ({
      ...form,
      variants: form.variants.map((variant, position) =>
        position === index ? { ...variant, gallery: [...variant.gallery, ''] } : variant,
      ),
    }));
  }

  protected updateVariantGalleryImage(index: number, imageIndex: number, value: string): void {
    this.form.update((form) => ({
      ...form,
      variants: form.variants.map((variant, position) =>
        position === index
          ? {
              ...variant,
              gallery: variant.gallery.map((image, current) =>
                current === imageIndex ? value : image,
              ),
            }
          : variant,
      ),
    }));
  }

  protected removeVariantGalleryImage(index: number, imageIndex: number): void {
    this.form.update((form) => ({
      ...form,
      variants: form.variants.map((variant, position) =>
        position === index
          ? {
              ...variant,
              gallery: variant.gallery.filter((_, current) => current !== imageIndex),
            }
          : variant,
      ),
    }));
  }

  protected addManualOption(index: number): void {
    this.form.update((form) => ({
      ...form,
      variants: form.variants.map((variant, position) =>
        position === index
          ? { ...variant, options: [...variant.options, createOption('', '', false)] }
          : variant,
      ),
    }));
  }

  protected addProductOption(): void {
    this.form.update((form) => ({
      ...form,
      options: [...form.options, createOption('', '', false)],
    }));
  }

  protected updateOption(index: number, optionIndex: number, field: 'key' | 'value', value: string): void {
    this.form.update((form) => ({
      ...form,
      variants: form.variants.map((variant, position) =>
        position === index
          ? {
              ...variant,
              options: variant.options.map((option, current) =>
                current === optionIndex ? { ...option, [field]: value } : option,
              ),
            }
          : variant,
      ),
    }));
  }

  protected updateProductOptionByUid(
    optionUidValue: string,
    field: 'key' | 'value',
    value: string,
  ): void {
    this.form.update((form) => ({
      ...form,
      options: form.options.map((option) =>
        option.uid === optionUidValue ? { ...option, [field]: value } : option,
      ),
    }));
  }

  protected updateOptionByUid(
    variantIndex: number,
    optionUidValue: string,
    field: 'key' | 'value',
    value: string,
  ): void {
    this.form.update((form) => ({
      ...form,
      variants: form.variants.map((variant, position) =>
        position === variantIndex
          ? {
              ...variant,
              options: variant.options.map((option) =>
                option.uid === optionUidValue ? { ...option, [field]: value } : option,
              ),
            }
          : variant,
      ),
    }));
  }

  protected removeProductOptionByUid(optionUidValue: string): void {
    this.form.update((form) => ({
      ...form,
      options: form.options.filter((option) => option.uid !== optionUidValue),
    }));
  }

  protected removeOptionByUid(variantIndex: number, optionUidValue: string): void {
    this.form.update((form) => ({
      ...form,
      variants: form.variants.map((variant, position) =>
        position === variantIndex
          ? {
              ...variant,
              options: variant.options.filter(
                (option) => option.uid !== optionUidValue || option.preset,
              ),
            }
          : variant,
      ),
    }));
  }

  protected removeOption(index: number, optionIndex: number): void {
    this.form.update((form) => ({
      ...form,
      variants: form.variants.map((variant, position) =>
        position === index
          ? {
              ...variant,
              options: variant.options.filter((option, current) => current !== optionIndex || option.preset),
            }
          : variant,
      ),
    }));
  }

  protected onProductImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    this.uploading.set(true);
    this.admin.uploadMedia(file, 'products').subscribe({
      next: (media) => {
        this.uploading.set(false);
        this.update('image', media.url);
        this.toast.show('Product image uploaded.');
      },
      error: (error: unknown) => {
        this.uploading.set(false);
        const url = this.generatedImageUrl(this.form().name || 'product', this.form().description);
        this.update('image', url);
        this.uploadNotice.set(
          `${apiErrorMessage(error, 'Product image upload failed.')} A generated image URL was added so you can continue editing.`,
        );
      },
    });
  }

  protected onProductGallerySelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) {
      return;
    }
    this.uploadGalleryFiles(
      files,
      (offset) => this.generatedImageUrl(`${this.form().name} detail ${offset}`, this.form().description),
      (urls) => this.appendProductGalleryUrls(urls),
      'gallery image',
      'product gallery',
    );
  }

  protected onVariantImageSelected(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    this.uploading.set(true);
    this.admin.uploadMedia(file, 'products').subscribe({
      next: (media) => {
        this.uploading.set(false);
        this.updateVariant(index, 'image', media.url);
        this.toast.show('Variant image uploaded.');
      },
      error: (error: unknown) => {
        this.uploading.set(false);
        const variant = this.form().variants[index];
        this.updateVariant(index, 'image', this.generatedImageUrl(variant?.name || 'product variant', this.form().description));
        this.uploadNotice.set(
          `${apiErrorMessage(error, 'Variant image upload failed.')} A generated variant image URL was added so you can continue editing.`,
        );
      },
    });
  }

  protected onVariantGallerySelected(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) {
      return;
    }
    this.uploadGalleryFiles(
      files,
      (offset) => {
        const variant = this.form().variants[index];
        return this.generatedImageUrl(
          `${variant?.name || 'product variant'} detail ${offset}`,
          this.form().description,
        );
      },
      (urls) => this.appendVariantGalleryUrls(index, urls),
      'variant gallery image',
      'variant gallery',
    );
  }

  protected generateProductImage(): void {
    this.update('image', this.generatedImageUrl(this.form().name || 'product', this.form().description));
    if (!this.form().imageClass.trim()) {
      this.update('imageClass', 'prod-img-1');
    }
  }

  protected generateProductGalleryImage(): void {
    this.appendProductGallery(this.generatedImageUrl(`${this.form().name} detail`, this.form().description));
  }

  protected generateVariantImage(index: number): void {
    const variant = this.form().variants[index];
    this.updateVariant(index, 'image', this.generatedImageUrl(variant?.name || 'product variant', this.form().description));
  }

  protected generateVariantGalleryImage(index: number): void {
    const variant = this.form().variants[index];
    this.appendVariantGallery(
      index,
      this.generatedImageUrl(`${variant?.name || 'product variant'} detail`, this.form().description),
    );
  }

  protected save(): void {
    if (this.saving()) {
      return;
    }
    const form = this.form();
    const finalImage = form.image.trim() || this.generatedImageUrl(form.name || 'product', form.description);
    const problems: string[] = [];
    if (!form.name.trim()) {
      problems.push('Name is required.');
    }
    if (!form.description.trim()) {
      problems.push('Description is required.');
    }
    if (form.price === null || form.price <= 0) {
      problems.push('Base price must be greater than 0.');
    }
    form.variants.forEach((variant, index) => {
      if (!variant.name.trim()) {
        problems.push(`Variant ${index + 1} needs a name.`);
      }
      if (variant.price === null || variant.price <= 0) {
        problems.push(`Variant ${index + 1} needs its own price.`);
      }
    });

    if (problems.length > 0) {
      this.formError.set(problems.join(' '));
      return;
    }

    const payload: AdminProductPayload = {
      name: form.name.trim(),
      slug: form.slug.trim() || null,
      category: form.category,
      productType: this.resolvedProductType().trim() || null,
      sku: this.resolveBaseSku(form),
      price: form.price as number,
      originalPrice: form.originalPrice,
      badge: form.badge.trim() || null,
      image: finalImage,
      gallery: this.normalizedGallery(form.gallery, finalImage),
      options: this.toOptionsMap(form.options),
      imageClass: form.imageClass.trim() || 'prod-img-1',
      description: form.description.trim(),
      inStock: form.inStock,
      stockQuantity: Math.max(form.stockQuantity ?? 0, 0),
      date: form.date || null,
      featured: form.featured,
      customMade: form.customMade,
      displayOrder: null,
      variants: form.variants.map((variant, index) => ({
        sku: this.resolveVariantSku(form, variant, index),
        name: variant.name.trim(),
        price: variant.price,
        priceDelta:
          form.price === null || variant.price === null ? null : Number((variant.price - form.price).toFixed(2)),
        stock: variant.stock,
        image: variant.image.trim() || null,
        gallery: this.normalizedGallery(variant.gallery, variant.image),
        options: this.toOptionsMap(variant.options),
      })),
      translations: this.buildTranslations(form.translations),
    };

    this.saving.set(true);
    this.formError.set(null);
    const request =
      this.productId === null
        ? this.admin.createProduct(payload)
        : this.admin.updateProduct(this.productId, payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.show(this.productId === null ? 'Product created.' : 'Product updated.');
        this.router.navigate(['/admin']);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(apiErrorMessage(error, 'Could not save the product.'));
      },
    });
  }

  protected cancel(): void {
    this.router.navigate(['/admin']);
  }

  protected price(value: number): string {
    return formatPrice(value);
  }

  protected previewImageSrc(image: string): string {
    const trimmed = image.trim();
    if (!trimmed || !this.isGeneratedImage(trimmed)) {
      return trimmed;
    }
    const separator = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${separator}preview=${this.previewImageRefreshNonce()}`;
  }

  protected variantPreviewImages(variant: VariantForm): string[] {
    return [variant.image.trim(), ...this.normalizedGallery(variant.gallery, variant.image)].filter(
      (image): image is string => Boolean(image),
    );
  }

  protected manualOptions(variant: VariantForm): VariantOptionForm[] {
    return variant.options.filter((option) => !option.preset);
  }

  protected productManualOptions(): VariantOptionForm[] {
    return this.form().options.filter((option) => !option.preset);
  }

  protected presetOptions(variant: VariantForm): VariantOptionForm[] {
    return variant.options.filter((option) => option.preset);
  }

  private loadProduct(id: number): void {
    this.admin.getProduct(id).subscribe({
      next: (product) => {
        this.form.set(this.formFromProduct(product));
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.formError.set(apiErrorMessage(error, 'Could not load the product.'));
        this.loading.set(false);
      },
    });
  }

  private loadEditorData(): void {
    forkJoin({
      categories: this.admin.listCategories().pipe(catchError(() => of([] as AdminCategory[]))),
      productTypes: this.admin
        .listProductTypes()
        .pipe(catchError(() => of([] as AdminProductType[]))),
    }).subscribe({
      next: ({ categories, productTypes }) => {
        this.categoryOptions.set(categories);
        this.productTypeOptions.set(productTypes);

        if (this.productId !== null) {
          this.loadProduct(this.productId);
          return;
        }

        const firstCategory = categories[0]?.slug ?? CATEGORY_IDS[0];
        this.form.update((form) => ({ ...form, category: firstCategory }));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private formFromProduct(product: AdminProduct): ProductEditorForm {
    const presetFields = this.resolvePresetFields(product.productType);
    const matchedType = this.findProductType(product.productType);
    const definition = findProductTypeDefinition(product.productType);
    return {
      name: product.name,
      slug: product.slug ?? '',
      category: product.category,
      productTypePreset: matchedType?.slug ?? definition?.id ?? '',
      productTypeCustom: matchedType || definition ? '' : (product.productType ?? ''),
      sku: product.sku ?? '',
      price: product.price,
      originalPrice: product.originalPrice,
      badge: product.badge ?? '',
      image: product.image,
      gallery: [...(product.gallery ?? [])],
      options: this.optionsFromMap(product.options),
      imageClass: product.imageClass ?? '',
      description: product.description,
      inStock: product.inStock,
      stockQuantity: product.stockQuantity ?? 0,
      featured: product.featured,
      customMade: product.customMade === true,
      date: product.date ?? '',
      variants: (product.variants ?? []).map((variant) =>
        this.variantFromProduct(variant, presetFields, product.price),
      ),
      translations: this.translationsFromProduct(product.translations),
    };
  }

  /** Extracts editable translation overrides from a product, ignoring the base locale. */
  private translationsFromProduct(source: ProductTranslations | undefined): Record<string, TranslationForm> {
    const translations: Record<string, TranslationForm> = {};
    for (const [locale, fields] of Object.entries(source ?? {})) {
      if (locale === BASE_LANGUAGE) {
        continue;
      }
      translations[locale] = {
        name: fields['name'] ?? '',
        description: fields['description'] ?? '',
        badge: fields['badge'] ?? '',
      };
    }
    return translations;
  }

  /** Builds the outgoing translations map, dropping the base locale and blank fields. */
  private buildTranslations(source: Record<string, TranslationForm>): ProductTranslations {
    const translations: ProductTranslations = {};
    for (const [locale, fields] of Object.entries(source)) {
      if (locale === BASE_LANGUAGE) {
        continue;
      }
      const cleaned: Record<string, string> = {};
      if (fields.name.trim()) {
        cleaned['name'] = fields.name.trim();
      }
      if (fields.description.trim()) {
        cleaned['description'] = fields.description.trim();
      }
      if (fields.badge.trim()) {
        cleaned['badge'] = fields.badge.trim();
      }
      if (Object.keys(cleaned).length > 0) {
        translations[locale] = cleaned;
      }
    }
    return translations;
  }

  private variantFromProduct(
    variant: AdminProduct['variants'][number],
    presetFields: string[],
    basePrice: number,
  ): VariantForm {
    const options = variant.options ?? {};
    const presetOptions = presetFields.map((field) => createOption(field, options[field] ?? '', true));
    const manualOptions = Object.entries(options)
      .filter(([key]) => !presetFields.includes(key))
      .map(([key, value]) => createOption(key, value, false));

    return {
      uid: variantUid(),
      sku: variant.sku,
      name: variant.name,
      price:
        variant.price !== null && variant.price !== undefined
          && variant.price > 0
          ? variant.price
          : (variant.priceDelta ?? 0) + basePrice,
      stock: variant.stock,
      image: variant.image ?? '',
      gallery: [...(variant.gallery ?? [])],
      options: [...presetOptions, ...manualOptions],
    };
  }

  private optionsFromMap(options: Record<string, string> | null | undefined): VariantOptionForm[] {
    return Object.entries(options ?? {}).map(([key, value]) => createOption(key, value, false));
  }

  private appendProductGallery(url: string): void {
    const value = url.trim();
    if (!value) {
      return;
    }
    this.form.update((form) => ({
      ...form,
      gallery: this.normalizedGallery([...form.gallery, value], form.image),
    }));
  }

  private appendProductGalleryUrls(urls: string[]): void {
    if (urls.length === 0) {
      return;
    }
    this.form.update((form) => ({
      ...form,
      gallery: this.normalizedGallery([...form.gallery, ...urls], form.image),
    }));
  }

  private appendVariantGallery(index: number, url: string): void {
    const value = url.trim();
    if (!value) {
      return;
    }
    this.form.update((form) => ({
      ...form,
      variants: form.variants.map((variant, position) =>
        position === index
          ? {
              ...variant,
              gallery: this.normalizedGallery([...variant.gallery, value], variant.image),
            }
          : variant,
      ),
    }));
  }

  private appendVariantGalleryUrls(index: number, urls: string[]): void {
    if (urls.length === 0) {
      return;
    }
    this.form.update((form) => ({
      ...form,
      variants: form.variants.map((variant, position) =>
        position === index
          ? {
              ...variant,
              gallery: this.normalizedGallery([...variant.gallery, ...urls], variant.image),
            }
          : variant,
      ),
    }));
  }

  private normalizedGallery(gallery: string[], mainImage: string): string[] {
    const primary = mainImage.trim();
    const unique = new Set<string>();
    for (const image of gallery) {
      const candidate = image.trim();
      if (!candidate || candidate === primary || unique.has(candidate)) {
        continue;
      }
      unique.add(candidate);
    }
    return [...unique];
  }

  private generatedImageUrl(title: string, description: string): string {
    const prompt = [
      title.trim() || 'artisan fashion product',
      description.trim() || 'luxury product photography',
      'editorial studio light',
      'neutral background',
    ].join(', ');
    return `${GENERATED_IMAGE_BASE}${encodeURIComponent(prompt)}`;
  }

  private isGeneratedImage(image: string): boolean {
    return image.includes('/api/ide/v1/text_to_image');
  }

  private ensurePreviewRefreshTimer(): void {
    if (this.previewRefreshTimer !== null) {
      return;
    }
    this.previewRefreshTimer = setInterval(() => {
      this.previewImageRefreshNonce.set(Date.now());
    }, 3500);
  }

  private clearPreviewRefreshTimer(): void {
    if (this.previewRefreshTimer === null) {
      return;
    }
    clearInterval(this.previewRefreshTimer);
    this.previewRefreshTimer = null;
  }

  private toOptionsMap(options: VariantOptionForm[]): Record<string, string> {
    const entries = options
      .map((option) => [option.key.trim(), option.value.trim()] as const)
      .filter(([key, value]) => Boolean(key) && Boolean(value));
    return Object.fromEntries(entries);
  }

  private resolveVariantSku(form: ProductEditorForm, variant: VariantForm, index: number): string {
    const manual = this.slugToken(variant.sku);
    if (manual) {
      return manual.toUpperCase();
    }
    const base = [
      this.slugToken(form.slug),
      this.slugToken(form.name),
      this.slugToken(variant.name),
      `v${index + 1}`,
    ]
      .filter(Boolean)
      .join('-')
      .toUpperCase();
    return base || `VARIANT-${index + 1}`;
  }

  private resolveBaseSku(form: ProductEditorForm): string {
    const manual = this.slugToken(form.sku);
    if (manual) {
      return manual.toUpperCase();
    }
    const base = [this.slugToken(form.slug), this.slugToken(form.name)]
      .filter(Boolean)
      .join('-')
      .toUpperCase();
    return base || 'PRODUCT';
  }

  private slugToken(value: string | null | undefined): string {
    return (value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private optionFieldsForResolvedType(form: ProductEditorForm): string[] {
    return this.resolvePresetFields(form.productTypeCustom.trim() || form.productTypePreset);
  }

  private syncPresetFields(variants: VariantForm[], presetFields: string[]): VariantForm[] {
    return variants.map((variant) => {
      const currentPresetValues = new Map(
        variant.options.filter((option) => option.preset).map((option) => [option.key, option.value]),
      );
      const presetOptions = presetFields.map((field) =>
        createOption(field, currentPresetValues.get(field) ?? '', true),
      );
      const manualOptions = variant.options.filter((option) => !option.preset);
      return { ...variant, options: [...presetOptions, ...manualOptions] };
    });
  }

  private uploadGalleryFiles(
    files: File[],
    fallbackFactory: (offset: number) => string,
    appendUrls: (urls: string[]) => void,
    successLabel: string,
    failureLabel: string,
  ): void {
    this.uploading.set(true);
    this.formError.set(null);
    this.uploadNotice.set(null);

    const uploads = files.map((file, index) =>
      this.admin.uploadMedia(file, 'products').pipe(
        map((media) => ({ url: media.url, generated: false } satisfies UploadedGalleryItem)),
        catchError((error: unknown) =>
          of({
            url: fallbackFactory(index + 1),
            generated: true,
            message: apiErrorMessage(error, `Could not upload ${failureLabel}.`),
          } satisfies UploadedGalleryItem & { message: string }),
        ),
      ),
    );

    forkJoin(uploads).subscribe({
      next: (items) => {
        this.uploading.set(false);
        appendUrls(items.map((item) => item.url));

        const generatedCount = items.filter((item) => item.generated).length;
        const uploadedCount = items.length - generatedCount;

        if (generatedCount > 0) {
          this.uploadNotice.set(
            `${generatedCount} ${failureLabel}${generatedCount === 1 ? ' was' : ' were'} replaced with generated image URLs so you can keep editing.`,
          );
        } else {
          this.uploadNotice.set(null);
        }

        this.toast.show(
          `${uploadedCount > 0 ? uploadedCount : items.length} ${successLabel}${items.length === 1 ? '' : 's'} added.`,
        );
      },
      error: () => {
        this.uploading.set(false);
      },
    });
  }

  private findProductType(productType: string | null | undefined): AdminProductType | undefined {
    const normalized = (productType ?? '').trim().toLowerCase();
    return this.productTypeOptions().find((type) => type.slug.toLowerCase() === normalized);
  }

  private resolvePresetFields(productType: string | null | undefined): string[] {
    const managed = this.findProductType(productType);
    if (managed) {
      return [...managed.presetFields];
    }
    return findProductTypeDefinition(productType)?.optionFields ?? [];
  }

  protected labelize(value: string): string {
    return value
      .replace(/([A-Z])/g, ' $1')
      .replace(/[-_]+/g, ' ')
      .replace(/^\w/, (char) => char.toUpperCase())
      .trim();
  }
}
