import sql from '../../../utils/sql';

export async function GET(request) {
  try {
    const userId = 1; // Demo user

    const settings = await sql`
      SELECT * FROM user_settings
      WHERE user_id = ${userId}
    `;

    if (settings.length === 0) {
      return Response.json({ error: 'Settings not found' }, { status: 404 });
    }

    return Response.json({ settings: settings[0] });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return Response.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = 1; // Demo user
    const body = await request.json();

    const {
      killSwitchEnabled,
      notificationsEnabled,
      notificationChannels,
      maxDailyTrades,
      maxPositionSize,
      autoTradingEnabled,
      preferredPairs,
      tradingHours
    } = body;

    await sql`
      UPDATE user_settings
      SET 
        kill_switch_enabled = COALESCE(${killSwitchEnabled}, kill_switch_enabled),
        notifications_enabled = COALESCE(${notificationsEnabled}, notifications_enabled),
        notification_channels = COALESCE(${notificationChannels ? JSON.stringify(notificationChannels) : null}, notification_channels),
        max_daily_trades = COALESCE(${maxDailyTrades}, max_daily_trades),
        max_position_size = COALESCE(${maxPositionSize}, max_position_size),
        auto_trading_enabled = COALESCE(${autoTradingEnabled}, auto_trading_enabled),
        preferred_pairs = COALESCE(${preferredPairs}, preferred_pairs),
        trading_hours = COALESCE(${tradingHours ? JSON.stringify(tradingHours) : null}, trading_hours),
        updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    const updated = await sql`
      SELECT * FROM user_settings WHERE user_id = ${userId}
    `;

    return Response.json({ settings: updated[0] });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return Response.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
