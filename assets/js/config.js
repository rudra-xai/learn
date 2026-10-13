// Database connection. The URL and key are Supabase's *publishable* values:
// they are designed to be public. All data access goes through the rx_*
// functions, which check every request. Leave url empty to run the portal in
// view-only mode (no tests, no profile).
window.RX_API = {
  url: "",
  key: ""
};
