let applyBtn = document.querySelector('#apply-discount-btn');
let discountCodeError = document.querySelector('#discount-code-error');
let discountLabel = document.querySelector('#discount-label')
let discountCodeLabelValue = document.querySelector('#discount-title');
let discountCodePrice = document.querySelector('.applied-discount-code-price')
let discountFinalPrice = document.querySelector('#discounted-price')
let discountCodeInput = document.querySelector('#discount-code-input');
let totalCartSelector = document.querySelector('#total-price'); // Total Cart Selector to update the total amount.
let authorization_token;


let checkoutContainer = document.createElement('div');
document.body.appendChild(checkoutContainer);
if (localStorage.discountCode) applyDiscount(JSON.parse(localStorage.discountCode).code);
applyBtn.addEventListener('click', function (e) {
  e.preventDefault();
  applyDiscount(discountCodeInput.value);
});

function resetDicountInput () {
    discountCodeInput.value = ""
}

function clearDiscount() {
    discountLabel.classList.add ('disp-none')
    discountFinalPrice.classList.add ('disp-none')
    discountCodePrice.classList.add ('disp-none')
    totalCartSelector.classList.remove ('disp-none')
    totalCartSelector.textContent = JSON.parse(localStorage.discountCode).totalCart + ' ' + Shopify.currency.active;
    resetDicountInput();
    clearLocalStorage();
}
function clearLocalStorage() {
  localStorage.removeItem('discountCode');
}
function applyDiscount(code) {
  applyBtn.innerHTML = "<div class='loader'></div>";
  applyBtn.style.pointerEvents = 'none';
  fetch('/payments/config', { method: 'GET' })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      const checkout_json_url = '/wallets/checkouts/';
      authorization_token = btoa(data.paymentInstruments.accessToken);
      fetch('/cart.js', {})
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          let body = {
            checkout: { discount_code: code, line_items: data.items, presentment_currency: Shopify.currency.active },
          };
          fetch(checkout_json_url, {
            headers: {
              accept: '*/*',
              'cache-control': 'no-cache',
              authorization: 'Basic ' + authorization_token,
              'content-type': 'application/json, text/javascript',
              pragma: 'no-cache',
              'sec-fetch-dest': 'empty',
              'sec-fetch-mode': 'cors',
              'sec-fetch-site': 'same-origin',
            },
            referrerPolicy: 'strict-origin-when-cross-origin',
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify(body),
          })
            .then(function (response) {
              return response.json();
            })
            .then(function (data) {
              console.log(data.checkout);
              // check this when the discount code is wrong
              if (data.checkout && data.checkout.applied_discounts.length > 0) {
                let discountApplyUrl = '/discount/' + code + '?v=' + Date.now() + '&redirect=/checkout/';
                fetch(discountApplyUrl, {}).then(function (response) {
                  return response.text();
                });
                totalCartSelector.classList.add('disp-none')
                discountLabel.classList.remove ('disp-none')
                discountCodeError.textContent = '';
                discountCodePrice.classList.remove ('disp-none')
                discountCodePrice.textContent = ' -' + data.checkout.applied_discounts[0].amount + ' ' + Shopify.currency.active;
                discountFinalPrice.classList.remove ('disp-none')
                discountFinalPrice.textContent = data.checkout.total_price + ' ' + Shopify.currency.active;
                discountCodeLabelValue.textContent = data.checkout.applied_discounts[0].title 

                let localStorageValue = {
                  code: code.trim(),
                  totalCartDisount: data.checkout.total_price,
                  totalCart: data.checkout.total_line_items_price,
                };
                localStorage.setItem('discountCode', JSON.stringify(localStorageValue));
                resetDicountInput ()
            } else {
                discountCodeError.textContent = 'This code does not exist or cannot be applied to the selected products.';
                clearDiscount();
              }
            })
            .finally(function (params) {
              applyBtn.textContent = 'Apply';
              applyBtn.style.pointerEvents = 'all';
            });
        });
    });
}