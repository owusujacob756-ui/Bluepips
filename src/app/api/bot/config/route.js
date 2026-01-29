import sql from '../../utils/sql';

export async function GET() {
  try {
    const userId = 1; // Demo user
    const cfg = await sql`SELECT * FROM user_settings WHERE user_id = ${userId}`;
    if (!cfg || !cfg[0]) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ config: cfg[0] });
  } catch (error) {
    console.error('Error fetching bot config:', error);
    return Response.json({ error: 'Failed to fetch bot config' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = 1; // Demo user
    const body = await request.json();

    // Map incoming fields to user_settings columns
    await sql`
      UPDATE user_settings
      SET
        kill_switch_enabled = COALESCE(${body.killSwitchEnabled}, kill_switch_enabled),
        notifications_enabled = COALESCE(${body.notificationsEnabled}, notifications_enabled),
        notification_channels = COALESCE(${body.notificationChannels ? JSON.stringify(body.notificationChannels) : null}, notification_channels),
        max_daily_trades = COALESCE(${body.maxDailyTrades}, max_daily_trades),
        max_position_size = COALESCE(${body.maxPositionSize}, max_position_size),
        auto_trading_enabled = COALESCE(${body.autoTradingEnabled}, auto_trading_enabled),
        preferred_pairs = COALESCE(${body.preferredPairs}, preferred_pairs),
        trading_hours = COALESCE(${body.tradingHours ? JSON.stringify(body.tradingHours) : null}, trading_hours),
        updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    const updated = await sql`SELECT * FROM user_settings WHERE user_id = ${userId}`;
    return Response.json({ config: updated[0] });
  } catch (error) {
    console.error('Error updating bot config:', error);
    return Response.json({ error: 'Failed to update bot config' }, { status: 500 });
  }
}
