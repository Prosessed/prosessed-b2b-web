# B2B E-Commerce Platform - Architecture

## Folder Structure (Feature-Based)

This project uses a feature-based directory structure for better organization, maintainability, and scalability.

### Project Layout

```
project/
├── app/                          # Next.js app directory
│   ├── (features)/              # Feature routes
│   │   ├── auth/               # Authentication feature
│   │   │   ├── login/page.tsx
│   │   │   ├── login/password/page.tsx
│   │   │   └── login/forgot-password/page.tsx
│   │   ├── products/           # Product browsing feature
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── cart/               # Shopping cart feature
│   │   │   └── page.tsx
│   │   ├── quotes/             # Order quotations feature
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── orders/             # Order history feature
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── account/            # User account feature
│   │   │   └── page.tsx
│   │   └── misc/               # Misc pages (privacy, terms, etc)
│   ├── api/                    # API routes (if needed)
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
│
├── features/                   # Feature modules (composable logic)
│   ├── auth/                   # Auth feature module
│   │   ├── api.ts              # Auth API calls
│   │   ├── hooks.ts            # Auth hooks
│   │   └── types.ts            # Auth types
│   ├── products/               # Products feature module
│   │   ├── api.ts
│   │   ├── hooks.ts
│   │   └── types.ts
│   ├── cart/                   # Cart feature module
│   │   ├── api.ts
│   │   ├── hooks.ts
│   │   ├── context.ts
│   │   └── types.ts
│   └── quotes/                 # Quotes feature module
│       ├── api.ts
│       ├── hooks.ts
│       └── types.ts
│
├── components/                 # Reusable components
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Layout components
│   │   ├── navigation.tsx
│   │   ├── footer.tsx
│   │   └── sidebar.tsx
│   └── feature-components/     # Feature-specific components
│       ├── auth/
│       ├── products/
│       └── cart/
│
├── lib/                        # Shared utilities and services
│   ├── api/                    # API client & hooks
│   │   ├── client.ts
│   │   ├── hooks.ts
│   │   └── endpoints.ts
│   ├── auth/                   # Auth utilities
│   │   ├── context.tsx
│   │   ├── actions.ts
│   │   ├── storage.ts
│   │   └── types.ts
│   ├── cart/                   # Cart utilities
│   │   ├── context.tsx
│   │   ├── drawer-context.tsx
│   │   └── types.ts
│   └── utils/                  # General utilities
│       └── ...
│
├── hooks/                      # Custom React hooks
│   ├── use-debounce.ts
│   ├── use-item-group-tree.ts
│   └── use-mobile.ts
│
└── public/                     # Static assets

```

## Feature Module Guidelines

Each feature module should follow this pattern:

### 1. **Feature Directory Structure**
```
features/
└── feature-name/
    ├── api.ts           # API calls specific to feature
    ├── hooks.ts         # React hooks for feature
    ├── types.ts         # TypeScript types/interfaces
    ├── constants.ts     # Feature constants
    ├── utils.ts         # Feature utilities
    └── index.ts         # Re-exports (optional)
```

### 2. **Component Organization**
- Feature-specific components in `components/feature-components/[feature-name]/`
- Reusable UI components in `components/ui/`
- Layout components in `components/layout/`

### 3. **API Structure**
- Centralized in `lib/api/` for cross-cutting concerns
- Feature-specific API logic in `features/[feature]/api.ts`
- Authentication handled in `lib/auth/`

### 4. **State Management**
- Use React Context for feature-level state (e.g., CartContext, AuthContext)
- Use SWR for data fetching and caching
- Keep state close to where it's used

### 5. **Types & Interfaces**
- Define types in `features/[feature]/types.ts`
- Common types in `lib/auth/types.ts`, `lib/api/types.ts`
- Keep types colocated with their usage

## Current Features

### 🔐 Auth (Authentication)
- **Location**: `app/(features)/auth/`, `lib/auth/`, `features/auth/`
- **Key Files**: `login/page.tsx`, `forgot-password/page.tsx`, `lib/auth/context.tsx`
- **Responsibilities**: User login, OTP verification, password reset, session management

