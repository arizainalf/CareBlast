import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddIsReminderToKunjungans extends BaseSchema {
  protected tableName = 'kunjungan' // nama tabel yang sudah ada

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_reminder').defaultTo(false) // kolom baru
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_reminder')
    })
  }
}
