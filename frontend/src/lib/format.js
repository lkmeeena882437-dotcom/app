// Utility helpers — currency formatting, etc.

export const formatINR = (n) => {
  if (n == null) return "—";
  return "₹" + Math.round(n).toLocaleString("en-IN");
};
