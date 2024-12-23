import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'obats'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('konsultasi_id')
        .unsigned()
        .references('id')
        .inTable('konsultasis')
        .onDelete('CASCADE')
        .notNullable()
      table.string('name')
      table.integer('dosis')
      table.text('keterangan')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
