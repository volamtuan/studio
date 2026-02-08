
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
 * Gets an approximate address from an IP address using ip-api.com.
 * @param ip - The public IP address of the user.
 * @returns An object containing the address string and optional coordinates.
 */
export async function getAddressFromIp(ip: string): Promise<{ address: string; lat?: number; lon?: number }> {
    // Do not geolocate private or local IPs
    if (ip === 'N/A' || ip === '127.0.0.1' || ip.startsWith('::1')) {
        return { address: "(Vị trí bị từ chối, không có IP công khai)" };
    }

    try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon`);
        
        if (!response.ok) {
            return { address: `(Không thể tra cứu IP: ${response.statusText})` };
        }

        const data = await response.json();

        if (data.status !== 'success') {
             return { address: `(Không thể tra cứu IP: ${data.message || 'Lỗi không xác định'})` };
        }

        const addressParts = [data.city, data.regionName, data.country].filter(Boolean);
        const displayAddress = addressParts.length > 0 ? addressParts.join(', ') : "(Vị trí gần đúng từ IP)";
        
        return {
            address: displayAddress,
            lat: data.lat,
            lon: data.lon,
        };

    } catch (error) {
        console.error("Error fetching address from IP API:", error);
        return { address: "(Lỗi khi tra cứu địa chỉ IP)" };
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
