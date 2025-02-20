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
const PenyakitController = () => import('#controllers/penyakits_controller')
const PasiensController = () => import('#controllers/pasiens_controller')

router
  .get('/login', async ({ view }) => {
    return view.render('auth/login-page')
  })
  .use(middleware.guest())
  .as('login')

router.post('/login', '#controllers/session_controller.store').as('loginPost')

router
  .get('logout', async ({ auth, response }) => {
    await auth.use('web').logout()
    return response.redirect('/login')
  })
  .use(middleware.auth())
  .as('logout')

router.get('/forgot', async ({ view }) => {
  return view.render('auth/forgot-pw')
})

router
  .group(() => {
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

    router.get('/obat-penyakit', [PenyakitController, 'index']).as('obat-penyakit')
    router.post('/obat-penyakit', [PenyakitController, 'store']).as('store-obat-penyakit')
    router
      .post('/obat-penyakit/:uuid/update', [PenyakitController, 'update'])
      .as('update-obat-penyakit')
    router
      .post('/obat-penyakit/:uuid/delete', [PenyakitController, 'destroy'])
      .as('delete-obat-penyakit')
    router.get('/obat-penyakit/search', [PenyakitController, 'search']).as('search-obat-penyakit')

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
    router.get('/logoutWhatapp', '#controllers/whatsapps_controller.logout').as('logoutWhatsapp')

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
