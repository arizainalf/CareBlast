import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, hasOne } from '@adonisjs/lucid/orm'
import { v4 as uuidv4 } from 'uuid'
import JenisPenyakit from '#models/jenis_penyakit'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import ObatPasien from '#models/obat_pasien'
import Kunjungan from '#models/kunjungan'
import Contact from '#models/contact'

export default class Pasien extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare jenisPenyakitId: number | null

  @hasMany(() => Kunjungan)
  public kunjungans!: HasMany<typeof Kunjungan>

  @belongsTo(() => JenisPenyakit)
  declare jenisPenyakit: BelongsTo<typeof JenisPenyakit>

  @column()
  declare name: string

  @column()
  declare tempat: string

  @column.date()
  declare tanggal_lahir: DateTime

  @column()
  declare no_hp: string

  @column()
  declare alamat: string

  @column()
  declare jenis_kelamin: string

  @column()
  declare nik: string

  @column()
  declare golongan_darah: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => ObatPasien)
  declare obatPasiens: HasMany<typeof ObatPasien>

  @hasOne(() => Contact, {
    localKey: 'uuid' // Kunci lokal yang digunakan untuk relasi
  })
  declare contact: HasOne<typeof Contact>

  public static async generateUuid(pasien: Pasien) {
    pasien.uuid = uuidv4()
  }
}
