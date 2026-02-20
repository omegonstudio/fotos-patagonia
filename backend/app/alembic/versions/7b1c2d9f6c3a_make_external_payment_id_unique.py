"""Make external_payment_id unique on orders

Revision ID: 7b1c2d9f6c3a
Revises: 3ad2ffc8a500
Create Date: 2026-02-20

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "7b1c2d9f6c3a"
down_revision = "3ad2ffc8a500"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # En PostgreSQL, UNIQUE permite múltiples NULLs, pero evita duplicados no-nulos.
    # Si existen duplicados previos en producción, esta migración fallará hasta que se limpien.
    op.create_unique_constraint(
        "uq_orders_external_payment_id",
        "orders",
        ["external_payment_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_orders_external_payment_id", "orders", type_="unique")


