import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'obats'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('uuid').notNullable().unique()
      table.string('nama').unique()
      table.decimal('dosis', 8, 2)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
