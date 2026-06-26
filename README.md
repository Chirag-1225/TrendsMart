# Trend's Mart - Beginner Friendly Full Stack E-Commerce Project

This version is formatted in a clean and beginner-friendly style.

## Features

- Login and register system
- Skip login option
- Product search and sorting
- Category pages: Men, Women, Kids, Accessories
- Product details page
- Size selection before adding to cart
- Wishlist page
- Cart and payment page
- Profile photo upload
- Account dashboard
- Order history
- Cancel order option
- Flask REST APIs
- SQLite database using SQLAlchemy

## How to Run

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Open in browser:

```txt
http://127.0.0.1:5000
```

## Add Images

Put images inside:

```txt
static/images/
```

Required image names:

```txt
hero-image.jpg
sale-image.jpg
for men.jpg
for women.jpg
for kids.jpg
for accessories.jpg
...
wallet.jpg
```

## Project Structure

```txt
Trend's Mart/
├── app.py
├── requirements.txt
├── README.md
├── templates/
│   ├── base.html
│   ├── start.html
│   ├── index.html
│   ├── shop.html
│   ├── category.html
│   ├── product.html
│   ├── wishlist.html
│   ├── cart.html
│   ├── payment.html
│   └── account.html
└── static/
    ├── css/
    │   ├── style.css
    │   ├── base.css
    │   ├── navbar.css
    │   ├── auth.css
    │   ├── home.css
    │   ├── products.css
    │   ├── cart-payment.css
    │   ├── account.css
    │   ├── footer.css
    │   └── responsive.css
    ├── js/
    │   └── main.js
    ├── images/
    └── uploads/
```
## ScreenShots
   1.Login Page
   2.SignUp Page
   3.Home Header 
   4.Home Middle
   5.Home Footer
   6.Shop page
   7.Men's Product Page
   8.Women Product Page
   9.Kid's Product Page
   10.Accessories Page
   11.Wishlist Page
   12.Product Page
   13.Cart Page
   14.Payment Page
   15.Account Page
