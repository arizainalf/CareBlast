import { BaseModel, column, beforeCreate, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import Pasien from './pasien.js'
import * as relations from '@adonisjs/lucid/types/relations'

export default class JenisPenyakit extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare nama: string

  @column()
  declare deskripsi: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
  static generateUuid: any

  @beforeCreate()
  public static async createUuid(model: JenisPenyakit) {
    model.uuid = uuidv4()
  }
  @hasMany(() => Pasien)
  declare pasiens: relations.HasMany<typeof Pasien>
}
