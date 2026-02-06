
import { getVerificationConfigAction } from "@/app/actions/settings";

/**
 * Uses the Nominatim API to reverse geocode latitude and longitude into a human-readable address.
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns A string containing the address or an error message.
 */
export async function getAddress(lat: number, lon: number): Promise<string> {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
          headers: {
            // Nominatim requires a user-agent header
            'User-Agent': 'FirebaseStudioLinkTracker/1.0'
          }
        });
        if (!response.ok) return "Không thể lấy địa chỉ.";

        const data = await response.json();
        return data.display_name || "Không tìm thấy tên địa chỉ.";
    } catch (error) {
        console.error("Error fetching address from Nominatim:", error);
        return "Lỗi khi truy vấn địa chỉ.";
    }
}

/**
 * Sends a notification message to a Telegram chat via a bot.
 * It fetches the bot token and chat ID from the application's settings.
 * The request is fire-and-forget.
 * @param message - The message string to send. Supports Markdown.
 */
export async function sendTelegramNotification(message: string) {
    try {
        const config = await getVerificationConfigAction();
        if (
            !config.telegramNotificationsEnabled ||
            !config.telegramBotToken ||
            !config.telegramChatId
        ) {
            return; // Exit if notifications are disabled or config is missing
        }

        const botToken = config.telegramBotToken;
        const chatId = config.telegramChatId;
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        // No await here to avoid blocking the main response
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true,
            }),
        });
    } catch (error) {
        console.error('Failed to send Telegram notification:', error);
    }
}
