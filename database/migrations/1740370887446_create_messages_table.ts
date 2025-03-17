import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('from').notNullable() // Nomor Pengirim
      table.string('message_id').unique().notNullable() // ID Pesan
      table.string('message_type').notNullable() // Tipe Pesan
      table.text('content').notNullable() // Isi Pesan
      table.boolean('is_sent').defaultTo(false) // Apakah pesan yang dikirim atau diterima
      table.string('group_jid').nullable()
      table.string('group_name').nullable()
      table.timestamp('timestamp')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}