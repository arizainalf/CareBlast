/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const ObatPenyakitController = () => import('#controllers/obat_penyakits_controller')
const PasiensController = () => import('#controllers/pasiens_controller')

router
  .get('/login', async ({ view }) => {
    return view.render('auth/login-page')
  })
  .use(middleware.guest())
  .as('login')

router.post('/login', '#controllers/session_controller.store').as('loginPost')

router.get('/forgot', async ({ view }) => {
  return view.render('auth/forgot-pw')
})

router
  .group(() => {

    router.group(() => {
      router.get('/users', '#controllers/users_controller.index').as('users.index')
      router.post('/users', '#controllers/users_controller.store').as('users.create')
      router.get('/users/:id/show', '#controllers/users_controller.show').as('users.show')
      router.get('/users/:id/edit', '#controllers/users_controller.edit').as('users.edit')
      router.put('/users/:id/update', '#controllers/users_controller.update').as('users.update')
      router.delete('/users/:id', '#controllers/users_controller.destroy').as('users.delete')
    }).use(middleware.role(['super_admin']))

    router.group(() => {
      router.post('/logout', '#controllers/session_controller.destroy').as('logout')

      router.get('/', '#controllers/dashboard_controller.index').as('dashboard')


      router.get('/users/edit-profile', '#controllers/users_controller.editProfile').as('edit-profile')
      router.post('/users/edit-profile', '#controllers/users_controller.editProfile').as('edit-profile.post')
      router.post('/users/edit-password', '#controllers/users_controller.editPassword').as('edit-password')

      router.get('/send-file', '#controllers/whatsapps_controller.sendFile').as('send-file')
      router.post('/send-file', '#controllers/whatsapps_controller.sendFile').as('send-file.post')

      router.get('/data-pasien', [PasiensController, 'index']).as('pasien.index')
      router.post('/data-pasien', [PasiensController, 'store']).as('pasien.store')
      router.get('/data-pasien/search', [PasiensController, 'search']).as('pasien.search')

      router.get('/edit-profile', async ({ view }) => {
        return view.render('profile/index')
      })

      router.get('/profile', async ({ view }) => {
        return view.render('pasien/profile-pasien')
      })

      // start/routes.ts
      router.get('/obat-penyakit', [ObatPenyakitController, 'index']).as('obat-penyakit')

      // Penyakit routes
      router
        .post('/obat-penyakit/penyakit', [ObatPenyakitController, 'storePenyakit'])
        .as('store-penyakit')
      router
        .post('/obat-penyakit/penyakit/:uuid/update', [ObatPenyakitController, 'updatePenyakit'])
        .as('update-penyakit')
      router
        .post('/obat-penyakit/penyakit/:uuid/delete', [ObatPenyakitController, 'destroyPenyakit'])
        .as('delete-penyakit')
      router
        .get('/obat-penyakit/penyakit/search', [ObatPenyakitController, 'searchPenyakit'])
        .as('search-penyakit')

      // Obat routes
      router.post('/obat-penyakit/obat', [ObatPenyakitController, 'storeObat']).as('store-obat')
      router
        .post('/obat-penyakit/obat/:uuid/update', [ObatPenyakitController, 'updateObat'])
        .as('update-obat')
      router
        .post('/obat-penyakit/obat/:uuid/delete', [ObatPenyakitController, 'destroyObat'])
        .as('delete-obat')
      router
        .get('/obat-penyakit/obat/search', [ObatPenyakitController, 'searchObat'])
        .as('search-obat')

      // Prpfile routes
      router.get('/pasien/:uuid', '#controllers/pasiens_controller.show').as('profile.pasien')
      router
        .post('/pasien/:uuid/delete', '#controllers/pasiens_controller.destroy')
        .as('pasien.destroy')
      router.post('/pasien/:uuid/obat', '#controllers/obat_pasiens_controller.store')
      router.patch('/obat-pasien/:uuid', '#controllers/obat_pasiens_controller.update')
      router.delete('/obat-pasien/:uuid', '#controllers/obat_pasiens_controller.destroy')
      router.post('/pasien/:uuid/kunjungan', '#controllers/kunjungans_controller.store')
      // Tambahkan route ini di file router
      router.delete(
        '/pasien/:uuid/obat-kunjungan',
        '#controllers/obat_pasiens_controller.destroyByKunjungan'
      )

      router.get('/data-kunjungan', async ({ view }) => {
        return view.render('kunjungan/data-kunjungan')
      })
      router.get('/hasil-lab', async ({ view }) => {
        return view.render('hasil-lab/index')
      })
      router.get('/whatsapps', async ({ view }) => {
        return view.render('whatsapps/whatsapp')
      })
      router.get('/detail-kunjungan', async ({ view }) => {
        return view.render('kunjungan/detail_kunjungan/index')
      })

      router.get('/qrcode', '#controllers/whatsapps_controller.getQrCode').as('qrcode')
      router.get('/status', '#controllers/whatsapps_controller.status').as('status')
      router.get('/logoutWhatsapp', '#controllers/whatsapps_controller.logout').as('logoutWhatsapp')

      router.get('/messages', '#controllers/whatsapps_controller.createMsg')
      router.post('/send', '#controllers/whatsapps_controller.sendMsg')

      router.get('/pasiens', '#controllers/pasiens_controller.index')

      //Pages Error
      router.get('/bad-request', async ({ view }) => {
        return view.render('pages/errors/400')
      })
      router.get('/forbidden-error', async ({ view }) => {
        return view.render('pages/errors/403')
      })
      router.get('/not-found', async ({ view }) => {
        return view.render('pages/errors/404')
      })
      router.get('/server-error', async ({ view }) => {
        return view.render('pages/errors/500')
      })
      router.get('/server-unavailable', async ({ view }) => {
        return view.render('pages/errors/503')
      })
    }).use(middleware.role(['super_admin', 'admin']))

  })
  .use(middleware.auth())
