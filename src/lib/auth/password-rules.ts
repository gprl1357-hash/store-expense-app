export type PasswordValidation = { valid: true } | { valid: false; reason: string };

/** 8자 이상 + 영문/숫자/특수문자 중 2종류 이상 포함 (클라이언트/서버 공통) */
export function validatePasswordRules(password: string): PasswordValidation {
  if (password.length < 8) {
    return { valid: false, reason: "비밀번호는 8자 이상이어야 합니다." };
  }
  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const classCount = [hasLetter, hasDigit, hasSpecial].filter(Boolean).length;

  if (classCount < 2) {
    return {
      valid: false,
      reason: "영문, 숫자, 특수문자 중 2종류 이상을 포함해야 합니다.",
    };
  }
  return { valid: true };
}
