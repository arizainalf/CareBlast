// const togglePasswordVisibility = (inputSelector, iconSelector) => {
//   let passwordInput = $(inputSelector);
//   let toggleIcon = $(iconSelector);

//   if (passwordInput.attr("type") === "password") {
//     passwordInput.attr("type", "text");
//     toggleIcon.removeClass("fas fa-eye").addClass("fas fa-eye-slash");
//   } else {
//     passwordInput.attr("type", "password");
//     toggleIcon.removeClass("fas fa-eye-slash").addClass("fas fa-eye");
//   }
// };

// // 🔹 Fungsi SweetAlert Custom
// const showSwal = (type, title, message, callback = null, redirectUrl = null) => {
//   Swal.fire({
//     icon: type,
//     title: title,
//     text: message,
//     showConfirmButton: true
//   }).then((result) => {
//     if (callback && result.isConfirmed) {
//       callback();
//     }
//     if (redirectUrl) {
//       setTimeout(() => {
//         window.location.href = redirectUrl;
//       }, 2000);
//     }
//   });
// };

// // 🔹 Fungsi untuk Menampilkan Modal
// const showModal = (modalId) => {
//   let modal = new bootstrap.Modal(document.getElementById(modalId));
//   modal.show();
// };

// // 🔹 Fungsi untuk Menutup Modal
// const hideModal = (modalId) => {
//   let modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
//   modal.hide();
// };

// // 🔹 Fungsi untuk Memuat Data ke Modal (misalnya Edit)
// const loadDataToModal = (url, modalId, callback) => {
//   $.get(url, function (data) {
//     if (!data) {
//       showSwal("error", "Gagal", "Data tidak ditemukan!");
//       return;
//     }
//     callback(data);
//     showModal(modalId);
//   }).fail(() => {
//     showSwal("error", "Gagal", "Gagal mengambil data!");
//   });
// };

// // 🔹 Fungsi untuk AJAX Request (CRUD)
// const ajaxRequest = (url, method, formData, callback) => {
//   $.ajax({
//     url: url,
//     enctype: "multipart/form-data",
//     type: method,
//     data: formData,
//     processData: false,
//     contentType: false,
//     success: (response) => {
//       if (response.success) {
//         showSwal("success", "Sukses! ", response.message, () => {
//           if (callback) callback();
//         }, response.redirectUrl ? response.redirectUrl : null);
//       } else {
//         showSwal("error", "Terjadi Kesalahan! " + response.message);
//       }
//     },
//     error: (response) => {
//       showSwal("error", "Terjadi kesalahan!" + response.message);
//     }
//   });
// };

// // 🔹 Fungsi untuk Konfirmasi Hapus
// const confirmDelete = (url, callback) => {
//   showSwal("warning", "Konfirmasi", "Apakah Anda yakin ingin menghapus ini?", () => {
//     $.ajax({
//       url: url,
//       type: "DELETE",
//       headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
//       success: (response) => {
//         if (response.success) {
//           showSwal("success", "Terhapus", response.message, () => {
//             if (callback) callback();
//           });
//         } else {
//           showSwal("error", "Error", response.message);
//         }
//       },
//       error: (error) => {
//         showSwal("error", "Gagal", "Terjadi kesalahan saat menghapus data! " + error);
//       }
//     });
//   });
// };

// function formatPhoneNumber(phone) {
//   return phone.replace(/@.+$/, '').replace(/^62/, "0")
// }

// function formatTimestamp(timestamp) {
//   const date = new Date(timestamp);

//   return new Intl.DateTimeFormat('id-ID', {
//     weekday: 'long', // Nama hari (Minggu, Senin, ...)
//     day: '2-digit',  // Tanggal (01, 02, ...)
//     month: 'long',   // Nama bulan (Januari, Februari, ...)
//     year: 'numeric', // Tahun (2025, 2026, ...)
//     timeZone: 'Asia/Jakarta' // Pastikan zona waktu Indonesia
//   }).format(date);
// }

// function formatDate(tanggal) {
//   const parsed = Date.parse(tanggal)
//   if (isNaN(parsed)) {
//     console.error('Tanggal tidak valid:', tanggal)
//     return 'Tanggal tidak valid'
//   }

//   const date = new Date(parsed)
//   return date.toLocaleDateString('id-ID', {
//     day: '2-digit',
//     month: 'long',
//     year: 'numeric',
//   })
// }

// function formatTanggal(tanggalString) {
//   const tanggal = new Date(tanggalString);
//   if (isNaN(tanggal)) {
//     console.error('Format tanggal tidak valid:', tanggalString);
//     return 'Tanggal tidak valid';
//   }

//   const options = { day: '2-digit', month: 'long', year: 'numeric' };
//   return tanggal.toLocaleDateString('id-ID', options);
// }

// function logoutBtn(buttonId) {
//   const logoutButton = document.getElementById(buttonId)
//   logoutButton.addEventListener('click', function (event) {
//     event.preventDefault()

//     console.log('tombol ditekan', buttonId)

//     Swal.fire({
//       title: 'Konfirmasi Logout',
//       text: 'Apakah Anda yakin ingin logout?',
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonText: 'Logout',
//       cancelButtonText: 'Batal',
//     }).then(async (result) => {
//       if (result.isConfirmed) {
//         // Kirim permintaan logout ke server
//         const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content')

