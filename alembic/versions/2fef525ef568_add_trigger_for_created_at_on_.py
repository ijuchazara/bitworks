"""Add trigger for created_at on communication

Revision ID: 2fef525ef568
Revises: 4435f9e43c3a
Create Date: 2024-07-15 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2fef525ef568'
down_revision: Union[str, None] = '4435f9e43c3a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create the trigger function
    op.execute("""
    CREATE OR REPLACE FUNCTION set_created_at_on_communication()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.created_at IS NULL THEN
            NEW.created_at = NOW();
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    # 2. Create the trigger that uses the function
    op.execute("""
    CREATE TRIGGER trg_communication_set_created_at
    BEFORE INSERT ON communication
    FOR EACH ROW
    EXECUTE FUNCTION set_created_at_on_communication();
    """)


def downgrade() -> None:
    # Drop the trigger and the function in reverse order
    op.execute("DROP TRIGGER IF EXISTS trg_communication_set_created_at ON communication;")
    op.execute("DROP FUNCTION IF EXISTS set_created_at_on_communication();")
