import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const WhatsappsController = () => import('#controllers/whatsapps_controller')
const KunjungansController = () => import('#controllers/kunjungans_controller')
const ObatPenyakitController = () => import('#controllers/obat_penyakits_controller')
const PasiensController = () => import('#controllers/pasiens_controller')

// Authentication Routes
router
  .get('/login', async ({ view }) => view.render('auth/login-page'))
  .use(middleware.guest())
  .as('login')
router.post('/login', '#controllers/session_controller.store').as('loginPost')
router.get('/forgot', async ({ view }) => view.render('auth/forgot-pw'))

// Protected Routes
router
  .group(() => {
    // User Management
    router
      .group(() => {
        router.get('/users', '#controllers/users_controller.index').as('users.index')
        router.post('/users', '#controllers/users_controller.store').as('users.create')
        router.get('/users/:id/show', '#controllers/users_controller.show').as('users.show')
        router.get('/users/:id/edit', '#controllers/users_controller.edit').as('users.edit')
        router.put('/users/:id/update', '#controllers/users_controller.update').as('users.update')
        router.delete('/users/:id', '#controllers/users_controller.destroy').as('users.delete')
      })
      .use(middleware.role(['super_admin']))

    // General Routes
    router.post('/logout', '#controllers/session_controller.destroy').as('logout')
    router.get('/', '#controllers/dashboard_controller.index').as('dashboard')
    router
      .get('/users/edit-profile', '#controllers/users_controller.editProfile')
      .as('edit-profile')
    router
      .post('/users/edit-profile', '#controllers/users_controller.editProfile')
      .as('edit-profile.post')
    router
      .post('/users/edit-password', '#controllers/users_controller.editPassword')
      .as('edit-password')

    // WhatsApp Features
    router.get('/send-file', '#controllers/whatsapps_controller.sendFile').as('send-file')
    router.post('/send-file', '#controllers/whatsapps_controller.sendFile').as('send-file.post')
    router.get('/get-contacts', [WhatsappsController, 'getContacts']).as('get.contact')
    router.get('/get-chat/:number', [WhatsappsController, 'getChat']).as('get.chat')

    // Patient Data Management
    router.get('/data-pasien', [PasiensController, 'index']).as('pasien.index')
    router.post('/data-pasien', [PasiensController, 'store']).as('pasien.store')
    router.get('/data-pasien/search', [PasiensController, 'search']).as('pasien.search')
    router.get('/pasien/:uuid', '#controllers/pasiens_controller.show').as('profile.pasien')
    router
      .post('/pasien/:uuid/delete', '#controllers/pasiens_controller.destroy')
      .as('pasien.destroy')

    // Obat dan Penyakit
    router.get('/obat-penyakit', [ObatPenyakitController, 'index']).as('obat-penyakit')
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

    // Kunjungan
    router.post('/pasien/:uuid/kunjungan', '#controllers/kunjungans_controller.store')
    router.get('/data-kunjungan', [KunjungansController, 'index'])
    router.get('/kunjungan/search', [KunjungansController, 'search'])
    router.get('/kunjungan/:uuid', [KunjungansController, 'show'])

    // Misc Pages
    router.get('/hasil-lab', async ({ view }) => view.render('hasil-lab/index'))
    router.get('/whatsapps', async ({ view }) => view.render('whatsapps/whatsapp'))

    // WhatsApp Bot Status
    router.get('/qrcode', '#controllers/whatsapps_controller.getQrCode').as('qrcode')
    router.get('/status', '#controllers/whatsapps_controller.status').as('status')
    router.get('/logoutWhatsapp', '#controllers/whatsapps_controller.logout').as('logoutWhatsapp')

    // Messaging
    router.get('/messages', '#controllers/whatsapps_controller.createMsg')
    router.post('/send', '#controllers/whatsapps_controller.sendMsg')

    // Error Pages
    router.get('/bad-request', async ({ view }) => view.render('pages/errors/400'))
    router.get('/forbidden-error', async ({ view }) => view.render('pages/errors/403'))
    router.get('/not-found', async ({ view }) => view.render('pages/errors/404'))
    router.get('/server-error', async ({ view }) => view.render('pages/errors/500'))
    router.get('/server-unavailable', async ({ view }) => view.render('pages/errors/503'))
  })
  .use(middleware.role(['super_admin', 'admin']))
  .use(middleware.auth())
