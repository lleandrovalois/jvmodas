import { processMercadoPagoWebhook } from "@/app/api/webhooks/mercadopago/route";

export async function POST(req: Request) {
  return processMercadoPagoWebhook(req);
}

export async function GET(req: Request) {
  return processMercadoPagoWebhook(req);
}
