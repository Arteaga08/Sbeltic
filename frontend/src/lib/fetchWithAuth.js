export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("sbeltic_token");
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem("sbeltic_token");
    localStorage.removeItem("sbeltic_user");
    window.location.replace("/login");
    return res;
  }
  return res;
}
