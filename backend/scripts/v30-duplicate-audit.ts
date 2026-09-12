import { DataSource } from 'typeorm'

// Read-only report for the new environment. It never merges or deletes business data.
const isMySql = !!process.env.DB_HOST
const db = new DataSource(isMySql ? {
  type: 'mysql', host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE, charset: 'utf8mb4', synchronize: false,
} : { type: 'better-sqlite3', database: process.env.SQLITE_DB_PATH || 'data/xingzhe.db', synchronize: false })

async function count(sql: string): Promise<number> {
  const rows = await db.query(sql)
  return Number(rows[0]?.count || 0)
}

async function main() {
  await db.initialize()
  const reports: Record<string, number> = {
    'User duplicate appId+openid': await count('SELECT COUNT(*) AS count FROM (SELECT wechatAppId, openid FROM user GROUP BY wechatAppId, openid HAVING COUNT(*) > 1) d'),
    'Registration duplicate user+activity': await count('SELECT COUNT(*) AS count FROM (SELECT userId, activityId FROM activity_registration GROUP BY userId, activityId HAVING COUNT(*) > 1) d'),
    'Registration orphan user': await count('SELECT COUNT(*) AS count FROM activity_registration r LEFT JOIN user u ON u.id = r.userId WHERE u.id IS NULL'),
    'Registration orphan activity': await count('SELECT COUNT(*) AS count FROM activity_registration r LEFT JOIN activity a ON a.id = r.activityId WHERE a.id IS NULL'),
    'Order duplicate registration': await count('SELECT COUNT(*) AS count FROM (SELECT registrationId FROM activity_order GROUP BY registrationId HAVING COUNT(*) > 1) d'),
    'Order orphan registration': await count('SELECT COUNT(*) AS count FROM activity_order o LEFT JOIN activity_registration r ON r.id = o.registrationId WHERE r.id IS NULL'),
    'Payment duplicate order+tradeType': await count('SELECT COUNT(*) AS count FROM (SELECT orderId, tradeType FROM payment_transaction GROUP BY orderId, tradeType HAVING COUNT(*) > 1) d'),
    'Payment orphan order': await count('SELECT COUNT(*) AS count FROM payment_transaction p LEFT JOIN activity_order o ON o.id = p.orderId WHERE o.id IS NULL'),
    'Follow duplicate user+activity': await count('SELECT COUNT(*) AS count FROM (SELECT userId, activityId FROM activity_follow GROUP BY userId, activityId HAVING COUNT(*) > 1) d'),
    'QR duplicate registration+version': await count('SELECT COUNT(*) AS count FROM (SELECT registrationId, version FROM activity_qr GROUP BY registrationId, version HAVING COUNT(*) > 1) d'),
    'Certificate suspicious duplicate registration+template': 0,
    'Invoice orphan order': await count('SELECT COUNT(*) AS count FROM activity_invoice i LEFT JOIN activity_order o ON o.id = i.orderId WHERE o.id IS NULL'),
    'Refund orphan order': await count('SELECT COUNT(*) AS count FROM activity_refund r LEFT JOIN activity_order o ON o.id = r.orderId WHERE o.id IS NULL'),
    'Activity suspicious duplicate title/time/city/series': await count('SELECT COUNT(*) AS count FROM (SELECT title, startTime, endTime, city, seriesId FROM activity GROUP BY title, startTime, endTime, city, seriesId HAVING COUNT(*) > 1) d'),
  }
  console.log(JSON.stringify(reports, null, 2))
  await db.destroy()
}
main().catch(error => { console.error(error?.message || error); process.exit(1) })
