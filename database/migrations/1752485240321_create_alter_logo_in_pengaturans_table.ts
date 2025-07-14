import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pengaturans'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('logo').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('logo')
    })
  }
}
