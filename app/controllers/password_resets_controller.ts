import { type HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { sendMsg } from '#services/whatsapp_service'
import ResetToken from '#models/reset_token'
import env from '#start/env'
import { formatWhatsappNumber } from '#services/number_service'

export default class PasswordResetsController {
    async show({ view }: HttpContext) {
        return view.render('auth/reset-pw')
    }

    async forgot({ request, response }: HttpContext) {
        const { email, no_hp } = request.all()

        // Validate email
        if (!email) {
            return response.json({
                success: false,
                message: 'Email dibutuhkan.',
            })
        } else if (!no_hp) {
            return response.json({
                success: false,
                message: 'Nomor hp dibutuhkan.',
            })
        }
        else if (email && no_hp) {
            const user = await User.findBy('email', email)
            const noWa = formatWhatsappNumber(no_hp)
            if (!user) {
                return response.json({
                    success: false,
                    message: 'Email tidak ditemukan.',
                })
            }
            if (user.contact.waId !== noWa) {
                return response.json({
                    success: false,
                    message: 'Nomor hp tidak sama.',
                })
            }

            const token = await ResetToken.generatePasswordResetToken(user)
            const resetLink = `${env.get('APP_URL')}/reset-password/${token}`

            const message = `Hai ${user.fullName},\n\nSilakan klik tautan berikut untuk mengatur ulang kata sandi Anda: \n\n${resetLink}\n\nJika Anda tidak meminta pengaturan ulang kata sandi, abaikan pesan ini.\n\nTerima kasih!`

            console.log(no_hp, email, message, token)

            const sendVerificationCode = await sendMsg(
                no_hp, message)

            if (!sendVerificationCode) {
                return response.json({
                    success: false,
                    message: 'Gagal mengirim pesan WhatsApp.',
                })
            }

            return response.json({
                email: email,
                no_hp: no_hp,
                success: true,
                message: 'Password reset link dikirim ke whatsappmu.',
                redirectUrl: '/login',
            })
        }
    }

    async resetPassword({ request, response, params }: HttpContext) {
        const { password, password_confirmation } = request.all()

        const token_reset = params.uuid

        console.log(token_reset);
        console.log(password, password_confirmation)

        if (!password || !password_confirmation) {
            return response.json({
                success: false,
                message: 'Password dan konfirmasi password dibutuhkan.',
            })
        }

        if (password !== password_confirmation) {
            return response.json({
                success: false,
                message: 'Password tidak sama.',
            })
        }

        const resetToken = await ResetToken.verify(token_reset, 'PASSWORD_RESET')

        if (!resetToken) {
            return response.json({
                success: false,
                message: 'Token tidak valid.',
            })
        }

        const user = await ResetToken.getTokenUser(token_reset, 'PASSWORD_RESET')
        if (!user) {
            return response.json({
                success: false,
                message: 'User tidak ditemukan.',
            })
        }

        user.password = password
        await user.save()

        await ResetToken.expireTokens(user)

        return response.json({
            success: true,
            message: 'Password berhasil diubah.',
            redirectUrl: '/login',
        })
    }

}