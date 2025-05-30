import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const ProfilesController = () => import('#controllers/pasien/profiles_controller')
const VisitsController = () => import('#controllers/pasien/visits_controller')
const HomeController = () => import('#controllers/pasien/home_controller')
const SessionController = () => import('#controllers/session_controller')
const DashboardController = () => import('#controllers/dashboard_controller')
const UsersController = () => import('#controllers/users_controller')
const ObatPasiensController = () => import('#controllers/obat_pasiens_controller')
const WhatsappsController = () => import('#controllers/whatsapps_controller')
const KunjungansController = () => import('#controllers/kunjungans_controller')
const ObatPenyakitController = () => import('#controllers/obat_penyakits_controller')
const PasiensController = () => import('#controllers/pasiens_controller')
const LaporansController = () => import('#controllers/laporans_controller')
const DokterSpesialistsController = () => import('#controllers/dokter_spesialists_controller')
const PasswordResetsController = () => import('#controllers/password_resets_controller')

router
  .get('/login', async ({ view }) => {
    return view.render('auth/login-page')
  })
  .use(middleware.guest())
  .as('login')
router.post('/login', [SessionController, 'store']).as('loginPost')

router.get('/forgot', async ({ view }) => {
  return view.render('auth/forgot-pw')
})

router.post('/forgot', [PasswordResetsController, 'forgot']).as('forgotPost')
router.get('/reset-password/:uuid', [PasswordResetsController, 'show']).as('reset-password')
router.post('/reset-password/:uuid', [PasswordResetsController, 'resetPassword']).as('reset-password.post')

// Route Patients
router
  .group(() => {
    router.get('/', [HomeController, 'index']).as('pengguna.home')
    router.get('/kunjungan', [VisitsController, 'index']).as('pengguna.kunjungan')
    router.get('/profile', [ProfilesController, 'index']).as('pengguna.profile')
    router.get('/logout', [SessionController, 'destroy']).as('logoutPengguna')
  })
  .prefix('/pengguna')
  .use(middleware.auth({ guards: ['pasien'] }))

// Route Admin/Super admin
router
  .group(() => {
    router.get('/laporan', [LaporansController, 'index']).as('laporan.index')

    router.get('/users', [UsersController, 'index']).as('users.index')
    router.post('/users', [UsersController, 'store']).as('users.create')
    router.get('/users/:id/show', [UsersController, 'show']).as('users.show')
    router.get('/users/:id/edit', [UsersController, 'edit']).as('users.edit')
    router.put('/users/:id/update', [UsersController, 'update']).as('users.update')
    router.delete('/users/:id', [UsersController, 'destroy']).as('users.delete')

    router.get('/spesialis', [DokterSpesialistsController, 'list']).as('spesialis.list')

    router.get('/dokter', [DokterSpesialistsController, 'index']).as('dokter.index')
    router.post('/dokter', [DokterSpesialistsController, 'store']).as('dokter.store')
    router.post('/spesialis', [DokterSpesialistsController, 'store']).as('spesialis.store')
    router
      .put('/dokter/:id_dokter/update', [DokterSpesialistsController, 'update'])
      .as('dokter.update')
    router
      .delete('/dokter/:id_dokter/hapus', [DokterSpesialistsController, 'destroy'])
      .as('dokter.delete')
    router
      .put('/spesialist/:id_spesialist/update', [DokterSpesialistsController, 'update'])
      .as('spesialis.update')
    router
      .delete('/spesialist/:id_spesialist/hapus', [DokterSpesialistsController, 'destroy'])
      .as('spesialis.delete')
    router
      .put('/dokter/:id/updateStatus', [DokterSpesialistsController, 'updateStatus'])
      .as('dokter.updateStatus')

    router.put('/dokter/:id/jadwal', [DokterSpesialistsController, 'updateHari'])
      .as('spesialis.jadwal')
  })
  .use(middleware.auth({ guards: ['web'] }))
  .middleware(middleware.role(['super_admin']))

