import QRCode from "qrcode";

/**
 * Calculates CRC16 CCITT for standard Brazilian Pix EMVCo payload
 */
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function emvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

export interface PixPayloadParams {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txId: string;
}

/**
 * Generates standard Brazilian Central Bank Pix Copia e Cola payload
 */
export function generatePixCopiaECola({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txId,
}: PixPayloadParams): string {
  // Normalize strings
  const cleanName = merchantName.substring(0, 25).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const cleanCity = merchantCity.substring(0, 15).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const cleanTxId = txId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 25) || "***";
  const amountStr = amount.toFixed(2);

  const guiField = emvField("00", "br.gov.bcb.pix");
  const keyField = emvField("01", pixKey);
  const merchantAccountInfo = emvField("26", `${guiField}${keyField}`);

  const payloadWithoutCrc =
    emvField("00", "01") + // Payload Format Indicator
    merchantAccountInfo +
    emvField("52", "0000") + // Merchant Category Code
    emvField("53", "986") + // Transaction Currency (BRL)
    emvField("54", amountStr) + // Amount
    emvField("58", "BR") + // Country
    emvField("59", cleanName) + // Merchant Name
    emvField("60", cleanCity) + // Merchant City
    emvField("62", emvField("05", cleanTxId)) + // Additional Data (TxID)
    "6304"; // CRC placeholder

  const calculatedCrc = crc16(payloadWithoutCrc);
  return `${payloadWithoutCrc}${calculatedCrc}`;
}

/**
 * Generates both the Pix Copia e Cola string and the QR Code Data URL image
 */
export async function createPixPayment({
  amount,
  txId,
  pixKey = "financeiro@jvmodas.com.br",
  merchantName = "JVMODAS FITNESS",
  merchantCity = "SAO PAULO",
}: {
  amount: number;
  txId: string;
  pixKey?: string;
  merchantName?: string;
  merchantCity?: string;
}) {
  const copiaECola = generatePixCopiaECola({
    pixKey,
    merchantName,
    merchantCity,
    amount,
    txId,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(copiaECola, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  return {
    copiaECola,
    qrCodeDataUrl,
  };
}
