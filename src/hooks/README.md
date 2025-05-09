# Hook System Documentation

This document describes the hook system architecture and patterns used in the application.

## API Hooks Architecture

Our API hooks follow a layered architecture:

1. **Base Hooks Layer** (`use-api.ts`): Provides the core API interaction with React Query
2. **Domain-Specific Hooks** (`use-[domain].ts`): Implement domain-specific data fetching and mutation

## Base Hooks (use-api.ts)

The `use-api.ts` file provides two primary hooks:

### `useApiQuery`

Used for GET operations to fetch data:

```typescript
const { data, isLoading, error } = useApiQuery<ResponseType>(
  ['queryKey', 'params'], // Query key for caching
  '/api/endpoint',        // API endpoint
  { enabled: boolean }    // Optional settings
);
```

### `useApiMutation`

Used for POST/PUT/DELETE operations:

```typescript
const mutation = useApiMutation<ResponseType, InputType>(
  '/api/endpoint',       // Static endpoint 
  'POST',                // HTTP method
  {
    invalidateQueries: [['queryKey1'], ['queryKey2']],  // Queries to invalidate on success
    onSuccessMessage: 'Operation completed successfully', // Toast message on success
    onErrorMessage: 'Operation failed'                   // Toast message on error
  }
);

// Or with dynamic URL:
const mutation = useApiMutation<ResponseType, InputType>(
  (data) => `/api/endpoint/${data.id}`, // Dynamic URL function
  'PUT',
  { /* options */ }
);

// Using the mutation:
mutation.mutate(dataObject);
```

## Domain-Specific Hooks

Domain hooks follow this pattern:

```typescript
// List operation
export function useList[Domain](filters?) {
  return useApiQuery(['domain', ...filterParams], '/api/domain?params');
}

// Get single item
export function use[Domain](id: string) {
  return useApiQuery(['domain', id], `/api/domain/${id}`);
}

// Create operation
export function useCreate[Domain]() {
  return useApiMutation('/api/domain', 'POST', options);
}

// Update operation
export function useUpdate[Domain]() {
  return useApiMutation((data) => `/api/domain/${data.id}`, 'PUT', options);
}

// Delete operation
export function useDelete[Domain]() {
  return useApiMutation((id) => `/api/domain/${id}`, 'DELETE', options);
}
```

## Best Practices

1. Always use typed parameters and responses
2. Use the domain hook pattern consistently
3. Properly invalidate queries when mutations succeed
4. Provide meaningful success and error messages
5. Handle loading and error states in the UI components

## Migration Guide

When converting existing hooks to use the base API hooks:

1. Replace direct React Query imports with imports from `use-api.ts`
2. Convert `useQuery` calls to `useApiQuery`
3. Convert `useMutation` calls to `useApiMutation`
4. Remove custom fetch functions and use the base API hooks instead
5. Update toast handling to use the integrated toast support 