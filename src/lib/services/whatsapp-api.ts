/**
 * Placeholder Service: Official WhatsApp Business API
 * Extension point for automated messaging via Meta WhatsApp Business Cloud API.
 */

export interface WhatsAppMessagePayload {
  toPhone: string;
  templateName: string;
  languageCode: string;
  parameters: Record<string, string>;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendWhatsAppNotification(payload: WhatsAppMessagePayload): Promise<WhatsAppSendResult> {
  // Extension point: Integrate when WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are configured
  const apiKey = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!apiKey) {
    console.info('[WhatsApp API Placeholder] API key not configured. Message simulated:', payload);
    return {
      success: true,
      messageId: `simulated-wa-${Date.now()}`,
    };
  }

  // TODO: Implement Meta Graph API POST request
  return {
    success: true,
    messageId: `wa-${Date.now()}`,
  };
}
