const togglePasswordVisibility = (inputSelector, iconSelector) => {
  let passwordInput = $(inputSelector);
  let toggleIcon = $(iconSelector);

  if (passwordInput.attr("type") === "password") {
    passwordInput.attr("type", "text");
    toggleIcon.removeClass("fas fa-eye").addClass("fas fa-eye-slash");
  } else {
    passwordInput.attr("type", "password");
    toggleIcon.removeClass("fas fa-eye-slash").addClass("fas fa-eye");
  }
};

// custom.js

// 🔹 Fungsi SweetAlert Custom
const showSwal = (type, title, message, callback = null) => {
  Swal.fire({
    icon: type,
    title: title,
    text: message,
    showConfirmButton: true
  }).then((result) => {
    if (callback && result.isConfirmed) {
      callback();
    }
  });
};

// 🔹 Fungsi untuk Menampilkan Modal
const showModal = (modalId) => {
  let modal = new bootstrap.Modal(document.getElementById(modalId));
  modal.show();
};

// 🔹 Fungsi untuk Menutup Modal
const hideModal = (modalId) => {
  let modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
  modal.hide();
};

// 🔹 Fungsi untuk Memuat Data ke Modal (misalnya Edit)
const loadDataToModal = (url, modalId, callback) => {
  $.get(url, function (data) {
    if (!data) {
      showSwal("error", "Gagal", "Data tidak ditemukan!");
      return;
    }
    callback(data);
    showModal(modalId);
  }).fail(() => {
    showSwal("error", "Gagal", "Gagal mengambil data!");
  });
};

// 🔹 Fungsi untuk AJAX Request (CRUD)
const ajaxRequest = (url, method, formData, callback) => {
  $.ajax({
    url: url,
    enctype: "multipart/form-data",
    type: method,
    data: formData,
    processData: false,
    contentType: false,
    success: (response) => {
      if (response.success) {
        showSwal("success", "Sukses", response.message, () => {
          if (callback) callback();
        });
      } else {
        showSwal("error", "Error Boss" + response.message);
      }
    },
    error: (response) => {
      showSwal("error", "Gagal", "Terjadi kesalahan!" + response.message);
    }
  });
};

// 🔹 Fungsi untuk Konfirmasi Hapus
const confirmDelete = (url, callback) => {
  showSwal("warning", "Konfirmasi", "Apakah Anda yakin ingin menghapus ini?", () => {
    $.ajax({
      url: url,
      type: "DELETE",
      headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
      success: (response) => {
        if (response.success) {
          showSwal("success", "Terhapus", response.message, () => {
            if (callback) callback();
          });
        } else {
          showSwal("error", "Error", response.message);
        }
      },
      error: (error) => {
        showSwal("error", "Gagal", "Terjadi kesalahan saat menghapus data! " + error);
      }
    });
  });
};

function formatPhoneNumber(phone) {
  return phone.replace(/@.+$/, '').replace(/^62/, "0")
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);

  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', // Nama hari (Minggu, Senin, ...)
    day: '2-digit',  // Tanggal (01, 02, ...)
    month: 'long',   // Nama bulan (Januari, Februari, ...)
    year: 'numeric', // Tahun (2025, 2026, ...)
    timeZone: 'Asia/Jakarta' // Pastikan zona waktu Indonesia
  }).format(date);
}

function formatDate(tanggal) {
  const parsed = Date.parse(tanggal)
  if (isNaN(parsed)) {
    console.error('Tanggal tidak valid:', tanggal)
    return 'Tanggal tidak valid'
  }

  const date = new Date(parsed)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatTanggal(tanggalString) {
  const tanggal = new Date(tanggalString);
  if (isNaN(tanggal)) {
    console.error('Format tanggal tidak valid:', tanggalString);
    return 'Tanggal tidak valid';
  }

  const options = { day: '2-digit', month: 'long', year: 'numeric' };
  return tanggal.toLocaleDateString('id-ID', options);
}



