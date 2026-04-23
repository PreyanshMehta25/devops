import React from "react";

export const useUser = () => ({ isSignedIn: false, user: null });
export const useClerk = () => ({ signOut: jest.fn() });

export const SignedIn = ({ children }: { children: React.ReactNode }) =>
  children;
export const SignedOut = ({ children }: { children: React.ReactNode }) =>
  children;
export const ClerkLoaded = ({ children }: { children: React.ReactNode }) =>
  children;
export const ClerkLoading = () => null;
export const SignInButton = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
