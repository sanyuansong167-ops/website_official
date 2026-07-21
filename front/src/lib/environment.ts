function getPublicApiBaseUrl(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is required before API requests can be made.`);
  }

  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${name} must be a valid absolute URL.`);
  }
}

export function getPortalApiBaseUrl() {
  return getPublicApiBaseUrl(
    "NEXT_PUBLIC_PORTAL_API_BASE_URL",
    process.env.NEXT_PUBLIC_PORTAL_API_BASE_URL,
  );
}

export function getAdminApiBaseUrl() {
  return getPublicApiBaseUrl(
    "NEXT_PUBLIC_ADMIN_API_BASE_URL",
    process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL,
  );
}
