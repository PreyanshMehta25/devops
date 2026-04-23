import "@testing-library/jest-dom";

// Provide Vite-style env values for components that read import.meta.env.
globalThis.importMeta = {
  env: {
    VITE_CLERK_PUBLISHABLE_KEY: "test",
    VITE_RAZORPAY_KEY_ID: "test",
    VITE_RAZORPAY_ACCOUNT_NAME: "StackIt",
    VITE_RAZORPAY_DEFAULT_UPI: "test@upi",
    VITE_RAZORPAY_CURRENCY: "INR",
    VITE_RAZORPAY_DESCRIPTION: "Order contribution!!",
    VITE_API_BASE_URL: "http://localhost:5001",
  },
};

const originalWarn = console.warn;

console.warn = (...args) => {
  const message = String(args[0] || "");
  if (message.includes("React Router Future Flag Warning")) {
    return;
  }
  originalWarn(...args);
};
