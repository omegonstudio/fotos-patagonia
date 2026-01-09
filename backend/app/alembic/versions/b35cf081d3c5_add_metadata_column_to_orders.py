"""Add metadata JSON column to orders

Revision ID: b35cf081d3c5
Revises: 86e79dade900
Create Date: 2026-01-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b35cf081d3c5'
down_revision = '86e79dade900'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('orders', sa.Column('metadata', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('orders', 'metadata')

