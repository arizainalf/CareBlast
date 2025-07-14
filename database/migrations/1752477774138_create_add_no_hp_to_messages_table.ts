import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('no_hp', 16).nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('no_hp')
    })
  }
}