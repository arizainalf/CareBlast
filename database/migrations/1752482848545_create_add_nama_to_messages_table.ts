import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Drop foreign key constraint dulu
      table.dropForeign('contact_id')

      // Ubah jadi nullable
      table.string('contact_id').nullable().alter()

      // Tambahkan foreign key kembali jika ingin tetap ada
      table.foreign('contact_id').references('id').inTable('contacts')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Drop FK dulu
      table.dropForeign('contact_id')

      // Balik lagi jadi not nullable
      table.string('contact_id').notNullable().alter()

      // Tambahkan FK lagi
      table.foreign('contact_id').references('id').inTable('contacts')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
    })
  }
}
