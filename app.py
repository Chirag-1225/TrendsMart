from datetime import datetime
import os

from flask import Flask, jsonify, render_template, request, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename


# --------------------------------------------------
# Flask App Configuration
# --------------------------------------------------
app = Flask(__name__)

app.config["SECRET_KEY"] = "trendamart-secret-key"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///trendamart.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = os.path.join("static", "uploads")

# Database and CORS setup
db = SQLAlchemy(app)
CORS(app)


# --------------------------------------------------
# Database Models
# --------------------------------------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    profile_photo = db.Column(db.String(255), default="default-user.png")

    password = db.Column(db.String(255), nullable=False)


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Integer, nullable=False)
    image = db.Column(db.String(255), nullable=False)

    description = db.Column(db.Text)
    rating = db.Column(db.Float, default=4.5)
    stock = db.Column(db.Integer, default=10)


class Wishlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_email = db.Column(db.String(150), nullable=False)
    product_id = db.Column(db.Integer, nullable=False)


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_email = db.Column(db.String(150), nullable=False)
    customer_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.Text, nullable=False)
    payment = db.Column(db.String(50), nullable=False)
    total = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(50), default="Order Confirmed")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False)
    product_id = db.Column(db.Integer, nullable=False)
    product_name = db.Column(db.String(150), nullable=False)
    size = db.Column(db.String(10), default="N/A")
    price = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)


# --------------------------------------------------
# Sample Product Data
# --------------------------------------------------
PRODUCTS = [
    (1, "T-shirt", "men", 799, "MenTshirt.webp", "Comfortable cotton t-shirt for daily wear.", 4.4, 14),
    (2, "Casual Shoes", "men", 1599, "MenCasualShoes.jpg", "Stylish casual shoes for college and outings.", 4.6, 8),
    (3, "Leather Shoes", "men", 2499, "MenLeatherShoes.webp", "Premium leather shoes with modern comfort.", 4.5, 5),
    (4, "Warm-Coat", "men", 3499, "MenWarmcoat.jpg", "Warm coat for winter fashion.", 4.7, 3),
    (5, "Leather-Jacket", "men", 2999, "MenLeatherJacket.jpg", "Trendy leather jacket for a bold look.", 4.8, 6),
    (6, "Running Shoes", "men", 1899, "MenRunningShoes.avif", "Lightweight running shoes for daily fitness.", 4.3, 10),
    (7, "Classic Watch", "men", 2199, "MenWatch.jpg", "Classic watch for formal and casual use.", 4.5, 9),
    (8, "Winter Jacket", "men", 2699, "Mwinterjac.jpg", "Comfortable jacket for winter season.", 4.2, 7),

    (9, "Premium Dress", "women", 1299, "WomenDress.jpg", "Elegant summer dress with breathable fabric.", 4.6, 12),
    (10, "Leather HandBag", "women", 1799, "WomenHandbag.avif", "Stylish handbag for everyday use.", 4.5, 11),
    (11, "Handbag Deluxe", "women", 2299, "WomenPremiumHanbag.jpg", "Premium handbag with modern finish.", 4.7, 4),
    (12, "Women's Shoes", "women", 1599, "WomenShoes.jpg", "Comfortable and stylish shoes for women.", 4.4, 9),
    (13, "Black Handbag", "women", 2499, "WomenBlackHandbag.jpg", "Black handbag for premium styling.", 4.5, 6),
    (14, "Grey Coat", "women", 2899, "WomenGreyCoat.jpg", "Fashionable grey coat for winter.", 4.3, 5),
    (15, "Short Bag", "women", 999, "WomenCompactbag.jpg", "Compact bag for casual outings.", 4.2, 15),
    (16, "Designer Coat", "women", 3199, "WomenDesignerCoat.jpg", "Designer coat with elegant look.", 4.8, 2),

    (17, "Kids T-Shirt", "kids", 499, "KidsTshirt.webp", "Soft cotton t-shirt for kids.", 4.3, 20),
    (18, "Kids Hoodie", "kids", 899, "KidsHoddie.jpg", "Warm hoodie for kids.", 4.5, 13),
    (19, "Kids Shoes", "kids", 1199, "KidsShoes.jpg", "Comfortable shoes for kids.", 4.4, 8),
    (20, "School Bag", "kids", 999, "kidsShoolbag.jpg", "Durable school bag with spacious design.", 4.2, 10),
    (21, "Kids Watch", "kids", 699, "KidsWatches.jpg", "Colorful watch for kids.", 4.1, 7),
    (22, "Kids Jacket", "kids", 1299, "Kidsjac.jpg", "Winter jacket for kids.", 4.5, 6),

    (23, "Classic Watch", "accessories", 2199, "MenWatch.jpg", "Classic wrist watch for all occasions.", 4.5, 9),
    (24, "Bracelet", "accessories", 499, "Bracelet.jpg", "Stylish bracelet for daily fashion.", 4.2, 18),
    (25, "Premium Perfume", "accessories", 1499, "Perfume.jpg", "Preminum Perfume with good Fragrance.", 4.4, 12),
    (26, "Umbrella", "accessories", 599, "Umbrella.jpg", "Compact umbrella for all weather.", 4.1, 16),
    (27, "Wallet", "accessories", 799, "wallet.jpg", "Premium wallet with multiple compartments.", 4.3, 10),
]


