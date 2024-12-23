import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'jadwals'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('obat_id')
        .unsigned()
        .references('id')
        .inTable('obats')
        .onDelete('CASCADE')
        .notNullable()
      table.enum('status', ['0', '1'])
      table.time('waktu')
      table.date('selesai')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
