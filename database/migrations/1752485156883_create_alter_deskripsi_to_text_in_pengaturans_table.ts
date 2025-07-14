import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pengaturans'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('deskripsi').nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('deskripsi', 255).nullable().alter()
    })
  }
}
