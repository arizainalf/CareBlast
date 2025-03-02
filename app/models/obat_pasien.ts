import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { v4 as uuidv4 } from 'uuid'
import Pasien from '#models/pasien'
import Obat from '#models/obat'

export default class ObatPasien extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare pasienId: number

  @belongsTo(() => Pasien)
  declare pasien: BelongsTo<typeof Pasien>

  @column()
  declare obatId: number

  @belongsTo(() => Obat)
  declare obat: BelongsTo<typeof Obat>

  @column()
  declare frekuensi: number

  @column()
  declare waktuKonsumsi: string // JSON array of times (e.g., '["08:00", "14:00", "20:00"]')

  @column()
  declare keteranganWaktu: string // "Sebelum makan" atau "Sesudah makan"

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  public static assignUuid(obatPasien: ObatPasien) {
    obatPasien.uuid = uuidv4()
  }
}
