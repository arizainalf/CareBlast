import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'dokters'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('nip').notNullable()
      table.string('nama').notNullable()
      table
        .integer('spesialist_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('spesialists')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
      table.string('jam_mulai').notNullable()
      table.string('jam_selesai').notNullable()
      table.boolean('status').defaultTo(true)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}