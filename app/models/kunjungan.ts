import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Pasien from '#models/pasien'
import ObatPasien from '#models/obat_pasien'
import { v4 as uuidv4 } from 'uuid'

export default class Kunjungan extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare pasienId: number

  @belongsTo(() => Pasien)
  declare pasien: BelongsTo<typeof Pasien>

  @column()
  declare tema: string

  @column()
  declare keterangan: string

  @column.date()
  declare tanggalKunjungan: DateTime

  @hasMany(() => ObatPasien)
  declare obatPasiens: HasMany<typeof ObatPasien>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  public static assignUuid(kunjungan: Kunjungan) {
    kunjungan.uuid = uuidv4()
  }
}