router
  .group(() => {
    router.post('/logout', [SessionController, 'destroy']).as('logout')
    router.get('/', [DashboardController, 'index']).as('dashboard')

    router.get('/users/edit-profile', [UsersController, 'editProfile']).as('edit-profile')
    router.post('/users/edit-profile', [UsersController, 'editProfile']).as('edit-profile.post')
    router.post('/users/edit-password', [UsersController, 'editPassword']).as('edit-password')

    router.get('/data-pasien', [PasiensController, 'index']).as('pasien.index')
    router.post('/data-pasien', [PasiensController, 'store']).as('pasien.store')
    router.get('/data-pasien/search', [PasiensController, 'search']).as('pasien.search')

    router.get('/pasien/:uuid', [PasiensController, 'show']).as('profile.pasien')
    router.put('/pasien/:uuid', [PasiensController, 'update']).as('pasien.update')
    router.delete('/pasien/:uuid/delete', [PasiensController, 'destroy']).as('pasien.destroy')
    router.post('/pasien/:uuid/obat', [ObatPasiensController, 'store'])
    router.patch('/obat-pasien/:uuid', [ObatPasiensController, 'update'])
    router.delete('/obat-pasien/:uuid', [ObatPasiensController, 'destroy'])
    router.delete('/pasien/:uuid/obat-kunjungan', [ObatPasiensController, 'destroyByKunjungan'])
    router.post('/pasien/:uuid/kunjungan', [KunjungansController, 'store'])
    router.get('/pasiens', [PasiensController, 'index'])
    router.get('/obat-pasien/:uuid/detail', [ObatPasiensController, 'getDetail'])

    router.get('/data-kunjungan', [KunjungansController, 'index'])
    router.get('/kunjungan/search', [KunjungansController, 'search'])
    router.get('/kunjungan/:uuid', [KunjungansController, 'show'])
    router.put('/kunjungan/:uuid', [KunjungansController, 'update'])
    router.post('/kunjungans/:uuid', [KunjungansController, 'destroy'])

    router.get('/send-file', [WhatsappsController, 'sendFile']).as('send-file')
    router.post('/send-file', [WhatsappsController, 'sendFile']).as('send-file.post')

    router.get('/whatsapps', async ({ view }) => {
      return view.render('whatsapps/whatsapp')
    })
    router.get('/get-all-contact/', [WhatsappsController, 'getAllContact']).as('get-all-contact')
    router.get('/get-chat/:id', [WhatsappsController, 'getChat']).as('get-chat')
    router.get('/get-contact/:id', [WhatsappsController, 'getContact']).as('get-contact')
    router.put('/contact/:id/update', [WhatsappsController, 'updateContact']).as('update-contact')
    router.get('/chat/:id/new-messages', [WhatsappsController, 'getNewMessages'])
    router.get('/qrcode', [WhatsappsController, 'getQrCode']).as('qrcode')
    router.get('/status', [WhatsappsController, 'status']).as('status')
    router.get('/logoutWhatsapp', [WhatsappsController, 'logout']).as('logoutWhatsapp')
    router.get('/messages', [WhatsappsController, 'createMsg'])
    router.post('/send', [WhatsappsController, 'sendMsg'])
    router.post('/send-message', [WhatsappsController, 'sendMsg'])
    router.post('/pengumuman', [WhatsappsController, 'sendbulkMessages'])

    router.get('/obat-penyakit', [ObatPenyakitController, 'index']).as('obat-penyakit')
    router.get('/penyakit', [ObatPenyakitController, 'penyakit']).as('penyakit')

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

    router.get('/hasil-lab', async ({ view }) => {
      return view.render('hasil-lab/index')
    })
    router.get('/hasil-lab/all', [WhatsappsController, 'allHasilLab']).as('get-all-hasil-lab')
    // router.get('/hasil-lab/all', [WhatsappsController, 'getAllHasilLab']).as('get-all-hasil-lab')
    router.get('/hasil-lab/:uuid', [WhatsappsController, 'getHasilLab']).as('get-hasil-lab')

    // Error pages
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
  .use(middleware.auth({ guards: ['web'] }))
  .middleware(middleware.role(['admin', 'super_admin']))
