import sql from '../utils/sql';

export async function GET(request) {
  try {
    const userId = 1; // Demo user

    const notifications = await sql`
      SELECT * FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return Response.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return Response.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const userId = 1; // Demo user
    const { notificationId, markAllRead } = await request.json();

    if (markAllRead) {
      await sql`
        UPDATE notifications
        SET is_read = true
        WHERE user_id = ${userId}
      `;
    } else if (notificationId) {
      await sql`
        UPDATE notifications
        SET is_read = true
        WHERE id = ${notificationId} AND user_id = ${userId}
      `;
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return Response.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
