
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

function formatDateToInput(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// 💬 SweetAlert Wrapper
const showSwal = (type, title, message, callback = null, redirectUrl = null, hash = null) => {
  Swal.fire({
    icon: type,
    title: title,
    text: message,
    position: 'center',
    showConfirmButton: true,
  }).then((result) => {
    if (callback && result.isConfirmed) callback();
    setTimeout(() => (redirectUrl ? window.location.href = redirectUrl : null), 1000);
  });
};
// 🔄 AJAX Request (dengan showSwal & optional callback)
const ajaxRequest = (url, method, formData = null, callback = null) => {
  const isFormData = formData instanceof FormData;
  const hasFormData = formData !== null && formData !== undefined;

  const ajaxOptions = {
    url: url,
    type: method,
    headers: {
      "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
      Accept: "application/json",
    },
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
  };

  // Tambahkan data hanya jika formData tersedia
  if (hasFormData) {
    ajaxOptions.data = isFormData ? formData : JSON.stringify(formData);
    ajaxOptions.processData = !isFormData;
    ajaxOptions.contentType = isFormData ? false : "application/json";
  }

  $.ajax(ajaxOptions);
};


const ajaxCall = (url, method, data, successCallback, errorCallback) => {
  $.ajax({
    type: method,
    enctype: "multipart/form-data",
    url,
    cache: false,
    data,
    contentType: false,
    processData: false,
    headers: {
      Accept: "application/json",
      "X-CSRF-TOKEN": $("meta[name='csrf-token']").attr("content"),
    },
    dataType: "json",
    success: function (response) {
      successCallback(response);
    },
    error: function (error) {
      errorCallback(error);
    },
  });
};

const handleSuccess = (
  response,
  dataTableId = null,
  modalId = null,
  redirect = null
) => {
  if (dataTableId !== null) {
    swal({
      title: "Berhasil",
      icon: "success",
      text: response.message,
      timer: 2000,
      buttons: false,
    });
    $(`#${dataTableId}`).DataTable().ajax.reload();
  }

  if (modalId !== null) {
    $(`#${modalId}`).modal("hide");
  }

  if (redirect) {
    swal({
      title: "Berhasil",
      icon: "success",
      text: response.message,
      timer: 2000,
      buttons: false,
    }).then(function () {
      window.location.href = redirect;
    });
  }

  if (redirect == "no") {
    swal({
      title: "Berhasil",
      icon: "success",
      text: response.message,
      timer: 2000,
      buttons: false,
    });
  }
};

const handleValidationErrors = (error, formId = null, fields = null) => {
  if (error.responseJSON.data && fields) {
    fields.forEach((field) => {
      if (error.responseJSON.data[field]) {
        $(`#${formId} #${field}`).addClass("is-invalid");
        $(`#${formId} #error${field}`).html(
          error.responseJSON.data[field][0]
        );
      } else {
        $(`#${formId} #${field}`).removeClass("is-invalid");
        $(`#${formId} #error${field}`).html("");
      }
    });
  } else {
    swal({
      title: "Gagal",
      icon: "error",
      text: error.responseJSON.message || error,
      timer: 2000,
      buttons: false,
    });
  }
};

const handleSimpleError = (error) => {
  swal({
    title: "Gagal",
    icon: "error",
    text: error,
    timer: 2000,
    buttons: false,
  });
};

const select2ToJson = (selector, url, modal = null, jenis = "null") => {
  const selectElem = $(selector);

  if (selectElem.children().length > 0) {
    return;
  }

  const successCallback = function (response) {
    const emptyOption = $("<option></option>");
    emptyOption.attr("value", "");
    emptyOption.text("-- Pilih Data --");
    selectElem.append(emptyOption);

    const responseList = response.data;
    console.log(responseList)

    responseList.forEach(function (row) {
      const option = $("<option></option>");
      option.attr("value", row.id);
      const label = row.nama ? row.nama : row.judul;
      option.text(label);
      selectElem.append(option);
    });
  };

  const errorCallback = function (error) {
    console.log(error);
  };

  ajaxCall(url, "GET", null, successCallback, errorCallback);
};

function select2(selector, url) {
  const selectElem = $(selector);

  if (selectElem.children().length > 0) {
    return;
  }

  const emptyOption = $("<option></option>");
  emptyOption.attr("value", "");
  emptyOption.text("-- Pilih Data --");
  selectElem.append(emptyOption);

  const responseList = response.data;
  responseList.forEach(function (row) {
    const option = $("<option></option>");
    option.attr("value", row.id);
    const label = row.nama ? row.nama : row.judul;
    option.text(label);
    selectElem.append(option);
  });

  selectElem.select2({});


}

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

    ajaxRequest(url, "DELETE", null, () => {
      showSwal("success", "Terhapus!", "Data berhasil dihapus!", callback);
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


