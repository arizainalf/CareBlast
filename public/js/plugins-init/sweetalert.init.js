"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const wrongBtn = document.querySelector(".sweet-wrong");
    if (wrongBtn) {
        wrongBtn.onclick = function () {
            Swal.fire("Oops...", "Something went wrong !!", "error");
        };
    }

    const messageBtn = document.querySelector(".sweet-message");
    if (messageBtn) {
        messageBtn.onclick = function () {
            Swal.fire("Hey, Here's a message !!");
        };
    }

    const textBtn = document.querySelector(".sweet-text");
    if (textBtn) {
        textBtn.onclick = function () {
            Swal.fire("Hey, Here's a message !!", "It's pretty, isn't it?");
        };
    }

    const successBtn = document.querySelector(".sweet-success");
    if (successBtn) {
        successBtn.onclick = function () {
            Swal.fire("Hey, Good job !!", "You clicked the button !!", "success");
        };
    }

    const confirmBtn = document.querySelector(".sweet-confirm");
    if (confirmBtn) {
        confirmBtn.onclick = function () {
            Swal.fire({
                title: "Are you sure to delete?",
                text: "You will not be able to recover this imaginary file !!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it !!",
                cancelButtonText: "Cancel",
                showLoaderOnConfirm: true,
                preConfirm: () => {
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            Swal.fire("Deleted !!", "Hey, your imaginary file has been deleted !!", "success");
                            resolve();
                        }, 1000);
                    });
                }
            });
        };
    }
});
