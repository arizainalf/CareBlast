import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'chats'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary() // Menggunakan UUID
      table.string('wa_id').notNullable().unique() // Nomor WA atau ID Group
      table.string('name').nullable() // Nama Chat atau Nama Group
      table.boolean('is_group').defaultTo(false) // Apakah ini Group?
      table.text('last_message').nullable() // Pesan terakhir
      table.integer('unread_count').defaultTo(0) // Pesan belum dibaca
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}