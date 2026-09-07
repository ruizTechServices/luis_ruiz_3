export function readAuthCredentials(formData: FormData): { email: string; password: string } {
  const email = formData.get("email");
  const password = formData.get("password");

  return {
    email: typeof email === "string" ? email.trim() : "",
    // Whitespace and Unicode are part of the credential. Never normalize it.
    password: typeof password === "string" ? password : "",
  };
}
