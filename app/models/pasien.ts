import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { v4 as uuidv4 } from 'uuid'
import JenisPenyakit from '#models/jenis_penyakit'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class Pasien extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare jenisPenyakitId: number

  @hasMany(() => JenisPenyakit)
  declare jenisPenyakits: HasMany<typeof JenisPenyakit>

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  public static async generateUuid(pasien: Pasien) {
    pasien.uuid = uuidv4()
  }
}
