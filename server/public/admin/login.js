const params = new URLSearchParams(window.location.search);
const error = params.get('error');
const errorBox = document.getElementById('error');
if (error === 'invalid' && errorBox) {
    errorBox.textContent = 'Username or password incorrect.';
    errorBox.style.display = 'block';
}
const returnTo = params.get('returnTo');
const returnInput = document.getElementById('returnTo');
if (returnTo && returnInput) {
    returnInput.value = returnTo;
}
