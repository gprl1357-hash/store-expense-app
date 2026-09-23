import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/** 비밀번호 일방향 해시 (bcrypt) — 서버 전용 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** 평문 비밀번호와 저장된 해시 비교 — 서버 전용 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export { validatePasswordRules, type PasswordValidation } from "./password-rules";