### 🛍️ Products (Product Browsing)
- **Location**: `app/(features)/products/`, `features/products/`
- **Key Files**: `page.tsx`, `[id]/page.tsx`, `components/product-card.tsx`
- **Responsibilities**: Product listing, filtering, search, product details

### 🛒 Cart (Shopping Cart)
- **Location**: `app/(features)/cart/`, `lib/cart/`, `features/cart/`
- **Key Files**: `page.tsx`, `lib/cart/context.tsx`, `components/cart-drawer.tsx`
- **Responsibilities**: Cart management, item quantity updates, cart synchronization

### 📋 Quotes (Order Quotations)
- **Location**: `app/(features)/quotes/`, `features/quotes/`
- **Key Files**: `page.tsx`, `[id]/page.tsx`
- **Responsibilities**: Quotation listing, submission, tracking

### 📦 Orders (Order History)
- **Location**: `app/(features)/orders/`, `features/orders/`
- **Key Files**: `page.tsx`, `[id]/page.tsx`
- **Responsibilities**: Order history, order details, reordering

### 👤 Account (User Account)
- **Location**: `app/(features)/account/`, `features/account/`
- **Key Files**: `page.tsx`
- **Responsibilities**: Profile management, settings, preferences

## Best Practices

### 1. **Imports**
- Use path aliases: `@/components`, `@/lib`, `@/hooks`, `@/features`
- Avoid relative imports for components from other features

### 2. **Component Composition**
```typescript
// ✅ Good: Break down into smaller components
<ProductList>
  <ProductCard />
  <ProductFilters />
  <ProductPagination />
</ProductList>

// ❌ Avoid: Large monolithic components
<ProductPage />  // Everything in one file
```

### 3. **API Calls**
```typescript
// ✅ Good: Centralized API in features/[feature]/api.ts
export async function getProducts(filters) { ... }

// ✅ Also good: Use hooks for React integration
export function useProducts(filters) {
  return useSWR(['products', filters], () => getProducts(filters))
}

// ❌ Avoid: API calls in components
const MyComponent = () => {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/api/products').then(...)
  }, [])
}
```

### 4. **Context & State**
```typescript
// ✅ Good: Feature-level context for shared state
<CartProvider>
  <CartDrawer />
  <ProductList />
</CartProvider>

// ❌ Avoid: Deep prop drilling
<App cart={cart} setCart={setCart} ...>
  <Feature cart={cart} setCart={setCart} ...>
    <Component cart={cart} setCart={setCart} />
  </Feature>
</App>
```

### 5. **Type Safety**
```typescript
// ✅ Good: Define types in feature modules
// features/products/types.ts
export interface Product { ... }
export interface ProductFilters { ... }

// ✅ Import and use
import type { Product } from '@/features/products'
```

## Dependency Graph

```
Components → Hooks → API → Features → Types
  ↓
App Layout → Navigation/Footer
```

- Components depend on Hooks and Types
- Hooks depend on Features (API, Context) and Types
- Features depend on Types and API Client
- API Client is feature-agnostic

## Naming Conventions

- **Folders**: kebab-case (e.g., `feature-name`)
- **Files**: kebab-case for utilities, PascalCase for components
- **Components**: PascalCase (e.g., `ProductCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useProducts.ts`)
- **Types**: PascalCase interfaces (e.g., `Product`, `ProductFilter`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `API_TIMEOUT`)

## Migration Guide (if restructuring existing code)

To move existing components to this structure:

1. Identify which feature the component belongs to
2. Create feature folder structure if not exists
3. Move component to `components/feature-components/[feature]/`
4. Move API logic to `features/[feature]/api.ts`
5. Move hooks to `features/[feature]/hooks.ts`
6. Move types to `features/[feature]/types.ts`
7. Update all imports to use path aliases
8. Test thoroughly before committing

## Performance Considerations

- Use React.memo for expensive components
- Split large pages into route segments
- Lazy load feature-specific components
- Cache API responses with SWR
- Use streaming for Server Components when possible

## Testing Strategy

By feature module:
- Unit tests for utils and types in `__tests__/`
- Component tests for feature components
- Integration tests for features
- E2E tests for critical user flows
