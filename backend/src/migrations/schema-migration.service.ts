import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'

type MigrationFile = {
  version: string
  name: string
  file: string
  sql: string
}

@Injectable()
export class SchemaMigrationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SchemaMigrationService.name)

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    await this.ensureLedger()
    await this.baselineOrApply()
  }

  private get dialect() {
    return this.dataSource.options.type === 'mysql' ? 'mysql' : 'sqlite'
  }

  private get migrationsDir() {
    return join(process.cwd(), 'migrations')
  }

  private async ensureLedger() {
    if (this.dialect === 'mysql') {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version varchar(80) NOT NULL,
          name varchar(200) NOT NULL,
          appliedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (version)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `)
      return
    }

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version varchar(80) PRIMARY KEY NOT NULL,
        name varchar(200) NOT NULL,
        appliedAt datetime NOT NULL DEFAULT (datetime('now'))
      )
    `)
  }

  private async baselineOrApply() {
    const files = this.loadMigrationFiles()
    const hasCoreSchema = await this.hasTable('activity')

    if (!hasCoreSchema) {
      if (this.dialect === 'sqlite') {
        await this.applySqlFile('v2.9h-baseline.sqlite.sql')
        await this.recordMigration({ version: 'v2.9h-baseline', name: 'v2.9h-baseline', file: 'v2.9h-baseline.sqlite.sql', sql: '' })
      } else {
        this.logger.warn('No core schema detected; baseline migrations are skipped until the base schema exists')
        return
      }
    }

    if (files.length === 0) return

    const applied = await this.getAppliedVersions()

    for (const migration of files) {
      if (applied.has(migration.version)) continue

      if (await this.isMigrationAlreadyRepresented(migration.version)) {
        await this.recordMigration(migration)
        continue
      }

      if (this.canApplyIncrementally(migration.version)) {
        await this.applySqlMigration(migration)
        continue
      }

      this.logger.warn(`Migration ${migration.file} is not represented in schema and is not auto-applied`)
    }
  }

  private loadMigrationFiles(): MigrationFile[] {
    if (!existsSync(this.migrationsDir)) return []

    return readdirSync(this.migrationsDir)
      .filter(file => file.endsWith(`.${this.dialect}.sql`))
      .filter(file => !file.includes('.rollback.'))
      .filter(file => !file.includes('baseline'))
      .sort()
      .map(file => {
        const version = file.replace(`.${this.dialect}.sql`, '')
        return {
          version,
          name: version,
          file,
          sql: readFileSync(join(this.migrationsDir, file), 'utf-8'),
        }
      })
  }

  private async getAppliedVersions(): Promise<Set<string>> {
    const rows = await this.dataSource.query('SELECT version FROM schema_migrations')
    return new Set(rows.map((row: any) => row.version))
  }

  private async recordMigration(migration: MigrationFile) {
    if (this.dialect === 'mysql') {
      await this.dataSource.query(
        'INSERT IGNORE INTO schema_migrations (version, name) VALUES (?, ?)',
        [migration.version, migration.name],
      )
      return
    }

    await this.dataSource.query(
      'INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (?, ?)',
      [migration.version, migration.name],
    )
  }

  private async applySqlMigration(migration: MigrationFile) {
    const statements = this.splitSql(migration.sql)
    await this.dataSource.transaction(async manager => {
      for (const statement of statements) {
        await manager.query(statement)
      }
      if (this.dialect === 'mysql') {
        await manager.query('INSERT IGNORE INTO schema_migrations (version, name) VALUES (?, ?)', [migration.version, migration.name])
      } else {
        await manager.query('INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (?, ?)', [migration.version, migration.name])
      }
    })
  }

  private async applySqlFile(file: string) {
    const sql = readFileSync(join(this.migrationsDir, file), 'utf-8')
    for (const statement of this.splitSql(sql)) {
      await this.dataSource.query(statement)
    }
  }

  private splitSql(sql: string): string[] {
    return sql
      .split(/\r?\n/)
      .filter(line => {
        const trimmed = line.trim()
        return trimmed && !trimmed.startsWith('--') && !/^PRAGMA\b/i.test(trimmed) && !/^BEGIN\b/i.test(trimmed) && !/^COMMIT\b/i.test(trimmed)
      })
      .join('\n')
      .split(';')
      .map(statement => statement.trim())
      .filter(Boolean)
  }

  private canApplyIncrementally(version: string): boolean {
    return ['v2.8.4b-checkin-core', 'v2.9f-operation-banner', 'v2.9g-activity-series', 'v2.9i-registration-unique', 'v2.9j-payment-transaction-idempotency', 'v2.9k-activity-follow', 'v3.0a-user-identity', 'v3.0b-activity-series-visibility', 'v3.0c-admin-users', 'v3.0d-issued-certificates', 'v3.0e-certificate-share-images', 'v3.0f-issued-certificate-freeze', 'v3.0g-registration-profile-expansion'].includes(version)
  }

  private async isMigrationAlreadyRepresented(version: string): Promise<boolean> {
    switch (version) {
      case 'v2.8.4b-checkin-core':
        return this.hasColumn('activity_qr', 'stage')
      case 'v2.9b-1-payment-core':
        return (await this.hasTable('payment_transaction')) && (await this.hasTable('refund_transaction'))
      case 'v2.9c-d-activity-category-crm':
        return (await this.hasTable('activity_category')) && (await this.hasColumn('activity', 'categoryId'))
      case 'v2.9f-operation-banner':
        return this.hasTable('operation_banner')
      case 'v2.9g-activity-series':
        return (await this.hasTable('activity_series')) && (await this.hasColumn('activity', 'seriesId'))
      case 'v2.9i-registration-unique':
        return this.hasIndex('activity_registration', 'uniq_activity_registration_user_activity')
      case 'v2.9j-payment-transaction-idempotency':
        return this.hasIndex('payment_transaction', 'uniq_payment_transaction_order_trade_type')
      case 'v2.9k-activity-follow':
        return (await this.hasTable('activity_follow')) && (await this.hasColumn('activity_series', 'externalUrl'))
      case 'v3.0a-user-identity':
        return (await this.hasColumn('user', 'wechatAppId')) && (await this.hasIndex('user', 'uq_user_wechat_app_openid'))
      case 'v3.0b-activity-series-visibility':
        return this.hasColumn('activity_series', 'showActivities')
      case 'v3.0c-admin-users':
        return (await this.hasTable('admin_user')) && (await this.hasIndex('admin_user', 'uq_admin_user_username'))
      case 'v3.0d-issued-certificates':
        return (await this.hasTable('issued_certificate')) && (await this.hasIndex('issued_certificate', 'uq_issued_certificate_public_token'))
      case 'v3.0e-certificate-share-images':
        return (await this.hasColumn('issued_certificate', 'friendShareImageUrl')) && (await this.hasColumn('issued_certificate', 'timelineShareImageUrl'))
      case 'v3.0f-issued-certificate-freeze':
        return (await this.hasColumn('issued_certificate', 'templateId')) && (await this.hasColumn('issued_certificate', 'renderSnapshot'))
      case 'v3.0g-registration-profile-expansion':
        return (await this.hasColumn('user_registration_profile', 'residentialAddress')) && (await this.hasColumn('activity_registration_info', 'residentialAddress'))
      default:
        return false
    }
  }

  private async hasTable(name: string): Promise<boolean> {
    if (this.dialect === 'mysql') {
      const rows = await this.dataSource.query('SHOW TABLES LIKE ?', [name])
      return rows.length > 0
    }

    const rows = await this.dataSource.query(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
      [name],
    )
    return rows.length > 0
  }

  private async hasColumn(table: string, column: string): Promise<boolean> {
    if (this.dialect === 'mysql') {
      const rows = await this.dataSource.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column])
      return rows.length > 0
    }

    const rows = await this.dataSource.query(`PRAGMA table_info(${table})`)
    return rows.some((row: any) => row.name === column)
  }

  private async hasIndex(table: string, index: string): Promise<boolean> {
    if (this.dialect === 'mysql') {
      const rows = await this.dataSource.query(
        'SELECT index_name FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
        [table, index],
      )
      return rows.length > 0
    }

    const rows = await this.dataSource.query(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND name = ?",
      [table, index],
    )
    return rows.length > 0
  }
}
