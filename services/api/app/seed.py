from datetime import UTC, datetime, timedelta
from decimal import Decimal
import random

from faker import Faker

from app.database import SessionLocal, create_all
from app.models import Customer, Order

fake = Faker("en_IN")
CITIES = ["Hyderabad", "Bengaluru", "Mumbai", "Delhi", "Pune", "Chennai", "Kolkata", "Ahmedabad"]
CATEGORIES = ["Fashion", "Beauty", "Grocery", "Electronics", "Home", "Footwear"]
CHANNELS = ["email", "whatsapp", "sms", "rcs"]


def segment_profile(index: int) -> tuple[int, int]:
    if index < 60:
        return 8, 35
    if index < 170:
        return 2, 25
    if index < 300:
        return 1, 120
    if index < 410:
        return 4, 75
    return 1, 10


def main() -> None:
    create_all()
    db = SessionLocal()
    try:
        if db.query(Customer).count():
            print("Seed skipped: customers already exist.")
            return

        customers: list[Customer] = []
        for index in range(500):
            order_count, max_age = segment_profile(index)
            last_order = datetime.now(UTC) - timedelta(days=random.randint(1, max_age))
            customer = Customer(
                name=fake.name(),
                email=f"customer{index + 1}@example.com",
                phone=fake.phone_number()[:32],
                city=random.choice(CITIES),
                preferred_channel=random.choice(CHANNELS),
                total_spent=Decimal("0"),
                last_order_date=last_order,
                created_at=datetime.now(UTC) - timedelta(days=random.randint(30, 700)),
            )
            db.add(customer)
            db.flush()
            total = Decimal("0")
            for _ in range(order_count):
                amount = Decimal(random.randint(350, 8500))
                total += amount
                db.add(
                    Order(
                        customer_id=customer.id,
                        amount=amount,
                        category=random.choice(CATEGORIES),
                        order_date=last_order - timedelta(days=random.randint(0, 240)),
                    )
                )
            customer.total_spent = total
            customers.append(customer)

        while db.query(Order).count() < 2000:
            customer = random.choice(customers)
            amount = Decimal(random.randint(250, 6500))
            customer.total_spent += amount
            order_date = datetime.now(UTC) - timedelta(days=random.randint(1, 365))
            if not customer.last_order_date or order_date > customer.last_order_date:
                customer.last_order_date = order_date
            db.add(Order(customer_id=customer.id, amount=amount, category=random.choice(CATEGORIES), order_date=order_date))

        db.commit()
        print("Seeded 500 customers and 2000 orders.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
