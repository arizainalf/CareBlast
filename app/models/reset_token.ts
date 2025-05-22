import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import crypto from 'crypto'
import User from '#models/user'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'


type TokenType = 'PASSWORD_RESET' | 'VERIFY_EMAIL'

export default class ResetToken extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare userId: number

  @column()
  declare type: TokenType

  @column()
  declare token: string

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  public static async generateVerifyEmailToken(user: User) {
    const token = crypto.randomBytes(32).toString('hex')

    await ResetToken.expireTokens(user)
    const record = await user.related('resetTokens').create({
      type: 'VERIFY_EMAIL',
      expiresAt: DateTime.now().plus({ hours: 24 }),
      token
    })

    return record.token
  }

  public static async generatePasswordResetToken(user: User | null) {
    const token = crypto.randomBytes(32).toString('hex')

    if (!user) return token

    await ResetToken.expireTokens(user)
    const record = await user.related('resetTokens').create({
      type: 'PASSWORD_RESET',
      expiresAt: DateTime.now().plus({ hour: 1 }),
      token,
    })

    return record.token
  }

  public static async expireTokens(user: User) {
    await user.related('resetTokens').query().update({
      expiresAt: DateTime.now().toSQL(),
    })
  }
  // "type": "Error",
  //     "message": "update `reset_tokens` set `expires_at` = 2025-05-21 14:02:31.081 +07:00 where `user_id` = 2 - Unknown column '_zone' in 'field list'",

  public static async getTokenUser(token: string, type: TokenType) {
    const record = await ResetToken.query()
      .preload('user')
      .where('token', token)
      .where('type', type)
      .where('expiresAt', '>', DateTime.now().toSQL())
      .orderBy('createdAt', 'desc')
      .first()

    return record?.user
  }

  public static async verify(token: string, type: TokenType) {
    const record = await ResetToken.query()
      .where('expiresAt', '>', DateTime.now().toSQL())
      .where('token', token)
      .where('type', type)
      .first()

    return !!record
  }

}