/* =========================
   Navbar Menu
========================= */
const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");

if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("active");

        menuBtn.querySelector("i").classList.toggle("fa-bars");
        menuBtn.querySelector("i").classList.toggle("fa-xmark");
    });
}


/* =========================
   Common Helper Functions
========================= */
function rupee(price) {
    return "₹" + Number(price).toLocaleString("en-IN");
}

function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

function getUser() {
    return JSON.parse(localStorage.getItem("user") || "null");
}

function updateCartCount() {
    const totalItems = getCart().reduce((sum, item) => sum + item.quantity, 0);

    document.querySelectorAll("#cart-count").forEach((element) => {
        element.textContent = totalItems;
    });
}

function showToast(message) {
    const toast = document.createElement("div");

    toast.textContent = message;

    toast.style.cssText = `
        position: fixed;
        right: 20px;
        bottom: 20px;
        background: linear-gradient(90deg, #ff4b2b, #ee0979);
        color: #ffffff;
        padding: 12px 18px;
        border-radius: 14px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 9999;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 1800);
}

function requireLogin() {
    if (!getUser()) {
        showToast("Please login first");

        setTimeout(() => {
            location.href = "/";
        }, 650);

        return false;
    }

    return true;
}


/* =========================
   Products
========================= */
let allProducts = [];

async function loadProducts(category = null, limit = null) {
    const productGrid = document.getElementById("product-grid");

    if (!productGrid) {
        return;
    }

    let url = "/api/products";

    if (category) {
        url += `?category=${category}`;
    }

    const response = await fetch(url);
    allProducts = await response.json();

    const productsToShow = limit ? allProducts.slice(0, limit) : allProducts;
    renderProducts(productsToShow);
}

function stockText(product) {
    if (product.stock <= 0) {
        return `<span class="stock out">Out of Stock</span>`;
    }

    if (product.stock <= 3) {
        return `<span class="stock low">Only ${product.stock} left</span>`;
    }

    return `<span class="stock">In Stock</span>`;
}

function renderProducts(products) {
    const productGrid = document.getElementById("product-grid");

    if (!productGrid) {
        return;
    }

    productGrid.innerHTML = products.map((product) => {
        return `
            <div class="product-card">

                <a href="/product/${product.id}">
                    <img
                        class="product-img"
                        src="/static/images/${product.image}"
                        alt="${product.name}"
                    >
                </a>

                <div class="product-info">

                    <h3>
                        <a href="/product/${product.id}">
                            ${product.name}
                        </a>
                    </h3>

                    <div class="rating">★ ${product.rating}</div>

                    <p class="price">${rupee(product.price)}</p>

                    ${stockText(product)}

                    <div class="card-actions" style="margin-top:14px;">

                        <a
                            class="add-to-cart"
                            href="/product/${product.id}"
                            style="text-align:center;"
                        >
                            View Details
                        </a>

                        <button
                            class="icon-btn"
                            onclick="toggleWishlist(${product.id})"
                        >
                            <i class="fa-regular fa-heart"></i>
                        </button>

                    </div>

                </div>

            </div>
        `;
    }).join("");
}

function setupSearch() {
    const searchInput = document.getElementById("search-input");
    const sortSelect = document.getElementById("sort-select");

    if (!searchInput && !sortSelect) {
        return;
    }

    function applyFilterAndSort() {
        let filteredProducts = [...allProducts];
        const searchValue = (searchInput?.value || "").toLowerCase().trim();

        if (searchValue) {
            filteredProducts = filteredProducts.filter((product) => {
                return (
                    product.name.toLowerCase().includes(searchValue) ||
                    product.category.toLowerCase().includes(searchValue)
                );
            });
        }

        const sortValue = sortSelect?.value;

        if (sortValue === "low") {
            filteredProducts.sort((a, b) => a.price - b.price);
        }

        if (sortValue === "high") {
            filteredProducts.sort((a, b) => b.price - a.price);
        }

        if (sortValue === "rating") {
            filteredProducts.sort((a, b) => b.rating - a.rating);
        }

        if (sortValue === "newest") {
            filteredProducts.sort((a, b) => b.id - a.id);
        }

        renderProducts(filteredProducts);
    }

    if (searchInput) {
        searchInput.addEventListener("input", applyFilterAndSort);
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", applyFilterAndSort);
    }
}


/* =========================
   Cart
========================= */
function addToCart(product, size = null) {
    const selectedSize = size || product.size || "N/A";
    const cart = getCart();

    const existingItem = cart.find((item) => {
        return item.id === product.id && item.size === selectedSize;
    });

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            size: selectedSize,
            quantity: 1,
        });
    }

    saveCart(cart);
    showToast(`${product.name} (${selectedSize}) added to cart`);
}

function addDetailToCart(product) {
    const selectedSizeButton = document.querySelector(".size-option.selected");

    if (!selectedSizeButton) {
        showToast("Please select size first");
        return;
    }

    addToCart(product, selectedSizeButton.dataset.size);
}

function renderCart() {
    const cartItemsBox = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");

    if (!cartItemsBox || !cartTotal) {
        return;
    }

    const cart = getCart();
    let total = 0;

    cartItemsBox.innerHTML = "";

    if (cart.length === 0) {
        cartItemsBox.innerHTML = `
            <p style="text-align:center; color:#6b7280; padding:25px;">
                Your cart is empty!
            </p>
        `;

        cartTotal.textContent = "Total: ₹0";
        return;
    }

    cart.forEach((item, index) => {
        total += item.price * item.quantity;

        cartItemsBox.innerHTML += `
            <div class="cart-item">

                <img src="/static/images/${item.image}" alt="${item.name}">

                <div>
                    <h3>${item.name}</h3>
                    <p class="price">${rupee(item.price)}</p>
                    <p><b>Size:</b> ${item.size || "N/A"}</p>
                </div>

                <div class="qty">
                    <button onclick="changeQuantity(${index}, -1)">−</button>
                    <strong>${item.quantity}</strong>
                    <button onclick="changeQuantity(${index}, 1)">+</button>
                </div>

                <button
                    class="remove-btn"
                    onclick="removeFromCart(${index})"
                >
                    Remove
                </button>

            </div>
        `;
    });

    cartTotal.textContent = `Total: ${rupee(total)}`;
}

function changeQuantity(index, change) {
    const cart = getCart();

    cart[index].quantity += change;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    saveCart(cart);
    renderCart();
}

function removeFromCart(index) {
    const cart = getCart();

    cart.splice(index, 1);

    saveCart(cart);
    renderCart();
}

function goPayment() {
    if (!requireLogin()) {
        return;
    }

    if (getCart().length === 0) {
        showToast("Cart is empty");
        return;
    }

    location.href = "/payment";
}


/* =========================
   Wishlist
========================= */
async function toggleWishlist(productId) {
    if (!requireLogin()) {
        return;
    }

    const response = await fetch("/api/wishlist/toggle", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id: productId }),
    });

    const result = await response.json();

    showToast(result.message);
    loadWishlist();
}

async function loadWishlist() {
    const wishlistBox = document.getElementById("wishlist-grid");

    if (!wishlistBox) {
        return;
    }

    const response = await fetch("/api/wishlist");
    const result = await response.json();

    if (!result.success) {
        wishlistBox.innerHTML = "<p>Please login to view wishlist.</p>";
        return;
    }

    if (result.items.length === 0) {
        wishlistBox.innerHTML = "<p>Your wishlist is empty.</p>";
        return;
    }

    wishlistBox.innerHTML = result.items.map((product) => {
        return `
            <div class="product-card">

                <a href="/product/${product.id}">
                    <img
                        class="product-img"
                        src="/static/images/${product.image}"
                        alt="${product.name}"
                    >
                </a>

                <div class="product-info">

                    <h3>${product.name}</h3>
                    <p class="price">${rupee(product.price)}</p>

                    <div class="card-actions">

                        <a
                            class="add-to-cart"
                            href="/product/${product.id}"
                            style="text-align:center;"
                        >
                            View Details
                        </a>

                        <button
                            class="icon-btn"
                            onclick="toggleWishlist(${product.id})"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>

                </div>

            </div>
        `;
    }).join("");
}


/* =========================
   Product Details
========================= */
async function loadProductDetail() {
    const detailBox = document.getElementById("product-detail");

    if (!detailBox) {
        return;
    }

    const productId = detailBox.dataset.id;
    const response = await fetch(`/api/products/${productId}`);
    const product = await response.json();

    const productString = JSON.stringify(product).replaceAll("'", "&apos;");

    detailBox.innerHTML = `
        <div class="detail-image">
            <img
                src="/static/images/${product.image}"
                alt="${product.name}"
                style="height:100%;"
            >
        </div>

        <div class="detail-card detail-info">

            <h1>${product.name}</h1>

            <div class="rating">
                ★ ${product.rating} | 128 Reviews
            </div>

            <h2 class="price">${rupee(product.price)}</h2>

            <p class="muted" style="line-height:1.8;">
                ${product.description}
            </p>

            ${stockText(product)}

            <h3 style="margin-top:20px;">
                Select Size <span style="color:#dc2626;">*</span>
            </h3>

            <div class="size-row">
                <button class="size-option" data-size="S">S</button>
                <button class="size-option" data-size="M">M</button>
                <button class="size-option" data-size="L">L</button>
                <button class="size-option" data-size="XL">XL</button>
            </div>

            <button
                class="btn"
                onclick='addDetailToCart(${productString})'
                style="width:100%; margin-top:10px;"
            >
                Add to Cart
            </button>

            <button
                class="btn btn-outline"
                onclick="toggleWishlist(${product.id})"
                style="width:100%; margin-top:10px;"
            >
                Add to Wishlist
            </button>

            <div class="review-box">
                <h3>Customer Reviews</h3>
                <p>⭐️⭐️⭐️⭐️⭐️ Great quality product and fast delivery.</p>
                <p>⭐️⭐️⭐️⭐️ Very comfortable and stylish.</p>
            </div>

        </div>
    `;

    document.querySelectorAll(".size-option").forEach((button) => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".size-option").forEach((item) => {
                item.classList.remove("selected");
            });

            button.classList.add("selected");
        });
    });
}


/* =========================
   Payment
========================= */
function renderPayment() {
    const paymentSummary = document.getElementById("payment-summary");
    const paymentTotal = document.getElementById("payment-total");

    if (!paymentSummary) {
        return;
    }

    const cart = getCart();
    let total = 0;

    if (cart.length === 0) {
        paymentSummary.innerHTML = "<p>Your cart is empty.</p>";
        return;
    }

    paymentSummary.innerHTML = cart.map((item) => {
        total += item.price * item.quantity;

        return `
            <div class="summary-item">
                <span>
                    ${item.name} (${item.size || "N/A"}) × ${item.quantity}
                </span>
                <strong>${rupee(item.price * item.quantity)}</strong>
            </div>
        `;
    }).join("");

    paymentTotal.textContent = rupee(total);

    const user = getUser() || {};

    const fields = ["pay-name", "pay-email", "pay-phone", "pay-address"];

    fields.forEach((id) => {
        const element = document.getElementById(id);

        if (!element) {
            return;
        }

        if (id === "pay-name") {
            element.value = user.name || "";
        }

        if (id === "pay-email") {
            element.value = user.email || "";
        }

        if (id === "pay-phone") {
            element.value = user.phone || "";
        }

        if (id === "pay-address") {
            element.value = user.address || "";
        }
    });
}

const paymentForm = document.getElementById("payment-form");

if (paymentForm) {
    paymentForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const orderData = {
            name: document.getElementById("pay-name").value,
            email: document.getElementById("pay-email").value,
            phone: document.getElementById("pay-phone").value,
            address: document.getElementById("pay-address").value,
            payment: document.getElementById("pay-method").value,
            items: getCart(),
        };

        const response = await fetch("/api/order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
        });

        const result = await response.json();

        showToast(result.message);

        if (result.success) {
            localStorage.removeItem("cart");
            updateCartCount();

            setTimeout(() => {
                location.href = "/account";
            }, 1000);
        }
    });
}


/* =========================
   Login and Register
========================= */
function setupAuth() {
    const loginTab = document.getElementById("login-tab");
    const registerTab = document.getElementById("register-tab");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (!loginTab) {
        return;
    }

    loginTab.onclick = () => {
        loginTab.classList.add("active");
        registerTab.classList.remove("active");

        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
    };

    registerTab.onclick = () => {
        registerTab.classList.add("active");
        loginTab.classList.remove("active");

        registerForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
    };

    registerForm.onsubmit = async (event) => {
        event.preventDefault();

        const userData = {
            name: document.getElementById("reg-name").value,
            email: document.getElementById("reg-email").value,
            phone: document.getElementById("reg-phone").value,
            address: document.getElementById("reg-address").value,
            password: document.getElementById("reg-password").value,
        };

        const response = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        });

        const result = await response.json();

        showToast(result.message);

        if (result.success) {
            localStorage.setItem("user", JSON.stringify(result.user));

            setTimeout(() => {
                location.href = "/home";
            }, 800);
        }
    };

    loginForm.onsubmit = async (event) => {
        event.preventDefault();

        const loginData = {
            email: document.getElementById("login-email").value,
            password: document.getElementById("login-password").value,
        };

        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(loginData),
        });

        const result = await response.json();

        showToast(result.message);

        if (result.success) {
            localStorage.setItem("user", JSON.stringify(result.user));

            setTimeout(() => {
                location.href = "/home";
            }, 800);
        }
    };
}


/* =========================
   Account Page
========================= */
async function loadAccount() {
    const profileBox = document.getElementById("profile-data");

    if (!profileBox) {
        return;
    }

    const response = await fetch("/api/me");
    const result = await response.json();

    if (!result.logged_in) {
        profileBox.innerHTML = "<p>Please login to see your account details.</p>";
        return;
    }

    localStorage.setItem("user", JSON.stringify(result.user));

    const profileImage = result.user.profile_photo || "default-user.png";
    document.getElementById("profile-img").src = "/static/uploads/" + profileImage;

    profileBox.innerHTML = `
        <p><b>Name:</b> ${result.user.name}</p>
        <p><b>Email:</b> ${result.user.email}</p>
        <p><b>Phone:</b> ${result.user.phone || "Not added"}</p>
        <p><b>Address:</b> ${result.user.address || "Not added"}</p>
    `;

    const ordersBox = document.getElementById("orders-list");

    if (result.orders.length === 0) {
        ordersBox.innerHTML = "<p>No orders yet.</p>";
        return;
    }

    ordersBox.innerHTML = result.orders.map((order) => {
        const cancelButton = `
            <button
                class="remove-btn"
                onclick="cancelOrder(${order.id})"
            >
                Cancel Order
            </button>
        `;

        const cancelledText = `
            <p style="color:#dc2626; font-weight:700;">
                Order Cancelled
            </p>
        `;

        return `
            <div class="order-card">
                <b>Order #${order.id}</b>
                <p>Total: ${rupee(order.total)}</p>
                <p>Status: ${order.status}</p>
                <p>Payment: ${order.payment}</p>
                <p>Date: ${order.created_at}</p>
                ${order.status !== "Cancelled" ? cancelButton : cancelledText}
            </div>
        `;
    }).join("");
}

async function cancelOrder(orderId) {
    const confirmCancel = confirm(`Cancel Order #${orderId}?`);

    if (!confirmCancel) {
        return;
    }

    const response = await fetch(`/api/order/${orderId}/cancel`, {
        method: "POST",
    });

    const result = await response.json();

    showToast(result.message);

    if (result.success) {
        loadAccount();
    }
}

const photoForm = document.getElementById("photo-form");

if (photoForm) {
    photoForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData();
        const profilePhoto = document.getElementById("profile-photo").files[0];

        formData.append("photo", profilePhoto);

        const response = await fetch("/api/profile-photo", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        showToast(result.message);

        if (result.success) {
            loadAccount();
        }
    });
}

async function logout() {
    await fetch("/api/logout", {
        method: "POST",
    });

    localStorage.removeItem("user");
    localStorage.removeItem("cart");

    location.href = "/";
}


/* =========================
   Run Functions After Page Load
========================= */
document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();

    setupAuth();
    setupSearch();

    renderCart();
    renderPayment();

    loadAccount();
    loadWishlist();
    loadProductDetail();

    const productGrid = document.getElementById("product-grid");

    if (productGrid) {
        const category = productGrid.dataset.category || null;
        const limit = productGrid.dataset.limit
            ? Number(productGrid.dataset.limit)
            : null;

        loadProducts(category, limit).then(setupSearch);
    }
});
