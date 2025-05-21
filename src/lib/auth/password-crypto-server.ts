/**
 * Server-side password hashing utility
 * Uses Node.js crypto for secure hashing
 */

import crypto from "crypto";

/**
 * Hashes a password using SHA-256 on server-side
 *
 * @param password The user's plain text password
 * @returns A Promise that resolves to the hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  // Create a SHA-256 hash
  const hash = crypto.createHash("sha256");

  // Update the hash with the password
  hash.update(password);

  // Get the hash as a hex string
  return hash.digest("hex");
}

/**
 * Salt and hash a password with SHA-256 algorithm
 * This replicates the client-side implementation in password-crypto.ts
 *
 * @param password The plaintext password
 * @param email The user's email used as part of the salt
 * @returns The hashed password
 */
export async function saltAndHashPassword(
  password: string,
  email: string
): Promise<string> {
  // Normalize email to lowercase
  const normalizedEmail = email.toLowerCase();

  // Combine password with email using the SAME format as client-side
  // Using ${password}:${email} format - MUST match client implementation
  const saltedPassword = `${password}:${normalizedEmail}`;

  // Hash the combined string with SHA-256
  const hashedPassword = crypto
    .createHash("sha256")
    .update(saltedPassword)
    .digest("hex");

  return hashedPassword;
}