//         const response = await fetch('/logout', {
//           method: 'POST',
//           headers: {
//             'X-Requested-With': 'XMLHttpRequest',
//             'Content-Type': 'application/json',
//             'X-CSRF-TOKEN': csrfToken, // Kirim CSRF token
//           },
//         })

//         const result = await response.json()

//         if (result.success === true) {
//           Swal.fire({
//             title: 'Logout Berhasil!',
//             text: 'Anda akan diarahkan ke halaman login...',
//             icon: 'success',
//             timer: 2000,
//             showConfirmButton: false,
//           }).then(() => {
//             window.location.href = result.redirectUrl
//           })
//         }
//       }
//     })
//   })
// }


// 🔐 Toggle Password Visibility
const togglePasswordVisibility = (inputSelector, iconSelector) => {
  const $input = $(inputSelector);
  const $icon = $(iconSelector);

  const isPassword = $input.attr("type") === "password";
  $input.attr("type", isPassword ? "text" : "password");
  $icon
    .removeClass(isPassword ? "fas fa-eye" : "fas fa-eye-slash")
    .addClass(isPassword ? "fas fa-eye-slash" : "fas fa-eye");
};

// 💬 SweetAlert Wrapper
const showSwal = (type, title, message, callback = null, redirectUrl = null) => {
  Swal.fire({
    icon: type,
    title: title,
    text: message,
    showConfirmButton: true,
  }).then((result) => {
    if (callback && result.isConfirmed) callback();
    if (redirectUrl) setTimeout(() => (window.location.href = redirectUrl), 2000);
  });
};

// 📥 Show Bootstrap Modal
const showModal = (modalId) => {
  const $modal = $(`#${modalId}`);
  $modal.modal("show");
};

// ❌ Hide Bootstrap Modal
const hideModal = (modalId) => {
  const $modal = $(`#${modalId}`);
  $modal.modal("hide");
};

// 📦 Load Data to Modal
const loadDataToModal = (url, modalId, callback) => {
  $.get(url)
    .done((data) => {
      if (!data) return showSwal("error", "Gagal", "Data tidak ditemukan!");
      callback(data);
      showModal(modalId);
    })
    .fail(() => showSwal("error", "Gagal", "Gagal mengambil data!"));
};

// 🔄 AJAX Request (dengan showSwal & optional callback)
const ajaxRequest = (url, method, formData, callback = null) => {
  $.ajax({
    url: url,
    enctype: "multipart/form-data",
    type: method,
    data: formData,
    processData: false,
    contentType: false,
    success: (response) => {
      if (response.success) {
        showSwal("success", "Sukses!", response.message, () => {
          if (callback) callback();
        }, response.redirectUrl || null);
      } else {
        showSwal("error", "Terjadi Kesalahan!", response.message);
      }
    },
    error: (xhr) => {
      const message = xhr.responseJSON?.message || "Terjadi kesalahan tidak diketahui.";
      showSwal("error", "Gagal!", message);
    },
  });
};

// 🗑️ Konfirmasi Hapus
const confirmDelete = (url, callback = null) => {
  Swal.fire({
    title: "Konfirmasi",
    text: "Apakah Anda yakin ingin menghapus ini?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus",
    cancelButtonText: "Batal",
  }).then((result) => {
    if (!result.isConfirmed) return;

    $.ajax({
      url: url,
      type: "DELETE",
      headers: {
        "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
      },
      success: (response) => {
        if (response.success) {
          showSwal("success", "Terhapus!", response.message, () => {
            if (callback) callback();
          });
        } else {
          showSwal("error", "Error!", response.message);
        }
      },
      error: (xhr) => {
        const message = xhr.responseJSON?.message || "Terjadi kesalahan saat menghapus!";
        showSwal("error", "Gagal!", message);
      },
    });
  });
};

// 🚪 Logout Button
const logoutBtn = (buttonSelector) => {
  $(buttonSelector).on("click", function (e) {
    e.preventDefault();

    Swal.fire({
      title: "Konfirmasi Logout",
      text: "Apakah Anda yakin ingin logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Logout",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (!result.isConfirmed) return;

      $.ajax({
        url: "/logout",
        type: "POST",
        headers: {
          "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
          "X-Requested-With": "XMLHttpRequest",
        },
        success: (res) => {
          if (res.success) {
            Swal.fire({
              icon: "success",
              title: "Logout Berhasil!",
              text: "Anda akan diarahkan ke halaman login...",
              showConfirmButton: false,
              timer: 2000,
            }).then(() => {
              window.location.href = res.redirectUrl || "/";
            });
          }
        },
        error: () => {
          showSwal("error", "Gagal", "Logout gagal, silakan coba lagi!");
        },
      });
    });
  });
};

// 📱 Format Nomor Telepon
const formatPhoneNumber = (phone) => phone.replace(/@.+$/, "").replace(/^62/, "0");

// 🕓 Format Timestamp
const formatTimestamp = (timestamp) =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(timestamp));

// 📅 Format Tanggal Umum
const formatDate = (tanggal) => {
  const parsed = Date.parse(tanggal);
  if (isNaN(parsed)) return "Tanggal tidak valid";

  return new Date(parsed).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// 📅 Format Tanggal String (lebih strict)
const formatTanggal = (tanggalString) => {
  const tanggal = new Date(tanggalString);
  if (isNaN(tanggal)) return "Tanggal tidak valid";

  return tanggal.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};


