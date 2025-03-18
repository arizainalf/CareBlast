import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const WhatsappsController = () => import('#controllers/whatsapps_controller')
const KunjungansController = () => import('#controllers/kunjungans_controller')
const ObatPenyakitController = () => import('#controllers/obat_penyakits_controller')
const PasiensController = () => import('#controllers/pasiens_controller')
const UsersController  = () => import('#controllers/users_controller')
const SessionController  = () => import('#controllers/session_controller')
const DashboardController  = () => import('#controllers/dashboard_controller')

// Authentication Routes
router
  .get('/login', async ({ view }) => view.render('auth/login-page'))
  .use(middleware.guest())
  .as('login')
router.post('/login', [SessionController, 'store']).as('loginPost')
router.get('/forgot', async ({ view }) => view.render('auth/forgot-pw'))

// Protected Routes
router
  .group(() => {
    // User Management
    router
      .group(() => {
        router.get('/users', [UsersController, 'index']).as('users.index')
        router.post('/users', [UsersController, 'store']).as('users.create')
        router.get('/users/:id/show', [UsersController, 'show']).as('users.show')
        router.get('/users/:id/edit', [UsersController, 'edit']).as('users.edit')
        router.put('/users/:id/update', [UsersController, 'update']).as('users.update')
        router.delete('/users/:id', [UsersController, 'destroy']).as('users.delete')
      })
      .use(middleware.role(['super_admin']))

    // General Routes
    router.post('/logout', [SessionController, 'destroy']).as('logout')
    router.get('/', [DashboardController, 'index']).as('dashboard')
    router
      .get('/users/edit-profile', [UsersController, 'editProfile'])
      .as('edit-profile')
    router
      .post('/users/edit-profile', [UsersController, 'editProfile'])
      .as('edit-profile.post')
    router
      .post('/users/edit-password', [UsersController, 'editPassword'])
      .as('edit-password')

    // WhatsApp Features
    router.get('/send-file',[WhatsappsController, 'sendFile']).as('send-file')
    router.post('/send-file', [WhatsappsController, 'sendFile']).as('send-file.post')
    router.get('/get-contacts', [WhatsappsController, 'getContacts']).as('get.contact')
    router.get('/get-chat/:number', [WhatsappsController, 'getChat']).as('get.chat')

    // Patient Data Management
    router.get('/data-pasien', [PasiensController, 'index']).as('pasien.index')
    router.post('/data-pasien', [PasiensController, 'store']).as('pasien.store')
    router.get('/data-pasien/search', [PasiensController, 'search']).as('pasien.search')
    router.get('/pasien/:uuid', [PasiensController, 'show']).as('profile.pasien')
    router
      .post('/pasien/:uuid/delete', [PasiensController, 'destroy'])
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
    router.post('/pasien/:uuid/kunjungan', [KunjungansController, 'store'] )
    router.get('/data-kunjungan', [KunjungansController, 'index'])
    router.get('/kunjungan/search', [KunjungansController, 'search'])
    router.get('/kunjungan/:uuid', [KunjungansController, 'show'])

    // Misc Pages
    router.get('/hasil-lab', async ({ view }) => view.render('hasil-lab/index'))
    router.get('/whatsapps', async ({ view }) => view.render('whatsapps/whatsapp'))

    // WhatsApp Bot Status
    router.get('/qrcode', [WhatsappsController, 'getQrCode']).as('qrcode')
    router.get('/status', [WhatsappsController, 'status']).as('status')
    router.get('/logoutWhatsapp', [WhatsappsController, 'logout']).as('logoutWhatsapp')

    // Messaging
    router.get('/messages',[WhatsappsController, 'createMsg'])
    router.post('/send', [WhatsappsController, 'sendMsg'])

    // Error Pages
    router.get('/bad-request', async ({ view }) => view.render('pages/errors/400'))
    router.get('/forbidden-error', async ({ view }) => view.render('pages/errors/403'))
    router.get('/not-found', async ({ view }) => view.render('pages/errors/404'))
    router.get('/server-error', async ({ view }) => view.render('pages/errors/500'))
    router.get('/server-unavailable', async ({ view }) => view.render('pages/errors/503'))
  })
  .use(middleware.role(['super_admin', 'admin']))
  .use(middleware.auth())
