$(document).ready(function () {
  $('a[href]').on('click', function (e) {
    const link = $(this).attr('href');
    if (
      !link ||
      link.startsWith('#') ||
      $(this).attr('target') === '_blank' ||
      link.startsWith('javascript:')
    ) {
      return;
    }

    $('#loading-screen').removeClass('hidden');

    setTimeout(() => {
      window.location.href = link;
    }, 100);
    e.preventDefault();
  });
});
document.addEventListener('DOMContentLoaded', function () {
  const logoutBtn = document.getElementById('logout-btn')

  logoutBtn.addEventListener('click', function (e) {
    e.preventDefault()

    Swal.fire({
      title: 'Yakin ingin logout?',
      text: 'Kamu akan keluar dari akun ini.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#886cc0',
      cancelButtonColor: '#d653c1',
      confirmButtonText: 'Ya, Logout',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = '/pasien/logout'
      }
    })
  })
})
