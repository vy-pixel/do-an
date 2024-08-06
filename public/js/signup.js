const switchPwdElement = document.querySelectorAll(
  "#switch__password"
);

switchPwdElement.forEach((switchPwd) => {
  switchPwd.addEventListener("click", function () {
    const passwordFields =
      document.querySelectorAll(".password");

    passwordFields.forEach((item) => {
      if (item.type === "password") {
        item.setAttribute("type", "text");
        switchPwdElement.forEach((switchPwdElement) => {
          switchPwdElement.textContent = "visibility";
        });
      } else {
        item.setAttribute("type", "password");
        switchPwdElement.forEach((switchPwdElement) => {
          switchPwdElement.textContent = "visibility_off";
        });
      }
    });
  });
});

document
  .getElementById("signupForm")
  .addEventListener("submit", function (event) {
    if (!validateForm()) {
      event.preventDefault();
    }
  });

function validateForm() {
  var email = document.getElementById("email").value;
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  var passwordConfirm = document.getElementById(
    "passwordConfirm"
  ).value;
  console.log("2");
  if (
    email === "" ||
    username === "" ||
    password === "" ||
    passwordConfirm === ""
  ) {
    alert("Vui lòng điền đầy đủ thông tin.");
    return false;
  }

  if (password !== passwordConfirm) {
    alert("Mật khẩu và xác thực mật khẩu không khớp.");
    return false;
  }

  return true;
}