# --------------------------------------------------
# Helper Functions
# --------------------------------------------------
def seed_products():
    """Insert sample products only once."""
    if Product.query.count() != 0:
        return

    for product in PRODUCTS:
        product_id, name, category, price, image, description, rating, stock = product

        db.session.add(
            Product(
                id=product_id,
                name=name,
                category=category,
                price=price,
                image=image,
                description=description,
                rating=rating,
                stock=stock,
            )
        )

    db.session.commit()


def product_json(product):
    """Convert Product object into JSON-friendly dictionary."""
    return {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "price": product.price,
        "image": product.image,
        "description": product.description,
        "rating": product.rating,
        "stock": product.stock,
    }


def get_logged_in_email():
    """Return logged-in user email from session."""
    return session.get("user_email")


# --------------------------------------------------
# Page Routes
# --------------------------------------------------
@app.route("/")
def start():
    return render_template("start.html")


@app.route("/home")
def home():
    return render_template("index.html")


@app.route("/shop")
def shop():
    return render_template("shop.html")


@app.route("/product/<int:product_id>")
def product_detail(product_id):
    return render_template("product.html", product_id=product_id)


@app.route("/wishlist")
def wishlist_page():
    return render_template("wishlist.html")


@app.route("/men")
def men():
    return render_template("category.html", title="Men's Wear", category="men")


@app.route("/women")
def women():
    return render_template("category.html", title="Women's Wear", category="women")


@app.route("/kids")
def kids():
    return render_template("category.html", title="Kids Wear", category="kids")


@app.route("/accessories")
def accessories():
    return render_template("category.html", title="Accessories", category="accessories")


@app.route("/cart")
def cart():
    return render_template("cart.html")


@app.route("/payment")
def payment():
    return render_template("payment.html")


@app.route("/account")
def account():
    return render_template("account.html")


# --------------------------------------------------
# Product APIs
# --------------------------------------------------
@app.route("/api/products")
def get_products():
    category = request.args.get("category")
    search = request.args.get("search", "").strip().lower()

    query = Product.query

    if category:
        query = query.filter_by(category=category)

    products = query.all()

    if search:
        products = [
            product
            for product in products
            if search in product.name.lower() or search in product.category.lower()
        ]

    return jsonify([product_json(product) for product in products])


@app.route("/api/products/<int:product_id>")
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify(product_json(product))


# --------------------------------------------------
# Authentication APIs
# --------------------------------------------------
@app.route("/api/register", methods=["POST"])
def register():
    data = request.json

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"success": False, "message": "Name, email and password required"}), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({"success": False, "message": "Email already registered"}), 409

    user = User(
        name=name,
        email=email,
        phone=data.get("phone"),
        address=data.get("address"),
        password=generate_password_hash(password),
    )

    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.id
    session["user_email"] = user.email

    return jsonify(
        {
            "success": True,
            "message": "Registered successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "address": user.address,
                "profile_photo": user.profile_photo,
            },
        }
    )


@app.route("/api/login", methods=["POST"])
def login():
    data = request.json

    user = User.query.filter_by(email=data.get("email")).first()

    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    if not check_password_hash(user.password, data.get("password")):
        return jsonify({"success": False, "message": "Invalid password"}), 401

    session["user_id"] = user.id
    session["user_email"] = user.email

    return jsonify(
        {
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "address": user.address,
                "profile_photo": user.profile_photo,
            },
        }
    )


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully"})


