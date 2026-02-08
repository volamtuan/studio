
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAddressFromIp } from '@/lib/server-utils';

/**
 * API endpoint to get estimated geolocation data based on the request's IP address.
 * This does not require client-side permissions.
 * @returns JSON response with IP, estimated_address, and coordinates.
 */
export async function GET(request: Request) {
  try {
    const headersList = headers();
    
    // Extract client IP address from headers, handling common proxy headers.
    const clientIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'N/A';
    
    // Clean up IPv6-mapped IPv4 addresses
    const finalIp = clientIp.startsWith('::ffff:') ? clientIp.substring(7) : clientIp;

    // Do not process if IP is not identifiable as a public IP
    if (finalIp === 'N/A' || finalIp === '127.0.0.1' || finalIp.startsWith('::1')) {
        return NextResponse.json({ 
            error: "Không thể xác định địa chỉ IP công khai của người dùng.",
            ip: finalIp 
        }, { status: 400 });
    }

    // Get estimated location from the determined IP address
    const { address, lat, lon } = await getAddressFromIp(finalIp);
    
    const responsePayload = {
      ip: finalIp,
      estimated_address: address,
      coordinates: (lat && lon) ? { lat, lon } : 'N/A'
    };
    
    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('Failed to process /api/geoip request:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process request on server', details: errorMessage }, { status: 500 });
  }
}
