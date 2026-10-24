# Redux API layer for MedBrainers

Drop the `api/` folder into your Next.js `src/`:

```
src/
  api/
    config.ts          ← BASE_URL
    services.ts        ← axios instance + token refresh
    types.ts           ← shared types
    slices.ts          ← root reducer + re-exports
    store.ts           ← configureStore
    hooks.ts           ← useAppDispatch / useAppSelector
    index.ts
    slices/
      authSlice.ts     ← login, signup, OTP, reset password
      usersSlice.ts    ← /users/me, list, admin update
```

## Install peers

```bash
npm install @reduxjs/toolkit react-redux axios
```

## Env

```env
NEXT_PUBLIC_API_URL=http://localhost:5009
```

## Wire the store (Next.js App Router)

```tsx
// src/components/providers/redux-provider.tsx
"use client";
import { Provider } from "react-redux";
import { store } from "@/api/store";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
```

Wrap your root layout with `<ReduxProvider>`.

## Usage examples

### Login
```tsx
const dispatch = useAppDispatch();
await dispatch(login({ email, password })).unwrap();
```

### Signup flow
```tsx
// 1. send OTP
await dispatch(verifyEmail({ email, firstName })).unwrap();

// 2. create account
await dispatch(signup({
  email, otp, password, firstName, lastName,
  countryCode: "+234", phone,
})).unwrap();
```

### Forgot password
```tsx
await dispatch(forgotPassword({ email })).unwrap();
await dispatch(verifyResetOtp({ email, otp })).unwrap();
// resetToken is in state.auth.resetToken
await dispatch(resetPassword({ resetToken, newPassword })).unwrap();
```

### Profile
```tsx
await dispatch(fetchMe()).unwrap();
await dispatch(updateMe({ firstName: "Ada" })).unwrap();
await dispatch(uploadProfilePicture(file)).unwrap();
```
