export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Heslo je povinné'
  if (password.length < 8) return 'Heslo musí mít alespoň 8 znaků'
  if (password.length > 128) return 'Heslo je příliš dlouhé'
  return null
}

export function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}
