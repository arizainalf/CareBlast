import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('nama').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('nama')
    })
  }
}
