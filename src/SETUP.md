# Redux setup (already wired)

## Files added / changed

```
src/
  api/                              ← Redux store + axios + slices
    config.ts
    services.ts
    types.ts
    slices.ts
    store.ts
    hooks.ts
    index.ts
    slices/
      authSlice.ts
      usersSlice.ts

  components/providers/
    redux-provider.tsx              ← <Provider store={store}>

  app/[lang]/layout.tsx             ← wrapped with <ReduxProvider>
```

## Install

```bash
npm install @reduxjs/toolkit react-redux axios
```

## Env

In `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5009
```

## Use in any client component

```tsx
"use client";

import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { login, logout } from "@/api/slices";

export default function Example() {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((s) => s.auth);

  const onLogin = async () => {
    await dispatch(login({ email: "a@b.com", password: "Pass1234" })).unwrap();
  };

  return (
    <button onClick={onLogin} disabled={loading}>
      {user ? `Hi ${user.firstName}` : "Login"}
    </button>
  );
}
```
