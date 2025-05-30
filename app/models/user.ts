import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, beforeCreate, hasMany, hasOne } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { v4 as uuidv4 } from 'uuid'
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
import ResetToken from '#models/reset_token'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Contact from '#models/contact'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare foto: string

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column()
  declare role: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeCreate()
  public static async generateUuid(user: User) {
    user.uuid = uuidv4()
  }

  @hasOne(() => Contact, {
    localKey: 'uuid',
  })
  declare contact: HasOne<typeof Contact>

  @hasMany(() => ResetToken, {
    localKey: 'id',
  })
  declare resetTokens: HasMany<typeof ResetToken>

  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)
}
