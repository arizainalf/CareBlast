import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'konsultasis'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('pasien_id')
        .unsigned()
        .references('id')
        .inTable('pasiens')
        .onDelete('CASCADE')
        .notNullable()
      table.date('tanggal')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
