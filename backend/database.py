from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# The connection string: tells SQLAlchemy exactly how to reach the database.
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
DATABASE_URL = "postgresql://postgres:netguard123@localhost:5432/netguard"

# The engine is the core connection to the database.
engine = create_engine(DATABASE_URL)

# A session is how we actually run operations (add rows, query, etc.).
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class that our table definitions will inherit from.
Base = declarative_base()

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime, timezone

# This class defines the "detections" table.
# Each attribute becomes a column. This is the ORM: a Python class = a table.
class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    prediction = Column(String, nullable=False)
    is_attack = Column(Boolean, nullable=False)
    confidence = Column(Float, nullable=False)

    # Create all defined tables in the database (if they don't already exist)
Base.metadata.create_all(bind=engine)