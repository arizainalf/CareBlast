import type { HttpContext } from '@adonisjs/core/http'
import Pengaturan from '#models/pengaturan'
import Application from '@adonisjs/core/services/app'
import fs from 'fs'
import { join } from 'node:path'

export default class PengaturansController {
    async index({ view }: HttpContext) {
        const pengaturan = await Pengaturan.findOrFail(1);
        return view.render('pengaturan/index', { pengaturan })
    }

    public async update({ request, response }: HttpContext) {
        const pengaturan = await Pengaturan.findOrFail(1)
        const data = request.only(['nama_aplikasi', 'deskripsi', 'puskesmas'])

        const logo = request.file('logo', {
            size: '2mb',
            extnames: ['jpg', 'jpeg', 'png', 'webp'],
        })

        try {
            // Hapus logo lama jika ada dan bukan default
            if (logo) {
                const oldLogoPath = pengaturan.logo
                if (oldLogoPath && !oldLogoPath.includes('default-logo.png')) {
                    const fullOldPath = join(Application.publicPath(), 'uploads', 'logo', oldLogoPath)
                    try {
                        fs.unlinkSync(fullOldPath)
                    } catch (err) {
                        console.error('Gagal menghapus logo lama:', err.message)
                    }
                }

                // Simpan logo baru
                const newLogoName = `logo_${Date.now()}.${logo.extname}`
                await logo.move(Application.publicPath('uploads/logo'), {
                    name: newLogoName,
                    overwrite: true,
                })

                // Set nama file ke model
                pengaturan.logo = newLogoName
            }

            pengaturan.merge(data)
            await pengaturan.save()

            return response.json({ success: true, message: 'Pengaturan berhasil diperbarui!' })
        } catch (error) {
            return response.json({
                success: false,
                message: 'Gagal memperbarui pengaturan!',
                error: error.message,
            })
        }
    }
}