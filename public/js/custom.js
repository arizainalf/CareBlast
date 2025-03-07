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
