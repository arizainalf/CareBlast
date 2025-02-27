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

    router.post('/logout', '#controllers/session_controller.destroy').as('logout')

    router.get('/', '#controllers/dashboard_controller.index').as('dashboard')

    router.get('/users', '#controllers/users_controller.index').as('users.index')
    router.post('/users', '#controllers/users_controller.store').as('users.create')
    router.get('/users/:id', '#controllers/users_controller.show')
    router.put('/users/:id', '#controllers/users_controller.update')
    router.delete('/users/:id', '#controllers/users_controller.destroy')

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
  })
  .use(middleware.auth())
