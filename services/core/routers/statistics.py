from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from shared.database import get_db
from shared.models import Communication

router = APIRouter()

@router.get("/statistics/communications/by-month", tags=["Statistics"])
def get_communication_stats_by_month(db: Session = Depends(get_db)):
    """
    Calculates the number of unique communication sessions per month for the current year.
    """
    current_year = datetime.utcnow().year

    # Query to get the count of distinct session_ids per month for the current year
    stats = (
        db.query(
            func.extract('month', Communication.created_at).label('month'),
            func.count(func.distinct(Communication.session_id)).label('count')
        )
        .filter(func.extract('year', Communication.created_at) == current_year)
        .group_by(func.extract('month', Communication.created_at))
        .all()
    )

    # Initialize a list of 12 zeros for the year's data
    monthly_data = [0] * 12

    # Populate the list with the data from the query
    for row in stats:
        # month is 1-indexed, so subtract 1 for 0-indexed list
        month_index = int(row.month) - 1
        if 0 <= month_index < 12:
            monthly_data[month_index] = row.count

    response_data = {
        "current_year": {
            "name": "This Year",
            "data": monthly_data
        }
    }

    return response_data
