import CryptoJS from 'crypto-js'

export function sha256(data: string): string {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex)
}

export function generateSessionHash(
  content: string,
  events: object[],
  startTime: number
): string {
  return sha256(JSON.stringify({ content, events, startTime }))
}
