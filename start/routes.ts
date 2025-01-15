/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

router.get('/login', async ({ view }) => {
  return view.render('auth/login-page')
})
router.get('/profile', async ({ view }) => {
  return view.render('pages/pasien/profile-pasien')
})
router.get('/data-pasien', async ({ view }) => {
  return view.render('pages/pasien/data-pasien')
})
router.get('/data-obat', async ({ view }) => {
  return view.render('pages/pasien/data-obat')
})
router.get('/data-kunjungan', async ({ view }) => {
  return view.render('pages/pasien/data-kunjungan')
})
router.get('/hasil-lab', async ({ view }) => {
  return view.render('pages/pasien/hasil-lab')
})
router.get('/whatsapps', async ({ view }) => {
  return view.render('whatsapps/whatsapp')
})
router.get('/detail-kunjungan', async ({ view }) => {
  return view.render('pages/pasien/detail_kunjungan/index')
})

router.get('/', '#controllers/whatsapps_controller.showqr')
router.get('/qrcode', '#controllers/whatsapps_controller.getQrCode')
router.get('/status', '#controllers/whatsapps_controller.status')
router.get('/logout', '#controllers/whatsapps_controller.logout')

router.get('/messages', '#controllers/whatsapps_controller.createMsg')
router.post('/send', '#controllers/whatsapps_controller.sendMsg')

router.get('/pasiens', '#controllers/pasiens_controller.index')
