import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { v4 as uuidv4 } from 'uuid'
import Pasien from '#models/pasien'
import Obat from '#models/obat'
import Kunjungan from '#models/kunjungan'

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
  declare kunjunganId: number

  @belongsTo(() => Kunjungan)
  declare kunjungan: BelongsTo<typeof Kunjungan>

  @column()
  declare obatId: number

  @belongsTo(() => Obat)
  declare obat: BelongsTo<typeof Obat>

  @column()
  declare frekuensi: number

  @column()
  declare waktuKonsumsi: string

  @column()
  declare keteranganWaktu: string

  @column()
  declare hariKonsumsi: string | null

  @column()
  declare batasWaktu: Date

  @column()
  declare status: boolean | number 

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  public static assignUuid(obatPasien: ObatPasien) {
    obatPasien.uuid = uuidv4()
  }
}