# --------------------------------------------------
# User Account APIs
# --------------------------------------------------
@app.route("/api/me")
def me():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"logged_in": False})

    user = User.query.get(user_id)

    if not user:
        return jsonify({"logged_in": False})

    orders = (
        Order.query.filter_by(user_email=user.email)
        .order_by(Order.created_at.desc())
        .all()
    )

    return jsonify(
        {
            "logged_in": True,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "address": user.address,
                "profile_photo": user.profile_photo,
            },
            "orders": [
                {
                    "id": order.id,
                    "total": order.total,
                    "payment": order.payment,
                    "status": order.status,
                    "created_at": order.created_at.strftime("%d-%m-%Y %H:%M"),
                }
                for order in orders
            ],
        }
    )


@app.route("/api/profile-photo", methods=["POST"])
def upload_profile_photo():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"success": False, "message": "Please login first"}), 401

    if "photo" not in request.files:
        return jsonify({"success": False, "message": "No file uploaded"}), 400

    photo = request.files["photo"]

    if photo.filename == "":
        return jsonify({"success": False, "message": "No selected file"}), 400

    filename = f"user_{user_id}_{secure_filename(photo.filename)}"

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    photo.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))

    user = User.query.get(user_id)
    user.profile_photo = filename
    db.session.commit()

    return jsonify(
        {
            "success": True,
            "message": "Profile photo updated",
            "profile_photo": filename,
        }
    )


# --------------------------------------------------
# Wishlist APIs
# --------------------------------------------------
@app.route("/api/wishlist")
def get_wishlist():
    email = get_logged_in_email()

    if not email:
        return jsonify({"success": False, "message": "Please login first", "items": []}), 401

    product_ids = [
        item.product_id
        for item in Wishlist.query.filter_by(user_email=email).all()
    ]

    products = Product.query.filter(Product.id.in_(product_ids)).all() if product_ids else []

    return jsonify(
        {
            "success": True,
            "items": [product_json(product) for product in products],
        }
    )


@app.route("/api/wishlist/toggle", methods=["POST"])
def toggle_wishlist():
    email = get_logged_in_email()

    if not email:
        return jsonify({"success": False, "message": "Please login first"}), 401

    product_id = request.json.get("product_id")

    existing_item = Wishlist.query.filter_by(
        user_email=email,
        product_id=product_id,
    ).first()

    if existing_item:
        db.session.delete(existing_item)
        db.session.commit()
        return jsonify({"success": True, "message": "Removed from wishlist", "added": False})

    db.session.add(Wishlist(user_email=email, product_id=product_id))
    db.session.commit()

    return jsonify({"success": True, "message": "Added to wishlist", "added": True})


# --------------------------------------------------
# Order APIs
# --------------------------------------------------
@app.route("/api/order", methods=["POST"])
def create_order():
    email = get_logged_in_email()

    if not email:
        return jsonify({"success": False, "message": "Please login first"}), 401

    data = request.json
    cart_items = data.get("items", [])

    if not cart_items:
        return jsonify({"success": False, "message": "Cart is empty"}), 400

    order = Order(
        user_email=email,
        customer_name=data.get("name"),
        email=data.get("email"),
        phone=data.get("phone"),
        address=data.get("address"),
        payment=data.get("payment"),
        total=0,
    )

    db.session.add(order)
    db.session.flush()

    total = 0

    for item in cart_items:
        product = Product.query.get(item["id"])

        if not product:
            continue

        quantity = int(item.get("quantity", 1))
        total += product.price * quantity

        db.session.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                size=item.get("size", "N/A"),
                price=product.price,
                quantity=quantity,
            )
        )

    order.total = total
    db.session.commit()

    return jsonify(
        {
            "success": True,
            "message": "Payment successful! Order placed.",
            "order_id": order.id,
            "total": total,
        }
    )


@app.route("/api/order/<int:order_id>/cancel", methods=["POST"])
def cancel_order(order_id):
    email = get_logged_in_email()

    if not email:
        return jsonify({"success": False, "message": "Please login first"}), 401

    order = Order.query.filter_by(id=order_id, user_email=email).first()

    if not order:
        return jsonify({"success": False, "message": "Order not found"}), 404

    if order.status == "Cancelled":
        return jsonify({"success": False, "message": "Order already cancelled"}), 400

    order.status = "Cancelled"
    db.session.commit()

    return jsonify({"success": True, "message": f"Order #{order_id} cancelled successfully"})


# --------------------------------------------------
# Run App
# --------------------------------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        seed_products()

    app.run(debug=True)
