import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

const accessToken =
  process.env.MERCADO_PAGO_ACCESS_TOKEN ||
  process.env.MERCADOPAGO_ACCESS_TOKEN ||
  "APP_USR-8216607742863449-102711-07d502be43e1b94e92653d0da3aa3e86-3797792276";

export const mpClient = new MercadoPagoConfig({
  accessToken,
  options: { timeout: 10000 },
});

export const mpPayment = new Payment(mpClient);
export const mpPreference = new Preference(mpClient);

interface CreatePixParams {
  transactionAmount: number;
  description: string;
  orderId: string;
  payer: {
    email: string;
    firstName: string;
    lastName: string;
    cpf: string;
  };
  notificationUrl?: string;
}

export async function createMercadoPagoPix({
  transactionAmount,
  description,
  orderId,
  payer,
  notificationUrl,
}: CreatePixParams) {
  try {
    const cleanCpf = payer.cpf.replace(/\D/g, "");
    const res = await mpPayment.create({
      body: {
        transaction_amount: Number(transactionAmount.toFixed(2)),
        description: description.slice(0, 200),
        payment_method_id: "pix",
        external_reference: orderId,
        notification_url: notificationUrl,
        payer: {
          email: payer.email,
          first_name: payer.firstName,
          last_name: payer.lastName || "Cliente",
          identification: {
            type: "CPF",
            number: cleanCpf || "19119119100",
          },
        },
      },
    });

    const qrCode = res.point_of_interaction?.transaction_data?.qr_code || null;
    const qrCodeBase64 = res.point_of_interaction?.transaction_data?.qr_code_base64 || null;

    return {
      success: true,
      paymentId: res.id,
      status: res.status,
      qrCode,
      qrCodeBase64: qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : null,
    };
  } catch (error: any) {
    console.error("Mercado Pago Pix Error:", error?.message || error);
    return {
      success: false,
      error: error?.message || "Falha ao gerar Pix no Mercado Pago",
    };
  }
}

interface CreatePreferenceParams {
  orderId: string;
  items: Array<{
    id: string;
    title: string;
    unitPrice: number;
    quantity: number;
    pictureUrl?: string;
  }>;
  payer: {
    name: string;
    email: string;
  };
  shippingPrice?: number;
  backUrls?: {
    success: string;
    failure: string;
    pending: string;
  };
}

export async function createMercadoPagoPreference({
  orderId,
  items,
  payer,
  shippingPrice = 0,
  backUrls,
}: CreatePreferenceParams) {
  try {
    const preferenceItems = items.map((item) => ({
      id: item.id,
      title: item.title,
      unit_price: Number(item.unitPrice.toFixed(2)),
      quantity: item.quantity,
      picture_url: item.pictureUrl,
      currency_id: "BRL",
    }));

    if (shippingPrice > 0) {
      preferenceItems.push({
        id: "shipping",
        title: "Frete",
        unit_price: Number(shippingPrice.toFixed(2)),
        quantity: 1,
        picture_url: undefined,
        currency_id: "BRL",
      });
    }

    const res = await mpPreference.create({
      body: {
        external_reference: orderId,
        items: preferenceItems,
        payer: {
          name: payer.name,
          email: payer.email,
        },
        back_urls: backUrls,
      },
    });

    return {
      success: true,
      preferenceId: res.id,
      initPoint: res.init_point,
      sandboxInitPoint: res.sandbox_init_point,
    };
  } catch (error: any) {
    console.error("Mercado Pago Preference Error:", error?.message || error);
    return {
      success: false,
      error: error?.message || "Falha ao gerar Preferência do Mercado Pago",
    };
  }
}
